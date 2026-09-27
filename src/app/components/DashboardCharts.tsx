'use client';
import React from 'react';
import dynamic from 'next/dynamic';

const ComplaintTrendChart = dynamic(() => import('./ComplaintTrendChart'), { ssr: false });
const CategoryDistributionChart = dynamic(() => import('./CategoryDistributionChart'), {
  ssr: false,
});

export default function DashboardCharts() {
  return (
    <div className="space-y-6">
      <ComplaintTrendChart />
      <CategoryDistributionChart />
    </div>
  );
}
