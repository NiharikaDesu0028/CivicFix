'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import MetricCard from '@/components/ui/MetricCard';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  BarChart3,
  Users,
  ShieldAlert,
  FileText,
  MapPin,
  RefreshCw,
  Plus,
  UserCheck,
  UserX,
  AlertTriangle,
  Send,
  Clock,
  Building2,
  Search,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Check,
  X,
} from 'lucide-react';
import { getCityCenterCoordinates } from '@/lib/location';
import { toast } from 'sonner';

interface HeatmapPin {
  id: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  lat: number;
  lng: number;
  address: string;
  created_at: string;
}

interface OfficerProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  city: string;
  is_active: boolean;
  department_id?: string;
  departments?: { name: string; code: string };
  resolved_count?: number;
  avg_resolution_hours?: number;
  rating?: number;
}

interface AdminComplaint {
  id: string;
  title: string;
  category: string;
  description: string;
  city: string;
  location_address: string;
  latitude: number;
  longitude: number;
  status: string;
  priority: string;
  assigned_officer_id?: string;
  assigned?: { full_name: string; email: string };
  department_id?: string;
  departments?: { name: string; code: string };
  profiles?: { full_name: string; email: string };
  created_at: string;
  assigned_at?: string;
  is_escalated?: boolean;
  escalation_reason?: string;
}

interface AdminAnalyticsClientProps {
  activeTab?: string;
}

export default function AdminAnalyticsClient({
  activeTab = 'overview',
}: AdminAnalyticsClientProps) {
  const { user } = useAuth();
  const city = user?.city || 'Bengaluru';

  // Analytics state
  const [total, setTotal] = useState(0);
  const [resolved, setResolved] = useState(0);
  const [pending, setPending] = useState(0);
  const [avgResolutionHours, setAvgResolutionHours] = useState(0);
  const [slaBreached, setSlaBreached] = useState(0);
  const [heatmap, setHeatmap] = useState<HeatmapPin[]>([]);

  // Officers state
  const [officers, setOfficers] = useState<OfficerProfile[]>([]);
  const [isOfficerModalOpen, setIsOfficerModalOpen] = useState(false);
  const [newOfficerName, setNewOfficerName] = useState('');
  const [newOfficerEmail, setNewOfficerEmail] = useState('');
  const [newOfficerDept, setNewOfficerDept] = useState('');
  const [isCreatingOfficer, setIsCreatingOfficer] = useState(false);

  // Complaints state
  const [complaints, setComplaints] = useState<AdminComplaint[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [reassignModalComplaint, setReassignModalComplaint] = useState<AdminComplaint | null>(null);
  const [selectedOfficerForReassign, setSelectedOfficerForReassign] = useState('');
  const [isSubmittingReassign, setIsSubmittingReassign] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  // City center coordinates for map view
  const cityCenter = getCityCenterCoordinates(city);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/analytics?city=${encodeURIComponent(city)}`);
      const data = await res.json();
      setTotal(data.total || 0);
      setResolved(data.resolved || 0);
      setPending(data.pending || 0);
      setAvgResolutionHours(data.avgResolutionHours || 0);
      setSlaBreached(data.slaBreached || 0);
      setHeatmap(data.heatmap || []);
    } catch {
      console.warn('Failed to load analytics.');
    }
  }, [city]);

  const fetchOfficers = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/officers?city=${encodeURIComponent(city)}`);
      const data = await res.json();
      setOfficers(data.officers || []);
    } catch {
      console.warn('Failed to load officers.');
    }
  }, [city]);

  const fetchComplaints = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/complaints?city=${encodeURIComponent(city)}`);
      const data = await res.json();
      setComplaints(data.complaints || []);
    } catch {
      console.warn('Failed to load complaints.');
    }
  }, [city]);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchAnalytics(), fetchOfficers(), fetchComplaints()]);
    setIsLoading(false);
  }, [fetchAnalytics, fetchOfficers, fetchComplaints]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Create new officer handler
  const handleCreateOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfficerName || !newOfficerEmail) return;

    setIsCreatingOfficer(true);
    try {
      const res = await fetch('/api/admin/officers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: newOfficerName,
          email: newOfficerEmail,
          department_id: newOfficerDept || null,
          city: city,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Registered officer ${newOfficerName} for ${city}!`);
        setIsOfficerModalOpen(false);
        setNewOfficerName('');
        setNewOfficerEmail('');
        fetchOfficers();
      } else {
        toast.error(data.error || 'Failed to create officer account.');
      }
    } catch {
      toast.error('Network error registering officer.');
    } finally {
      setIsCreatingOfficer(false);
    }
  };

  // Toggle active status for officer
  const handleToggleOfficerStatus = async (officerId: string, currentActive: boolean) => {
    try {
      const res = await fetch('/api/admin/officers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officer_id: officerId,
          is_active: !currentActive,
        }),
      });

      if (res.ok) {
        toast.success(`Officer status updated.`);
        fetchOfficers();
      }
    } catch {
      toast.error('Failed to update officer status.');
    }
  };

  // Execute manual reassignment
  const handleReassignSubmit = async () => {
    if (!reassignModalComplaint) return;
    setIsSubmittingReassign(true);

    try {
      const res = await fetch('/api/admin/complaints', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reassign',
          complaint_id: reassignModalComplaint.id,
          officer_id: selectedOfficerForReassign || null,
        }),
      });

      if (res.ok) {
        toast.success('Complaint reassignment updated successfully!');
        setReassignModalComplaint(null);
        refreshAll();
      }
    } catch {
      toast.error('Failed to reassign complaint.');
    } finally {
      setIsSubmittingReassign(false);
    }
  };

  // Execute manual escalation
  const handleEscalateComplaint = async (complaintId: string) => {
    try {
      const res = await fetch('/api/admin/complaints', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'escalate',
          complaint_id: complaintId,
          escalation_reason: 'Manually escalated by Admin',
        }),
      });

      if (res.ok) {
        toast.success('Escalated complaint to Admin Urgent Queue!');
        refreshAll();
      }
    } catch {
      toast.error('Failed to escalate complaint.');
    }
  };

  // Filtered complaints list
  const filteredComplaints = complaints.filter((c) => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterPriority !== 'all' && c.priority !== filterPriority) return false;
    if (
      searchQuery &&
      !c.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !c.category.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !c.id.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // SLA breach items
  const slaBreachItems = complaints.filter(
    (c) =>
      c.is_escalated ||
      (c.assigned_at &&
        new Date(c.assigned_at).getTime() < Date.now() - 24 * 60 * 60 * 1000 &&
        c.status !== 'resolved')
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card rounded-2xl border border-border p-5 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Admin Command Center
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
              {city} Municipality
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Complete oversight, officer dispatching, SLA monitoring, and citywide analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshAll}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Refresh Sync
          </button>

          {activeTab === 'officers' && (
            <button
              onClick={() => setIsOfficerModalOpen(true)}
              className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
            >
              <Plus size={15} />
              Register New Officer
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Overview & Heatmap */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Total Complaints"
              value={total}
              subValue={`Scoped to ${city}`}
              icon={FileText}
              iconColor="text-purple-600"
              iconBg="bg-purple-50"
            />
            <MetricCard
              label="Resolved Issues"
              value={resolved}
              subValue={`${total > 0 ? Math.round((resolved / total) * 100) : 0}% completion rate`}
              icon={CheckCircle2}
              iconColor="text-success"
              iconBg="bg-success/10"
              variant="success"
            />
            <MetricCard
              label="Avg Resolution Time"
              value={`${avgResolutionHours} hrs`}
              subValue="Target response: <24 hrs"
              icon={Clock}
              iconColor="text-info"
              iconBg="bg-info/10"
              variant="info"
            />
            <MetricCard
              label="SLA Breaches"
              value={slaBreached}
              subValue="Unaccepted >24 hrs"
              icon={ShieldAlert}
              iconColor="text-danger"
              iconBg="bg-danger/10"
              variant="danger"
            />
          </div>

          {/* City Heatmap & Pin Map View */}
          <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-purple-600" />
                <h2 className="text-base font-semibold text-foreground">
                  Citywide Complaint Map — {city}
                </h2>
              </div>
              <span className="text-xs text-muted-foreground">
                {heatmap.length} Active Pins Plotted
              </span>
            </div>

            {/* Interactive Map Canvas Simulation */}
            <div className="relative h-[380px] bg-slate-900 overflow-hidden flex flex-col justify-between p-4">
              {/* Grid map pattern background */}
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage:
                    'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />

              {/* Central City Coordinates Badge */}
              <div className="relative z-10 self-start bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-mono border border-white/20">
                Center: {cityCenter.lat.toFixed(4)}°N, {cityCenter.lng.toFixed(4)}°E ({city})
              </div>

              {/* Pins rendered on map grid */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {heatmap.slice(0, 8).map((pin, idx) => {
                  const offsets = [
                    { top: '25%', left: '30%' },
                    { top: '40%', left: '60%' },
                    { top: '65%', left: '45%' },
                    { top: '35%', left: '75%' },
                    { top: '70%', left: '20%' },
                    { top: '50%', left: '35%' },
                    { top: '80%', left: '65%' },
                    { top: '20%', left: '55%' },
                  ];
                  const pos = offsets[idx % offsets.length];
                  const colorClass =
                    pin.priority === 'urgent' || pin.status === 'escalated'
                      ? 'bg-danger'
                      : pin.priority === 'high'
                        ? 'bg-warning'
                        : 'bg-primary';

                  return (
                    <div
                      key={`map-pin-${pin.id}`}
                      style={{ position: 'absolute', ...pos }}
                      className="pointer-events-auto group cursor-pointer"
                    >
                      <div
                        className={`w-5 h-5 rounded-full ${colorClass} flex items-center justify-center shadow-lg border-2 border-white animate-pulse`}
                      >
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>

                      {/* Tooltip on hover */}
                      <div className="hidden group-hover:block absolute bottom-full mb-2 -left-20 w-44 bg-card border border-border shadow-modal rounded-xl p-2.5 text-xs text-foreground z-20">
                        <p className="font-semibold truncate">{pin.title}</p>
                        <p className="text-muted-foreground text-[10px] capitalize">
                          {pin.category}
                        </p>
                        <div className="mt-1 flex items-center justify-between">
                          <StatusBadge status={pin.status as any} size="sm" />
                          <span className="text-[10px] font-mono text-muted-foreground uppercase">
                            {pin.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Map Legend */}
              <div className="relative z-10 self-end bg-black/70 backdrop-blur-md rounded-xl p-3 text-white text-xs border border-white/10 flex items-center gap-4">
                <span className="font-semibold">Legend:</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-danger inline-block" /> Urgent /
                  Escalated
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-warning inline-block" /> High Priority
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-primary inline-block" /> Normal
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Manage Officers */}
      {activeTab === 'officers' && (
        <div className="space-y-5">
          <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-purple-600" />
                <h2 className="text-base font-semibold text-foreground">
                  Registered Department Officers ({officers.length})
                </h2>
              </div>
              <button
                onClick={() => setIsOfficerModalOpen(true)}
                className="btn-primary flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold"
              >
                <Plus size={14} />
                Add Officer
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-5 py-3.5">Officer</th>
                    <th className="px-5 py-3.5">Department</th>
                    <th className="px-5 py-3.5">City</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-center">Resolved</th>
                    <th className="px-5 py-3.5 text-center">Avg Time</th>
                    <th className="px-5 py-3.5 text-center">Rating</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {officers.map((officer) => (
                    <tr
                      key={`officer-row-${officer.id}`}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {officer.full_name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm">
                              {officer.full_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{officer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-medium bg-muted px-2.5 py-1 rounded-lg text-foreground">
                          {officer.departments?.name || 'General Support'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground font-medium">
                        {officer.city}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            officer.is_active !== false
                              ? 'bg-success/10 text-success'
                              : 'bg-danger/10 text-danger'
                          }`}
                        >
                          {officer.is_active !== false ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center font-semibold text-foreground font-tabular">
                        {officer.resolved_count || 0}
                      </td>
                      <td className="px-5 py-4 text-center text-xs font-tabular text-muted-foreground">
                        {officer.avg_resolution_hours || 24} hrs
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          ★ {officer.rating || 4.8}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() =>
                            handleToggleOfficerStatus(officer.id, officer.is_active !== false)
                          }
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            officer.is_active !== false
                              ? 'bg-danger/10 text-danger hover:bg-danger/20'
                              : 'bg-success/10 text-success hover:bg-success/20'
                          }`}
                        >
                          {officer.is_active !== false ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {officers.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-5 py-8 text-center text-muted-foreground text-sm"
                      >
                        No registered officers found for {city}. Click "Add Officer" to register
                        one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Complaints Overview */}
      {activeTab === 'complaints' && (
        <div className="space-y-5">
          {/* Filters Bar */}
          <div className="bg-card rounded-2xl border border-border p-4 shadow-card flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-72">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search by title, ID, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field w-full pl-9 pr-4 py-2 text-xs rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field px-3 py-2 text-xs rounded-xl"
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="escalated">Escalated</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="input-field px-3 py-2 text-xs rounded-xl"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Complaints Table */}
          <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-5 py-3.5">Complaint</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">City / Ward</th>
                    <th className="px-5 py-3.5">Assigned Officer</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-center">Priority</th>
                    <th className="px-5 py-3.5 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredComplaints.map((c) => (
                    <tr
                      key={`complaint-row-${c.id}`}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-5 py-4 max-w-xs">
                        <p className="font-semibold text-foreground text-sm truncate">{c.title}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          ID: #{c.id.slice(0, 8)}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-xs font-medium capitalize text-muted-foreground">
                        {c.category.replace('-', ' ')}
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        {c.city} ({c.location_address || 'GPS Location'})
                      </td>
                      <td className="px-5 py-4 text-xs">
                        {c.assigned?.full_name ? (
                          <span className="font-medium text-foreground">
                            {c.assigned.full_name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <StatusBadge status={c.status as any} size="sm" />
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            c.priority === 'urgent'
                              ? 'bg-danger/10 text-danger border border-danger/20'
                              : c.priority === 'high'
                                ? 'bg-warning/10 text-warning border border-warning/20'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {c.priority}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setReassignModalComplaint(c);
                            setSelectedOfficerForReassign(c.assigned_officer_id || '');
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors"
                        >
                          Reassign
                        </button>
                        {!c.is_escalated && (
                          <button
                            onClick={() => handleEscalateComplaint(c.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                          >
                            Escalate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredComplaints.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-8 text-center text-muted-foreground text-sm"
                      >
                        No complaints matching the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: SLA Monitoring */}
      {activeTab === 'sla' && (
        <div className="space-y-5">
          <div className="bg-card rounded-2xl border border-border shadow-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert size={20} className="text-danger" />
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  SLA Breach Alerts — {city}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Complaints exceeding department SLA timelines requiring immediate admin
                  intervention.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {slaBreachItems.map((c) => (
                <div
                  key={`sla-alert-${c.id}`}
                  className="p-4 rounded-xl border border-danger/20 bg-danger/5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-danger/10 text-danger flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">{c.title}</span>
                        <span className="text-[10px] font-mono font-bold bg-danger text-white px-2 py-0.5 rounded-full uppercase">
                          SLA Breach
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Category: <strong className="capitalize">{c.category}</strong> · Department:{' '}
                        {c.departments?.name || 'General'} · Assigned to:{' '}
                        {c.assigned?.full_name || 'Unassigned'}
                      </p>
                      {c.escalation_reason && (
                        <p className="text-xs text-danger mt-1 italic font-medium">
                          Reason: {c.escalation_reason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setReassignModalComplaint(c);
                        setSelectedOfficerForReassign(c.assigned_officer_id || '');
                      }}
                      className="btn-primary px-3 py-1.5 rounded-xl text-xs font-semibold"
                    >
                      Reassign Officer
                    </button>
                  </div>
                </div>
              ))}

              {slaBreachItems.length === 0 && (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  <CheckCircle2 size={32} className="mx-auto text-success mb-2" />
                  Great news! No SLA breach alerts for {city} at this time.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Register New Officer */}
      {isOfficerModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-modal">
            <h3 className="text-lg font-bold text-foreground mb-1">
              Register New Department Officer
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Officer account will be created for {city} municipality.
            </p>

            <form onSubmit={handleCreateOfficer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newOfficerName}
                  onChange={(e) => setNewOfficerName(e.target.value)}
                  className="input-field w-full px-3.5 py-2 text-sm rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="ramesh.officer@city.gov.in"
                  value={newOfficerEmail}
                  onChange={(e) => setNewOfficerEmail(e.target.value)}
                  className="input-field w-full px-3.5 py-2 text-sm rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOfficerModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingOfficer}
                  className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  {isCreatingOfficer ? 'Creating...' : 'Register Officer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reassign Complaint */}
      {reassignModalComplaint && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-modal">
            <h3 className="text-lg font-bold text-foreground mb-1">Reassign Officer</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Reassign #{reassignModalComplaint.id.slice(0, 8)} — "{reassignModalComplaint.title}"
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Select Available Officer
                </label>
                <select
                  value={selectedOfficerForReassign}
                  onChange={(e) => setSelectedOfficerForReassign(e.target.value)}
                  className="input-field w-full px-3.5 py-2 text-sm rounded-xl"
                >
                  <option value="">Unassigned (Queue)</option>
                  {officers.map((off) => (
                    <option key={`reassign-opt-${off.id}`} value={off.id}>
                      {off.full_name} ({off.departments?.name || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReassignModalComplaint(null)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReassignSubmit}
                  disabled={isSubmittingReassign}
                  className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  {isSubmittingReassign ? 'Updating...' : 'Confirm Reassignment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
