'use client';
import React from 'react';
import Link from 'next/link';
import {
  MapPin,
  Calendar,
  ChevronRight,
  AlertTriangle,
  Zap,
  Trash2,
  Droplets,
  Construction,
  TreePine,
  TrafficCone,
} from 'lucide-react';
import StatusBadge from './StatusBadge';

export type ComplaintStatus = 'received' | 'assigned' | 'in-progress' | 'resolved' | 'rejected';
export type IssueCategory =
  | 'pothole'
  | 'garbage'
  | 'streetlight'
  | 'water-leakage'
  | 'blocked-drain'
  | 'traffic-signal'
  | 'fallen-tree';
export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface Complaint {
  id: string;
  title: string;
  category: IssueCategory;
  status: ComplaintStatus;
  priority: Priority;
  location: string;
  ward: string;
  filedDate: string;
  lastUpdated: string;
  department: string;
  description: string;
  imageUrl?: string;
  daysOpen: number;
  ticketNumber: string;
}

interface ComplaintCardProps {
  complaint: Complaint;
}

const categoryConfig: Record<
  IssueCategory,
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

const priorityConfig: Record<Priority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'text-muted-foreground' },
  medium: { label: 'Medium', color: 'text-info' },
  high: { label: 'High', color: 'text-warning' },
  critical: { label: 'Critical', color: 'text-danger' },
};

export default function ComplaintCard({ complaint }: ComplaintCardProps) {
  const cat = categoryConfig[complaint.category];
  const Icon = cat.Icon;
  const pri = priorityConfig[complaint.priority];

  const progressSteps: ComplaintStatus[] = ['received', 'assigned', 'in-progress', 'resolved'];
  const currentStep = progressSteps.indexOf(complaint.status);
  const progressPct =
    complaint.status === 'rejected'
      ? 0
      : Math.round(((currentStep + 1) / progressSteps.length) * 100);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card card-hover complaint-card-enter overflow-hidden">
      {/* Category header strip */}
      <div
        className={`h-1 w-full ${
          complaint.priority === 'critical'
            ? 'bg-danger'
            : complaint.priority === 'high'
              ? 'bg-warning'
              : complaint.priority === 'medium'
                ? 'bg-info'
                : 'bg-muted-foreground'
        }`}
      />

      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl ${cat.bg} flex items-center justify-center shrink-0`}
            >
              <Icon size={18} className={cat.color} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {cat.label}
              </p>
              <h3 className="text-sm font-semibold text-foreground truncate leading-tight mt-0.5">
                {complaint.title}
              </h3>
            </div>
          </div>
          <StatusBadge status={complaint.status} size="sm" />
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
          {complaint.description}
        </p>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-muted-foreground">Progress</span>
            <span className="text-xs font-semibold text-primary font-tabular">{progressPct}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full progress-bar-fill ${
                complaint.status === 'resolved'
                  ? 'bg-success'
                  : complaint.status === 'rejected'
                    ? 'bg-danger'
                    : 'bg-primary'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <MapPin size={11} />
            <span className="truncate max-w-[120px]">{complaint.location}</span>
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {complaint.filedDate}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
              #{complaint.ticketNumber}
            </span>
            <span className={`text-xs font-semibold ${pri.color}`}>{pri.label} Priority</span>
          </div>
          <Link
            href={`/complaint/${complaint.id}`}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            View Details
            <ChevronRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
