'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import MetricCard from '@/components/ui/MetricCard';
import { FileText, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface CitizenStats {
  total: number;
  received_count: number;
  assigned_count: number;
  in_progress_count: number;
  resolved_count: number;
  pending_count: number;
  avg_resolution_hours: number;
}

export default function DashboardMetrics() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CitizenStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;
      try {
        const res = await fetch(
          `/api/citizen/stats?citizen_id=${user.id}&city=${user.city || 'Bengaluru'}`
        );
        if (res.ok) {
          const data = await res.json();
          setStats(data.personal);
        }
      } catch (err) {
        console.error('Failed to fetch citizen stats', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-card rounded-2xl border border-border h-[120px] p-5 animate-pulse"
          >
            <div className="w-10 h-10 bg-muted rounded-xl mb-3" />
            <div className="h-4 w-24 bg-muted rounded mb-2" />
            <div className="h-6 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  const avgDays = stats?.avg_resolution_hours
    ? (stats.avg_resolution_hours / 24).toFixed(1)
    : '4.2';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      <MetricCard
        label="Total Complaints Filed"
        value={stats?.total || 0}
        subValue={
          stats?.total ? `Active citizen in ${user?.city || 'city'}` : 'Start reporting issues'
        }
        icon={FileText}
        iconColor="text-primary"
        iconBg="bg-primary/10"
        variant="default"
      />
      <MetricCard
        label="In Progress"
        value={stats?.in_progress_count || 0}
        subValue="Field work underway"
        icon={Clock}
        iconColor="text-warning"
        iconBg="bg-warning/10"
        variant="warning"
      />
      <MetricCard
        label="Resolved"
        value={stats?.resolved_count || 0}
        subValue={`Avg. ${avgDays} days to resolve`}
        icon={CheckCircle2}
        iconColor="text-success"
        iconBg="bg-success/10"
        variant="success"
      />
      <MetricCard
        label="Pending Review"
        value={stats?.pending_count || 0}
        subValue="Awaiting officer action"
        icon={AlertCircle}
        iconColor="text-danger"
        iconBg="bg-danger/10"
        variant="danger"
      />
    </div>
  );
}
