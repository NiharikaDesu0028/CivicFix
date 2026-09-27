'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import ComplaintCard, { Complaint } from '@/components/ui/ComplaintCard';
import EmptyState from '@/components/ui/EmptyState';
import {
  Search,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Wrench,
  FileText,
  AlertTriangle,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const statusFilters = [
  { key: 'all', label: 'All', icon: FileText },
  { key: 'submitted', label: 'Received', icon: Clock },
  { key: 'assigned', label: 'Assigned', icon: CheckCircle2 },
  { key: 'in_progress', label: 'In Progress', icon: Wrench },
  { key: 'resolved', label: 'Resolved', icon: CheckCircle2 },
];

const ITEMS_PER_PAGE = 6;

// Category average resolution times (hours) for estimated resolution badge
const categoryAvgHours: Record<string, number> = {
  pothole: 96,
  garbage: 48,
  streetlight: 72,
  'water-leakage': 60,
  'blocked-drain': 84,
  'traffic-signal': 36,
  'fallen-tree': 24,
};

function mapSupabaseToComplaint(c: Record<string, unknown>): Complaint {
  const statusMap: Record<string, string> = {
    submitted: 'received',
    assigned: 'assigned',
    in_progress: 'in-progress',
    resolved: 'resolved',
    rejected: 'rejected',
    escalated: 'received',
  };
  const priorityMap: Record<string, string> = {
    low: 'low',
    medium: 'medium',
    high: 'high',
    urgent: 'critical',
  };
  const created = c.created_at ? new Date(c.created_at as string) : new Date();
  const updated = c.updated_at ? new Date(c.updated_at as string) : created;
  const daysOpen = Math.max(1, Math.ceil((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    id: c.id as string,
    ticketNumber: `CF-${(c.id as string).slice(0, 6).toUpperCase()}`,
    title: c.title as string,
    category: ((c.category as string) || 'pothole') as Complaint['category'],
    status: (statusMap[(c.status as string) || 'submitted'] || 'received') as Complaint['status'],
    priority: (priorityMap[(c.priority as string) || 'medium'] ||
      'medium') as Complaint['priority'],
    location: (c.location_address as string) || 'GPS Location',
    ward: (c.city as string) || 'Bengaluru',
    filedDate: created.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    lastUpdated: updated.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    department: ((c.departments as Record<string, string>)?.name as string) || 'Municipal Services',
    description: (c.description as string) || '',
    daysOpen,
  };
}

export default function ComplaintGridFull() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchComplaints = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/complaints?role=citizen&user_id=${encodeURIComponent(user.id)}`
      );
      const data = await res.json();
      const mapped = (data.complaints || []).map(mapSupabaseToComplaint);
      setComplaints(mapped);
    } catch {
      console.warn('Failed to fetch complaints.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const handleDelete = async () => {
    if (!deleteTarget || !user?.id) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/complaints/${deleteTarget}?citizen_id=${encodeURIComponent(user.id)}`,
        {
          method: 'DELETE',
        }
      );
      if (res.ok) {
        toast.success('Complaint deleted successfully.');
        setComplaints((prev) => prev.filter((c) => c.id !== deleteTarget));
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete complaint.');
      }
    } catch {
      toast.error('Network error deleting complaint.');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Map frontend filter keys to Supabase status values
  const filterStatusMap: Record<string, string[]> = {
    all: [],
    submitted: ['submitted'],
    assigned: ['assigned'],
    in_progress: ['in_progress', 'in-progress'],
    resolved: ['resolved'],
  };

  const filtered = complaints
    .filter((c) => {
      const filterStatuses = filterStatusMap[activeFilter] || [];
      const backendStatusMap: Record<string, string> = {
        received: 'submitted',
        assigned: 'assigned',
        'in-progress': 'in_progress',
        resolved: 'resolved',
        rejected: 'rejected',
      };
      const matchesFilter =
        activeFilter === 'all' || filterStatuses.includes(backendStatusMap[c.status] || c.status);
      const matchesSearch =
        searchQuery === '' ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      if (sortOrder === 'newest') return b.id.localeCompare(a.id);
      return a.id.localeCompare(b.id);
    });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleFilterChange = (key: string) => {
    setActiveFilter(key);
    setCurrentPage(1);
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setCurrentPage(1);
  };

  // Skeleton loading
  if (isLoading) {
    return (
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={`skel-stat-${i}`}
              className="bg-muted rounded-xl p-3 text-center animate-pulse"
            >
              <div className="h-8 bg-muted-foreground/10 rounded mb-2" />
              <div className="h-3 bg-muted-foreground/10 rounded w-2/3 mx-auto" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={`skel-card-${i}`}
              className="bg-card border border-border rounded-2xl p-5 animate-pulse"
            >
              <div className="h-4 bg-muted rounded w-3/4 mb-3" />
              <div className="h-3 bg-muted rounded w-full mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalCount = complaints.length;
  const pendingCount = complaints.filter(
    (c) => c.status === 'received' || c.status === 'assigned'
  ).length;
  const inProgressCount = complaints.filter((c) => c.status === 'in-progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;

  return (
    <div>
      {/* Summary counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Filed', count: totalCount, color: 'text-foreground', bg: 'bg-muted' },
          { label: 'Pending', count: pendingCount, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'In Progress', count: inProgressCount, color: 'text-info', bg: 'bg-info/10' },
          { label: 'Resolved', count: resolvedCount, color: 'text-success', bg: 'bg-success/10' },
        ].map((item) => (
          <div key={`summary-${item.label}`} className={`${item.bg} rounded-xl p-3 text-center`}>
            <p className={`text-2xl font-bold font-tabular ${item.color}`}>{item.count}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search by ticket ID, title, or location..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="input-field w-full pl-9 pr-4 py-2.5 text-sm rounded-xl"
          />
        </div>
        <button
          onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
          className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
        >
          {sortOrder === 'newest' ? <SortDesc size={15} /> : <SortAsc size={15} />}
          {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
        </button>
        <Link
          href="/report-an-issue"
          className="btn-primary flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
        >
          <AlertTriangle size={15} />
          Report Issue
        </Link>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
        {statusFilters.map((f) => (
          <button
            key={`fullfilter-${f.key}`}
            onClick={() => handleFilterChange(f.key)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
              activeFilter === f.key
                ? 'bg-primary text-white shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Complaint cards */}
      {paginated.length === 0 ? (
        <EmptyState
          title="No complaints match your search"
          description="Try adjusting your filter or search query to find what you're looking for."
          actionLabel="Report a New Issue"
          actionHref="/report-an-issue"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          {paginated.map((complaint) => (
            <div key={complaint.id} className="relative group">
              <ComplaintCard complaint={complaint} />
              {/* Estimated resolution badge */}
              <div className="absolute top-3 right-3 z-10">
                <span className="text-[10px] font-semibold bg-info/10 text-info px-2 py-0.5 rounded-full border border-info/20">
                  ~{Math.ceil((categoryAvgHours[complaint.category] || 72) / 24)}d avg
                </span>
              </div>
              {/* Delete button */}
              {complaint.status !== 'resolved' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(complaint.id);
                  }}
                  className="absolute bottom-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-danger/10 text-danger hover:bg-danger/20"
                  title="Delete complaint"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
            {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={`page-${page}`}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${
                  currentPage === page
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-modal">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center">
                <Trash2 size={20} className="text-danger" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Delete Complaint?</h3>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-danger text-white text-xs font-semibold hover:bg-danger/90 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
