import React from 'react';
import OfficerLayout from '@/components/OfficerLayout';
import RouteGuard from '@/components/RouteGuard';
import OfficerDashboardClient from './components/OfficerDashboardClient';

export default function OfficerDashboardPage() {
  return (
    <RouteGuard allowedRole="officer">
      <OfficerLayout activePage="dashboard">
        <OfficerDashboardClient />
      </OfficerLayout>
    </RouteGuard>
  );
}
