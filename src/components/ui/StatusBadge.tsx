import React from 'react';
import { Clock, UserCheck, Wrench, CheckCircle2, XCircle } from 'lucide-react';

type ComplaintStatus = 'received' | 'assigned' | 'in-progress' | 'resolved' | 'rejected';

interface StatusBadgeProps {
  status: ComplaintStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<
  ComplaintStatus,
  { label: string; className: string; Icon: React.ElementType }
> = {
  received: {
    label: 'Received',
    className: 'status-received',
    Icon: Clock,
  },
  assigned: {
    label: 'Assigned',
    className: 'status-assigned',
    Icon: UserCheck,
  },
  'in-progress': {
    label: 'In Progress',
    className: 'status-in-progress',
    Icon: Wrench,
  },
  resolved: {
    label: 'Resolved',
    className: 'status-resolved',
    Icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    className: 'status-rejected',
    Icon: XCircle,
  },
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.Icon;
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${config.className} ${sizeClasses}`}
    >
      <Icon size={size === 'sm' ? 10 : 12} />
      {config.label}
    </span>
  );
}
