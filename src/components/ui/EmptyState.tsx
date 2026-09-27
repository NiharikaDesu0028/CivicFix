import React from 'react';
import { FileX2, PlusCircle } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ElementType;
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon: Icon = FileX2,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon size={28} className="text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-5">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
        >
          <PlusCircle size={16} />
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
