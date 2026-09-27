'use client';
import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { week: 'Jul W1', filed: 1, resolved: 0 },
  { week: 'Jul W2', filed: 2, resolved: 1 },
  { week: 'Jul W3', filed: 1, resolved: 2 },
  { week: 'Jul W4', filed: 3, resolved: 1 },
  { week: 'Aug W1', filed: 2, resolved: 3 },
  { week: 'Aug W2', filed: 1, resolved: 1 },
  { week: 'Aug W3', filed: 2, resolved: 2 },
  { week: 'Aug W4', filed: 1, resolved: 1 },
  { week: 'Sep W1', filed: 1, resolved: 1 },
];

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-modal px-4 py-3 text-sm">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={`tt-${entry.name}`} className="flex items-center gap-2 text-xs">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground capitalize">{entry.name}:</span>
          <span className="font-semibold text-foreground font-tabular">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function ComplaintTrendChart() {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Complaint Activity</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Filed vs. resolved over the past 9 weeks
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full bg-primary inline-block" />
            <span className="text-muted-foreground">Filed</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full bg-accent inline-block" />
            <span className="text-muted-foreground">Resolved</span>
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradFiled" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="filed"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="url(#gradFiled)"
          />
          <Area
            type="monotone"
            dataKey="resolved"
            stroke="var(--accent)"
            strokeWidth={2}
            fill="url(#gradResolved)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
