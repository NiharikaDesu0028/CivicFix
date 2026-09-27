import React from 'react';
import CitizenLayout from '@/components/CitizenLayout';
import RouteGuard from '@/components/RouteGuard';
import ComplaintGridFull from './components/ComplaintGridFull';

export default function CitizenComplaintsPage() {
  return (
    <RouteGuard allowedRole="citizen">
      <CitizenLayout activePage="complaints">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">My Complaints</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track all your submitted civic issues and their current resolution status.
          </p>
        </div>
        <ComplaintGridFull />
      </CitizenLayout>
    </RouteGuard>
  );
}
