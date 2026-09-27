'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import RouteGuard from '@/components/RouteGuard';
import AdminAnalyticsClient from './components/AdminAnalyticsClient';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <RouteGuard allowedRole="admin">
      <AdminLayout activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)}>
        <AdminAnalyticsClient activeTab={activeTab} />
      </AdminLayout>
    </RouteGuard>
  );
}
