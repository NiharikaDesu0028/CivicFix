'use client';
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const data = [
  { category: 'Pothole', count: 4, fill: '#f97316' },
  { category: 'Garbage', count: 3, fill: '#dc2626' },
  { category: 'Streetlight', count: 2, fill: '#ca8a04' },
  { category: 'Water', count: 2, fill: '#0284c7' },
  { category: 'Drain', count: 2, fill: '#7c3aed' },
  { category: 'Traffic', count: 1, fill: '#16a34a' },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number; payload: { category: string; fill: string } }[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div className="bg-card border border-border rounded-xl shadow-modal px-4 py-3 text-sm">
      <p className="font-semibold text-foreground">{item.payload.category}</p>
      <p className="text-xs text-muted-foreground mt-1">
        <span className="font-semibold text-foreground font-tabular">{item.value}</span> complaints
      </p>
    </div>
  );
}

export default function CategoryDistributionChart() {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">By Issue Category</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Distribution of your 14 filed complaints
        </p>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={28}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="category"
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.5 }} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell key={`cell-${entry.category}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
