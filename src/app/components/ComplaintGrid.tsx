'use client';
import React, { useState } from 'react';
import ComplaintCard, { Complaint } from '@/components/ui/ComplaintCard';
import EmptyState from '@/components/ui/EmptyState';
import { Filter, Search } from 'lucide-react';
import Link from 'next/link';

// Backend integration point: replace with API call to GET /api/complaints?citizenId=...
const mockComplaints: Complaint[] = [
  {
    id: 'complaint-001',
    ticketNumber: 'CF-2614',
    title: 'Broken streetlight causing accidents',
    category: 'streetlight',
    status: 'assigned',
    priority: 'high',
    location: '80 Feet Road, Koramangala',
    ward: 'Ward 14',
    filedDate: 'Sep 1, 2026',
    lastUpdated: 'Sep 2, 2026',
    department: 'BESCOM',
    description:
      'The streetlight near the bus stop on 80 Feet Road has been non-functional for 5 days, causing safety issues at night.',
    daysOpen: 2,
  },
  {
    id: 'complaint-002',
    ticketNumber: 'CF-2611',
    title: 'Blocked drain causing waterlogging',
    category: 'blocked-drain',
    status: 'in-progress',
    priority: 'critical',
    location: 'Jyoti Nivas College Road, Koramangala',
    ward: 'Ward 14',
    filedDate: 'Aug 28, 2026',
    lastUpdated: 'Sep 2, 2026',
    department: 'BBMP Drainage',
    description:
      'Drain completely blocked with debris. Water logging during rains affecting 3 apartment complexes and a school.',
    daysOpen: 6,
  },
  {
    id: 'complaint-003',
    ticketNumber: 'CF-2609',
    title: 'Large pothole on main road',
    category: 'pothole',
    status: 'resolved',
    priority: 'high',
    location: '5th Cross, Koramangala',
    ward: 'Ward 14',
    filedDate: 'Aug 22, 2026',
    lastUpdated: 'Sep 1, 2026',
    department: 'BBMP Roads',
    description:
      'A 2-foot wide pothole has developed near the junction. Two-wheelers have already been damaged.',
    daysOpen: 10,
  },
  {
    id: 'complaint-004',
    ticketNumber: 'CF-2607',
    title: 'Garbage pile not cleared for a week',
    category: 'garbage',
    status: 'received',
    priority: 'medium',
    location: '17th Cross, HSR Layout Sector 5',
    ward: 'Ward 15',
    filedDate: 'Aug 26, 2026',
    lastUpdated: 'Aug 26, 2026',
    department: 'BBMP Sanitation',
    description:
      'Garbage from 4 buildings has not been collected for over 7 days. Foul smell and health hazard.',
    daysOpen: 8,
  },
  {
    id: 'complaint-005',
    ticketNumber: 'CF-2603',
    title: 'Water pipe burst near park entrance',
    category: 'water-leakage',
    status: 'resolved',
    priority: 'high',
    location: '12th Main, HSR Layout',
    ward: 'Ward 15',
    filedDate: 'Aug 18, 2026',
    lastUpdated: 'Aug 25, 2026',
    department: 'BWSSB',
    description:
      'Underground water pipe burst causing significant water wastage and road damage near the park gate.',
    daysOpen: 7,
  },
  {
    id: 'complaint-006',
    ticketNumber: 'CF-2598',
    title: 'Traffic signal non-functional',
    category: 'traffic-signal',
    status: 'resolved',
    priority: 'critical',
    location: 'Silk Board Junction, BTM Layout',
    ward: 'Ward 17',
    filedDate: 'Aug 10, 2026',
    lastUpdated: 'Aug 14, 2026',
    department: 'Traffic Police',
    description:
      'All 4 signals at Silk Board junction went dark after heavy rain. Major traffic pile-up.',
    daysOpen: 4,
  },
  {
    id: 'complaint-007',
    ticketNumber: 'CF-2595',
    title: 'Fallen tree blocking road',
    category: 'fallen-tree',
    status: 'resolved',
    priority: 'critical',
    location: 'Indiranagar 100 Feet Road',
    ward: 'Ward 10',
    filedDate: 'Aug 5, 2026',
    lastUpdated: 'Aug 6, 2026',
    department: 'BBMP Horticulture',
    description:
      'Large banyan tree fell across 100 Feet Road after storm, blocking both lanes completely.',
    daysOpen: 1,
  },
];

const statusFilters = [
  { key: 'all', label: 'All Complaints' },
  { key: 'received', label: 'Received' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
];

export default function ComplaintGrid() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = mockComplaints.filter((c) => {
    const matchesFilter = activeFilter === 'all' || c.status === activeFilter;
    const matchesSearch =
      searchQuery === '' ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">My Complaints</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filtered.length} of {mockComplaints.length} complaints
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search by ID, title, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 pr-4 py-2 text-sm w-60 rounded-xl"
            />
          </div>
          <Link
            href="/report-an-issue"
            className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          >
            <Filter size={14} />
            Report New
          </Link>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
        {statusFilters.map((f) => (
          <button
            key={`filter-${f.key}`}
            onClick={() => setActiveFilter(f.key)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
              activeFilter === f.key
                ? 'bg-primary text-white shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            {f.label}
            {f.key !== 'all' && (
              <span className="ml-1.5 opacity-70">
                ({mockComplaints.filter((c) => c.status === f.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No complaints found"
          description="No complaints match your current filter. Try adjusting the status filter or search query."
          actionLabel="Report an Issue"
          actionHref="/report-an-issue"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filtered.map((complaint) => (
            <ComplaintCard key={complaint.id} complaint={complaint} />
          ))}
        </div>
      )}
    </div>
  );
}
