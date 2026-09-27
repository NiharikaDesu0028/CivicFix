'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PlusCircle, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function DashboardHero() {
  const { user } = useAuth();
  const [stats, setStats] = useState<{ pending_count: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    // Update time
    setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    async function fetchStats() {
      if (!user) return;
      try {
        const res = await fetch(`/api/citizen/stats?citizen_id=${user.id}&city=${user.city}`);
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

  if (!user) return null;

  return (
    <div className="w-full bg-gradient-to-br from-[var(--primary)] to-blue-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl translate-y-1/2"></div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-blue-100 mb-2">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">{user.city || 'Your City'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Welcome back, {user.name?.split(' ')[0] || 'Citizen'}!
          </h1>

          {loading ? (
            <div className="h-5 w-48 bg-white/20 rounded animate-pulse mt-3"></div>
          ) : (
            <p className="text-blue-50 max-w-md">
              You have {stats?.pending_count || 0} issues awaiting resolution. Thank you for keeping
              our city clean and safe.
            </p>
          )}

          <div className="flex items-center gap-2 mt-4 text-xs text-blue-200">
            <Clock className="w-3.5 h-3.5" />
            <span>Last updated: {currentTime}</span>
          </div>
        </div>

        <div className="flex-shrink-0">
          <Link
            href="/report-an-issue"
            className="inline-flex items-center gap-2 bg-white text-[var(--primary)] px-6 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors shadow-md hover:shadow-lg active:scale-95"
          >
            <PlusCircle className="w-5 h-5" />
            Report New Issue
          </Link>
        </div>
      </div>
    </div>
  );
}
