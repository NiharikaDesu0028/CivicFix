'use client';
import React, { useState, useEffect, useCallback } from 'react';
import CitizenLayout from '@/components/CitizenLayout';
import RouteGuard from '@/components/RouteGuard';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  UserCheck,
  Wrench,
  Building2,
  Tag,
  AlertTriangle,
  Zap,
  Trash2,
  Droplets,
  Construction,
  TreePine,
  TrafficCone,
  Image as ImageIcon,
  Star,
  Flag,
  Send,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

type IssueCategory =
  | 'pothole'
  | 'garbage'
  | 'streetlight'
  | 'water-leakage'
  | 'blocked-drain'
  | 'traffic-signal'
  | 'fallen-tree';

const categoryConfig: Record<
  string,
  { label: string; Icon: React.ElementType; color: string; bg: string }
> = {
  pothole: { label: 'Pothole', Icon: Construction, color: 'text-orange-600', bg: 'bg-orange-50' },
  garbage: { label: 'Garbage', Icon: Trash2, color: 'text-red-600', bg: 'bg-red-50' },
  streetlight: { label: 'Streetlight', Icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  'water-leakage': {
    label: 'Water Leakage',
    Icon: Droplets,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  'blocked-drain': {
    label: 'Blocked Drain',
    Icon: AlertTriangle,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  'traffic-signal': {
    label: 'Traffic Signal',
    Icon: TrafficCone,
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  'fallen-tree': {
    label: 'Fallen Tree',
    Icon: TreePine,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
  },
};

const statusMap: Record<string, string> = {
  submitted: 'received',
  assigned: 'assigned',
  in_progress: 'in-progress',
  resolved: 'resolved',
  rejected: 'rejected',
  escalated: 'received',
};

interface TimelineEvent {
  id: string;
  previous_status: string | null;
  new_status: string | null;
  message: string;
  created_at: string;
  author_id: string | null;
}

interface ComplaintDetail {
  id: string;
  title: string;
  category: string;
  description: string;
  city: string;
  location_address: string;
  latitude: number;
  longitude: number;
  images: string[];
  after_image_url: string | null;
  status: string;
  priority: string;
  citizen_id: string;
  assigned_officer_id: string | null;
  department_id: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  resolution_verified: boolean | null;
  distance_meters: number | null;
  rating: number | null;
  feedback_text: string | null;
  is_recurrence: boolean;
  parent_complaint_id: string | null;
  upvote_count: number;
  profiles?: { full_name: string; email: string };
  assigned?: { full_name: string };
  departments?: { name: string; code: string };
}

const priorityColors: Record<string, string> = {
  low: 'text-muted-foreground bg-muted',
  medium: 'text-info bg-info/10',
  high: 'text-warning bg-warning/10',
  urgent: 'text-danger bg-danger/10',
  critical: 'text-danger bg-danger/10',
};

export default function ComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const complaintId = params.id as string;

  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Rating state
  const [ratingValue, setRatingValue] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const fetchComplaint = useCallback(async () => {
    if (!complaintId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/complaints/${complaintId}`);
      const data = await res.json();
      if (data.complaint) {
        setComplaint(data.complaint);
        setTimeline(data.timeline || []);
        if (data.complaint.rating) {
          setRatingValue(data.complaint.rating);
          setRatingSubmitted(true);
        }
      }
    } catch {
      console.warn('Failed to fetch complaint details.');
    } finally {
      setIsLoading(false);
    }
  }, [complaintId]);

  useEffect(() => {
    fetchComplaint();
  }, [fetchComplaint]);

  const handleSubmitRating = async () => {
    if (!complaint || ratingValue === 0) return;
    setIsSubmittingRating(true);
    try {
      const res = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: ratingValue, feedback_text: feedbackText }),
      });
      if (res.ok) {
        toast.success('Thank you for your feedback!');
        setRatingSubmitted(true);
        fetchComplaint();
      } else {
        toast.error('Failed to submit rating.');
      }
    } catch {
      toast.error('Network error submitting feedback.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleFlagRecurrence = () => {
    router.push(
      `/report-an-issue?recurrence=true&parent_id=${complaintId}&category=${complaint?.category || ''}`
    );
  };

  if (isLoading) {
    return (
      <RouteGuard allowedRole="citizen">
        <CitizenLayout activePage="complaints">
          <div className="space-y-4 animate-pulse">
            <div className="h-6 bg-muted rounded w-48" />
            <div className="h-10 bg-muted rounded w-3/4" />
            <div className="h-64 bg-muted rounded-2xl" />
          </div>
        </CitizenLayout>
      </RouteGuard>
    );
  }

  if (!complaint) {
    return (
      <RouteGuard allowedRole="citizen">
        <CitizenLayout activePage="complaints">
          <div className="text-center py-16">
            <AlertTriangle size={40} className="mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-bold text-foreground mb-2">Complaint Not Found</h2>
            <Link
              href="/citizen-dashboard"
              className="text-primary text-sm font-semibold hover:underline"
            >
              Back to My Complaints
            </Link>
          </div>
        </CitizenLayout>
      </RouteGuard>
    );
  }

  const cat = categoryConfig[complaint.category] || categoryConfig.pothole;
  const CatIcon = cat.Icon;
  const displayStatus = statusMap[complaint.status] || 'received';
  const created = new Date(complaint.created_at);
  const filedDate = created.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const lastUpdated = new Date(complaint.updated_at).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const statusOrder = ['received', 'assigned', 'in-progress', 'resolved'];
  const currentStep = statusOrder.indexOf(displayStatus);

  const timelineIcons: Record<string, React.ElementType> = {
    submitted: Clock,
    assigned: UserCheck,
    in_progress: Wrench,
    resolved: CheckCircle2,
    escalated: AlertTriangle,
  };

  return (
    <RouteGuard allowedRole="citizen">
      <CitizenLayout activePage="complaints">
        {/* Back nav */}
        <div className="mb-5">
          <Link
            href="/citizen-dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Back to My Complaints
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="flex items-start gap-3">
            <div
              className={`w-11 h-11 rounded-xl ${cat.bg} flex items-center justify-center shrink-0`}
            >
              <CatIcon size={22} className={cat.color} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  #{complaint.id.slice(0, 8)}
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${priorityColors[complaint.priority] || priorityColors.medium}`}
                >
                  {complaint.priority.charAt(0).toUpperCase() + complaint.priority.slice(1)}{' '}
                  Priority
                </span>
                {complaint.is_recurrence && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    <RefreshCw size={10} className="inline mr-1" />
                    Recurrence
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-foreground">{complaint.title}</h1>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin size={11} />
                  {complaint.location_address || complaint.city}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={11} />
                  Filed {filedDate}
                </span>
              </div>
            </div>
          </div>
          <StatusBadge status={displayStatus as any} size="md" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Before Photo */}
            <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <ImageIcon size={16} className="text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Reported Photo</h2>
              </div>
              <div className="relative aspect-video bg-muted">
                {complaint.images && complaint.images.length > 0 ? (
                  <img
                    src={complaint.images[0]}
                    alt="Reported Issue"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon size={40} className="text-muted-foreground" />
                  </div>
                )}
                <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/70 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                  AI: {cat.label} · Auto-classified
                </div>
              </div>
            </div>

            {/* After Photo (when resolved) */}
            {complaint.status === 'resolved' && complaint.after_image_url && (
              <div className="bg-card rounded-2xl border border-success/30 shadow-card overflow-hidden">
                <div className="px-5 py-4 border-b border-success/20 bg-success/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-success" />
                    <h2 className="text-sm font-semibold text-success">Resolution — After Photo</h2>
                  </div>
                  {complaint.resolution_verified !== false && (
                    <span className="text-[10px] font-bold bg-success text-white px-2 py-0.5 rounded-full uppercase">
                      GPS Verified
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-0">
                  <div className="relative">
                    <p className="absolute top-2 left-2 text-[10px] font-bold bg-black/60 text-white px-2 py-0.5 rounded-full uppercase z-10">
                      Before
                    </p>
                    <img
                      src={complaint.images?.[0] || ''}
                      alt="Before"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  <div className="relative">
                    <p className="absolute top-2 left-2 text-[10px] font-bold bg-success text-white px-2 py-0.5 rounded-full uppercase z-10">
                      After
                    </p>
                    <img
                      src={complaint.after_image_url}
                      alt="After"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Map */}
            <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <MapPin size={16} className="text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Complaint Location</h2>
              </div>
              <div className="relative">
                <div className="h-48 bg-gradient-to-br from-blue-50 to-teal-50 flex flex-col items-center justify-center gap-3 relative overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage:
                        'linear-gradient(#0f6fbd 1px, transparent 1px), linear-gradient(90deg, #0f6fbd 1px, transparent 1px)',
                      backgroundSize: '40px 40px',
                    }}
                  />
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-danger rounded-full flex items-center justify-center shadow-lg pulse-ring">
                      <MapPin size={20} className="text-white" />
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-md text-center">
                      <p className="text-xs font-semibold text-foreground">
                        {complaint.location_address || complaint.city}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {complaint.latitude?.toFixed(4)}°N, {complaint.longitude?.toFixed(4)}°E
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-card rounded-2xl border border-border shadow-card p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3">Description</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {complaint.description}
              </p>
            </div>

            {/* Post-Resolution Feedback */}
            {complaint.status === 'resolved' && !ratingSubmitted && (
              <div className="bg-card rounded-2xl border border-primary/20 shadow-card p-5">
                <h2 className="text-sm font-semibold text-foreground mb-1">Rate the Resolution</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  How satisfied are you with how this issue was resolved?
                </p>

                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={`star-${star}`}
                      onClick={() => setRatingValue(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        size={28}
                        className={
                          star <= ratingValue
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-muted-foreground/30'
                        }
                      />
                    </button>
                  ))}
                  {ratingValue > 0 && (
                    <span className="ml-2 text-xs font-semibold text-amber-600">
                      {ratingValue}/5
                    </span>
                  )}
                </div>

                <textarea
                  placeholder="Optional: Tell us more about the resolution quality..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={3}
                  className="input-field w-full px-3.5 py-2 text-sm rounded-xl mb-3 resize-none"
                />

                <div className="flex items-center justify-between">
                  <button
                    onClick={handleFlagRecurrence}
                    className="flex items-center gap-1.5 text-xs font-semibold text-warning hover:text-warning/80 transition-colors"
                  >
                    <Flag size={13} />
                    Issue has reappeared
                  </button>

                  <button
                    onClick={handleSubmitRating}
                    disabled={ratingValue === 0 || isSubmittingRating}
                    className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
                  >
                    <Send size={13} />
                    {isSubmittingRating ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </div>
            )}

            {/* Rating already submitted */}
            {complaint.status === 'resolved' && ratingSubmitted && (
              <div className="bg-success/5 rounded-2xl border border-success/20 p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-success" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Feedback Submitted</p>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={`rated-${s}`}
                          size={14}
                          className={
                            s <= (complaint.rating || ratingValue)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-muted-foreground/20'
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleFlagRecurrence}
                  className="flex items-center gap-1.5 text-xs font-semibold text-warning bg-warning/10 px-3 py-1.5 rounded-xl hover:bg-warning/20 transition-colors"
                >
                  <Flag size={13} />
                  Flag Recurrence
                </button>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Details card */}
            <div className="bg-card rounded-2xl border border-border shadow-card p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Complaint Details</h2>
              <div className="space-y-3">
                {[
                  { icon: Tag, label: 'AI Category', value: cat.label },
                  {
                    icon: Building2,
                    label: 'Department',
                    value: complaint.departments?.name || 'Municipal Services',
                  },
                  { icon: MapPin, label: 'City', value: complaint.city || 'Bengaluru' },
                  {
                    icon: UserCheck,
                    label: 'Assigned Officer',
                    value: complaint.assigned?.full_name || 'Pending Assignment',
                  },
                  { icon: Calendar, label: 'Filed On', value: filedDate },
                  { icon: Clock, label: 'Last Updated', value: lastUpdated },
                ].map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <div key={`detail-${item.label}`} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <ItemIcon size={13} className="text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className="text-sm font-medium text-foreground">{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status Timeline */}
            <div className="bg-card rounded-2xl border border-border shadow-card p-5">
              <h2 className="text-sm font-semibold text-foreground mb-5">Status Timeline</h2>
              <div className="relative">
                <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-border" />

                <div className="space-y-6">
                  {timeline.length > 0
                    ? timeline.map((event, idx) => {
                        const EventIcon = timelineIcons[event.new_status || ''] || Clock;
                        const isLast = idx === timeline.length - 1;
                        const eventDate = new Date(event.created_at);

                        return (
                          <div key={`timeline-${event.id}`} className="flex gap-4 relative">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 transition-all ${
                                isLast
                                  ? 'bg-primary border-primary text-white shadow-md'
                                  : 'bg-primary/20 border-primary/40 text-primary'
                              }`}
                            >
                              <EventIcon size={14} />
                            </div>

                            <div className="flex-1 pb-1">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <p className="text-sm font-semibold text-foreground">
                                  {event.new_status
                                    ? event.new_status
                                        .replace('_', ' ')
                                        .replace(/\b\w/g, (l) => l.toUpperCase())
                                    : 'Update'}
                                </p>
                                {isLast && (
                                  <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
                                    Current
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {eventDate.toLocaleDateString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}{' '}
                                ·{' '}
                                {eventDate.toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                              <p className="text-xs mt-1 leading-relaxed text-muted-foreground">
                                {event.message}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    : /* Fallback static timeline */
                      statusOrder.map((status, idx) => {
                        const icons: Record<string, React.ElementType> = {
                          received: Clock,
                          assigned: UserCheck,
                          'in-progress': Wrench,
                          resolved: CheckCircle2,
                        };
                        const EventIcon = icons[status] || Clock;
                        const isReached = idx <= currentStep;
                        const isCurrent = idx === currentStep;

                        return (
                          <div key={`fallback-${status}`} className="flex gap-4 relative">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 ${
                                isReached
                                  ? isCurrent
                                    ? 'bg-primary border-primary text-white shadow-md'
                                    : 'bg-primary/20 border-primary/40 text-primary'
                                  : 'bg-card border-border text-muted-foreground'
                              }`}
                            >
                              <EventIcon size={14} />
                            </div>
                            <div className="flex-1 pb-1">
                              <p
                                className={`text-sm font-semibold ${isReached ? 'text-foreground' : 'text-muted-foreground'}`}
                              >
                                {status.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                              </p>
                              <p className="text-xs text-muted-foreground/60 mt-0.5 italic">
                                {isReached ? (isCurrent ? 'Current step' : 'Completed') : 'Pending'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CitizenLayout>
    </RouteGuard>
  );
}
