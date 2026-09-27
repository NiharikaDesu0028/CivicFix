import React from 'react';
import CitizenLayout from '@/components/CitizenLayout';
import RouteGuard from '@/components/RouteGuard';
import ReportIssueForm from './components/ReportIssueForm';

export default function ReportAnIssuePage() {
  return (
    <RouteGuard allowedRole="citizen">
      <CitizenLayout activePage="report">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Report a Civic Issue</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Upload a photo and our AI will automatically detect the issue type and route it to the
              right department.
            </p>
          </div>
          <ReportIssueForm />
        </div>
      </CitizenLayout>
    </RouteGuard>
  );
}
