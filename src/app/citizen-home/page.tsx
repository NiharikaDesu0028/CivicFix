import React from 'react';
import CitizenLayout from '@/components/CitizenLayout';
import RouteGuard from '@/components/RouteGuard';
import DashboardHero from '../components/DashboardHero';
import DashboardMetrics from '../components/DashboardMetrics';
import CitizenHomeMap from '../components/CitizenHomeMap';
import ComplaintGrid from '../components/ComplaintGrid';

export default function CitizenHomePage() {
  return (
    <RouteGuard allowedRole="citizen">
      <CitizenLayout activePage="dashboard">
        <DashboardHero />
        <div className="mt-6">
          <DashboardMetrics />
        </div>
        <div className="mt-6">
          <CitizenHomeMap />
        </div>
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Recent Complaints</h2>
          </div>
          <ComplaintGrid />
        </div>
      </CitizenLayout>
    </RouteGuard>
  );
}
