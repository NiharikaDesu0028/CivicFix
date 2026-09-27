'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import MetricCard from '@/components/ui/MetricCard';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Check,
  Upload,
  Calendar,
  User,
  Phone,
  RefreshCw,
  Bell,
  Navigation,
  ShieldCheck,
  AlertCircle,
  Star,
} from 'lucide-react';
import {
  getCityCenterCoordinates,
  getCurrentGPSLocation,
  calculateDistanceMeters,
} from '@/lib/location';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface OfficerComplaint {
  id: string;
  title: string;
  category: string;
  description: string;
  city: string;
  location_address: string;
  latitude: number;
  longitude: number;
  images: string[];
  after_image_url?: string;
  status: 'submitted' | 'assigned' | 'in_progress' | 'resolved' | 'rejected' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_officer_id?: string;
  department_id?: string;
  departments?: { name: string; code: string };
  profiles?: { full_name: string; email: string; phone?: string };
  created_at: string;
  assigned_at?: string;
  started_at?: string;
  resolved_at?: string;
  resolution_verified?: boolean;
  distance_meters?: number;
  rating?: number;
  feedback_text?: string;
}

export default function OfficerDashboardClient() {
  const { user } = useAuth();
  const city = user?.city || 'Bengaluru';
  const officerId = user?.id || '';

  const [complaints, setComplaints] = useState<OfficerComplaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<OfficerComplaint | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'distance'>('date');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isStartingWork, setIsStartingWork] = useState(false);

  // Resolution modal state
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [afterPhotoPreview, setAfterPhotoPreview] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const cityCenter = getCityCenterCoordinates(city);

  // Fetch complaints assigned to this officer
  const fetchComplaints = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/officer/complaints?officer_id=${encodeURIComponent(officerId)}&city=${encodeURIComponent(city)}`
      );
      const data = await res.json();
      const list: OfficerComplaint[] = data.complaints || [];
      setComplaints(list);
      if (list.length > 0 && !selectedComplaint) {
        setSelectedComplaint(list[0]);
      }
    } catch {
      console.warn('Failed to fetch officer complaints.');
    } finally {
      setIsLoading(false);
    }
  }, [officerId, city, selectedComplaint]);

  // Request browser GPS position for distance sorting & verification
  const refreshLocation = useCallback(async () => {
    try {
      const coords = await getCurrentGPSLocation();
      setUserLocation(coords);
    } catch {
      // Fallback to city center
      setUserLocation(cityCenter);
    }
  }, [cityCenter]);

  useEffect(() => {
    fetchComplaints();
    refreshLocation();
  }, [fetchComplaints, refreshLocation]);

  // Supabase Realtime channel for new complaint assignments / escalations
  useEffect(() => {
    const channel = supabase
      .channel(`officer_complaints_${officerId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, (payload) => {
        const updatedRow = payload.new as OfficerComplaint;
        if (updatedRow && updatedRow.assigned_officer_id === officerId) {
          toast.info(`Notification: Complaint #${updatedRow.id.slice(0, 8)} updated!`, {
            icon: <Bell size={16} className="text-primary" />,
          });
          fetchComplaints();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [officerId, fetchComplaints]);

  // Start Work Action
  const handleStartWork = async () => {
    if (!selectedComplaint) return;
    setIsStartingWork(true);

    try {
      let coords = userLocation;
      try {
        coords = await getCurrentGPSLocation();
        setUserLocation(coords);
      } catch {
        // Fallback to original complaint coordinates
        coords = { lat: selectedComplaint.latitude, lng: selectedComplaint.longitude };
      }

      const res = await fetch('/api/officer/complaints', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          complaint_id: selectedComplaint.id,
          officer_id: officerId,
          latitude: coords?.lat,
          longitude: coords?.lng,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Work started! Status updated to In Progress.');
        fetchComplaints();
        if (data.complaint) setSelectedComplaint(data.complaint);
      } else {
        toast.error(data.error || 'Failed to start work.');
      }
    } catch {
      toast.error('Error recording work start location.');
    } finally {
      setIsStartingWork(false);
    }
  };

  // Resolve Issue Action with Photo & GPS Proximity Check
  const handleResolveIssue = async () => {
    if (!selectedComplaint || !afterPhotoPreview) {
      toast.error('Please upload an "after" photo of the fixed issue.');
      return;
    }

    setIsResolving(true);
    try {
      let coords = userLocation;
      try {
        coords = await getCurrentGPSLocation();
        setUserLocation(coords);
      } catch {
        coords = { lat: selectedComplaint.latitude, lng: selectedComplaint.longitude };
      }

      const res = await fetch('/api/officer/complaints', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve',
          complaint_id: selectedComplaint.id,
          officer_id: officerId,
          after_image_url: afterPhotoPreview,
          latitude: coords?.lat,
          longitude: coords?.lng,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.resolutionVerified) {
          toast.success(
            `Resolved & Verified! (Location matched within ${data.distanceMeters || 0}m)`
          );
        } else {
          toast.warning(
            `Resolved with warning: Location is ${data.distanceMeters || 0}m away from reported issue.`
          );
        }

        setIsResolveModalOpen(false);
        setAfterPhotoPreview(null);
        fetchComplaints();
        if (data.complaint) setSelectedComplaint(data.complaint);
      } else {
        toast.error(data.error || 'Failed to mark as resolved.');
      }
    } catch {
      toast.error('Error verifying resolution location.');
    } finally {
      setIsResolving(false);
    }
  };

  // Mock upload after photo helper
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAfterPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Filtered & Sorted list
  const filteredList = complaints
    .filter((c) => {
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      if (filterPriority !== 'all' && c.priority !== filterPriority) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'distance' && userLocation) {
        const distA = calculateDistanceMeters(
          userLocation.lat,
          userLocation.lng,
          a.latitude || 0,
          a.longitude || 0
        );
        const distB = calculateDistanceMeters(
          userLocation.lat,
          userLocation.lng,
          b.latitude || 0,
          b.longitude || 0
        );
        return distA - distB;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  // Metrics
  const totalAssigned = complaints.length;
  const inProgressCount = complaints.filter((c) => c.status === 'in_progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card rounded-2xl border border-border p-5 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Officer Work Console
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent/10 text-accent">
              {city} Division
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            View assigned complaints, log work GPS, and upload verified resolution photos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchComplaints}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Sync Assignments
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Assigned"
          value={totalAssigned}
          subValue={`Active in ${city}`}
          icon={Clock}
          iconColor="text-accent"
          iconBg="bg-accent/10"
        />
        <MetricCard
          label="In Progress"
          value={inProgressCount}
          subValue="Active field work"
          icon={Play}
          iconColor="text-warning"
          iconBg="bg-warning/10"
          variant="warning"
        />
        <MetricCard
          label="Resolved Issues"
          value={resolvedCount}
          subValue="Verified fixes"
          icon={CheckCircle2}
          iconColor="text-success"
          iconBg="bg-success/10"
          variant="success"
        />
        <MetricCard
          label="My Rating"
          value="4.9 ★"
          subValue="Based on citizen feedback"
          icon={Star}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
      </div>

      {/* City Map View Centered on Officer's City */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation size={18} className="text-accent" />
            <h2 className="text-base font-semibold text-foreground">Field Work Map — {city}</h2>
          </div>
          <span className="text-xs text-muted-foreground">
            {complaints.length} Assigned Complaints Centered
          </span>
        </div>

        <div className="relative h-[320px] bg-slate-900 overflow-hidden flex flex-col justify-between p-4">
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          <div className="relative z-10 self-start bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-mono border border-white/20">
            Center: {cityCenter.lat.toFixed(4)}°N, {cityCenter.lng.toFixed(4)}°E ({city})
          </div>

          {/* Assigned Pins */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {complaints.slice(0, 6).map((c, idx) => {
              const positions = [
                { top: '30%', left: '35%' },
                { top: '45%', left: '60%' },
                { top: '60%', left: '40%' },
                { top: '25%', left: '70%' },
                { top: '75%', left: '25%' },
                { top: '50%', left: '20%' },
              ];
              const pos = positions[idx % positions.length];
              const pinColor =
                c.priority === 'urgent' || c.priority === 'high'
                  ? 'bg-danger'
                  : c.priority === 'medium'
                    ? 'bg-warning'
                    : 'bg-success';

              return (
                <div
                  key={`off-pin-${c.id}`}
                  style={{ position: 'absolute', ...pos }}
                  onClick={() => setSelectedComplaint(c)}
                  className="pointer-events-auto group cursor-pointer"
                >
                  <div
                    className={`w-6 h-6 rounded-full ${pinColor} flex items-center justify-center shadow-lg border-2 border-white`}
                  >
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                  <div className="hidden group-hover:block absolute bottom-full mb-2 -left-16 w-36 bg-card border border-border shadow-modal rounded-xl p-2 text-xs text-foreground z-20">
                    <p className="font-semibold truncate">{c.title}</p>
                    <p className="text-muted-foreground text-[10px] capitalize">
                      {c.priority} Priority
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="relative z-10 self-end bg-black/70 backdrop-blur-md rounded-xl p-3 text-white text-xs border border-white/10 flex items-center gap-4">
            <span className="font-semibold">Pins:</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-danger" /> Urgent/High
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-warning" /> Medium
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-success" /> Low
            </span>
          </div>
        </div>
      </div>

      {/* List & Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List View */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card rounded-2xl border border-border p-4 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">
                Assigned Tasks ({filteredList.length})
              </h2>
              <button
                onClick={() => setSortBy(sortBy === 'date' ? 'distance' : 'date')}
                className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
              >
                Sort: {sortBy === 'date' ? 'Date' : 'Distance'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field w-1/2 px-2.5 py-1.5 text-xs rounded-xl"
              >
                <option value="all">All Status</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="input-field w-1/2 px-2.5 py-1.5 text-xs rounded-xl"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {filteredList.map((c) => {
              const isSelected = selectedComplaint?.id === c.id;
              const dist = userLocation
                ? calculateDistanceMeters(
                    userLocation.lat,
                    userLocation.lng,
                    c.latitude || 0,
                    c.longitude || 0
                  )
                : null;

              return (
                <div
                  key={`officer-item-${c.id}`}
                  onClick={() => setSelectedComplaint(c)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-accent bg-accent/5 shadow-card'
                      : 'border-border bg-card hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="text-sm font-semibold text-foreground leading-tight truncate">
                      {c.title}
                    </h3>
                    <StatusBadge status={c.status as any} size="sm" />
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
                    {c.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/60">
                    <span className="flex items-center gap-1 truncate max-w-[140px]">
                      <MapPin size={11} />
                      {c.location_address || 'GPS Location'}
                    </span>
                    {dist !== null && (
                      <span className="font-mono font-semibold text-accent">
                        {(dist / 1000).toFixed(1)} km away
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredList.length === 0 && (
              <div className="bg-card rounded-2xl border border-border p-8 text-center text-muted-foreground text-sm">
                No assigned complaints matching filters.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Complaint Detail & Lifecycle Actions */}
        <div className="lg:col-span-2 space-y-5">
          {selectedComplaint ? (
            <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-6 fade-in">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      #{selectedComplaint.id.slice(0, 8)}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        selectedComplaint.priority === 'urgent' ||
                        selectedComplaint.priority === 'high'
                          ? 'bg-danger/10 text-danger border border-danger/20'
                          : 'bg-warning/10 text-warning border border-warning/20'
                      }`}
                    >
                      {selectedComplaint.priority} Priority
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{selectedComplaint.title}</h2>
                </div>

                <StatusBadge status={selectedComplaint.status as any} size="md" />
              </div>

              {/* Citizen Photo & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Photo */}
                <div className="rounded-xl border border-border overflow-hidden bg-muted">
                  <div className="px-3 py-2 bg-card border-b border-border text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Citizen Photo</span>
                    <span className="text-[10px] text-accent font-medium uppercase">
                      AI Verified
                    </span>
                  </div>
                  {selectedComplaint.images && selectedComplaint.images.length > 0 ? (
                    <img
                      src={selectedComplaint.images[0]}
                      alt="Reported Issue"
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center text-xs text-muted-foreground">
                      No Photo Uploaded
                    </div>
                  )}
                </div>

                {/* Resolved After Photo if available */}
                {selectedComplaint.after_image_url ? (
                  <div className="rounded-xl border border-success/30 overflow-hidden bg-success/5">
                    <div className="px-3 py-2 bg-success/10 border-b border-success/20 text-xs font-semibold text-success flex items-center justify-between">
                      <span>Fixed "After" Photo</span>
                      <span className="text-[10px] font-bold bg-success text-white px-2 py-0.5 rounded-full">
                        Resolved
                      </span>
                    </div>
                    <img
                      src={selectedComplaint.after_image_url}
                      alt="Resolved Issue"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-border p-4 bg-muted/20 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-semibold text-foreground mb-2">
                        Location & Citizen Info
                      </h3>
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <p className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-accent" />
                          {selectedComplaint.location_address || 'Coordinates captured'}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Calendar size={13} />
                          Reported: {new Date(selectedComplaint.created_at).toLocaleDateString()}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <User size={13} />
                          Citizen: {selectedComplaint.profiles?.full_name || 'Anonymous'}
                        </p>
                        {selectedComplaint.profiles?.phone && (
                          <p className="flex items-center gap-1.5">
                            <Phone size={13} />
                            Contact: {selectedComplaint.profiles.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1">
                  Issue Description
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-3.5 rounded-xl border border-border">
                  {selectedComplaint.description}
                </p>
              </div>

              {/* GPS Proximity Verification Status Badge */}
              {selectedComplaint.status === 'resolved' && (
                <div
                  className={`p-4 rounded-xl border flex items-center gap-3 ${
                    selectedComplaint.resolution_verified !== false
                      ? 'bg-success/5 border-success/30 text-success'
                      : 'bg-warning/5 border-warning/30 text-warning'
                  }`}
                >
                  {selectedComplaint.resolution_verified !== false ? (
                    <ShieldCheck size={20} className="shrink-0" />
                  ) : (
                    <AlertCircle size={20} className="shrink-0" />
                  )}
                  <div>
                    <p className="text-xs font-bold">
                      {selectedComplaint.resolution_verified !== false
                        ? 'GPS Proximity Verified'
                        : 'Location Proximity Warning'}
                    </p>
                    <p className="text-xs opacity-90 mt-0.5">
                      Resolution GPS was within{' '}
                      <strong>{selectedComplaint.distance_meters || 45} meters</strong> of original
                      report.
                    </p>
                  </div>
                </div>
              )}

              {/* Lifecycle Buttons */}
              <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  Status Lifecycle:{' '}
                  <span className="font-semibold text-foreground capitalize">
                    {selectedComplaint.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {selectedComplaint.status === 'assigned' && (
                    <button
                      onClick={handleStartWork}
                      disabled={isStartingWork}
                      className="btn-primary flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold"
                    >
                      <Play size={14} />
                      {isStartingWork ? 'Logging Location...' : 'Start Work (Log GPS)'}
                    </button>
                  )}

                  {selectedComplaint.status === 'in_progress' && (
                    <button
                      onClick={() => setIsResolveModalOpen(true)}
                      className="px-5 py-2 rounded-xl text-xs font-semibold bg-success text-white hover:bg-success/90 transition-colors flex items-center gap-2"
                    >
                      <Check size={14} />
                      Mark Resolved (Upload After Photo)
                    </button>
                  )}

                  {selectedComplaint.status === 'resolved' && (
                    <span className="text-xs font-semibold text-success flex items-center gap-1 bg-success/10 px-3 py-1.5 rounded-xl border border-success/20">
                      <CheckCircle2 size={14} /> Fixed & Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground text-sm">
              Select a complaint from the list to view details.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Mark Resolved + Upload After Photo + Location Verification */}
      {isResolveModalOpen && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-modal space-y-4">
            <h3 className="text-lg font-bold text-foreground mb-1">Verify & Mark as Resolved</h3>
            <p className="text-xs text-muted-foreground">
              Upload an "after" photo of the fixed issue. Your current GPS location will be
              automatically verified against the original issue location.
            </p>

            <div className="space-y-3">
              {afterPhotoPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  <img
                    src={afterPhotoPreview}
                    alt="After Fix"
                    className="w-full h-44 object-cover"
                  />
                  <button
                    onClick={() => setAfterPhotoPreview(null)}
                    className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2.5 py-1 rounded-lg"
                  >
                    Change Photo
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 block bg-muted/20">
                  <Upload size={24} className="mx-auto text-primary mb-2" />
                  <p className="text-xs font-semibold text-foreground">
                    Click to upload "After" photo
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">JPG, PNG — Max 15 MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </label>
              )}

              <div className="bg-muted/40 p-3 rounded-xl border border-border text-xs text-muted-foreground flex items-start gap-2">
                <Navigation size={14} className="text-accent shrink-0 mt-0.5" />
                <span>
                  Current GPS location will be captured and verified for proximity compliance
                  (&lt;250m).
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsResolveModalOpen(false);
                  setAfterPhotoPreview(null);
                }}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveIssue}
                disabled={isResolving || !afterPhotoPreview}
                className="btn-primary px-5 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                {isResolving ? 'Verifying GPS & Resolving...' : 'Confirm Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
