'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getRoleDashboard, UserRole } from '@/lib/auth';

interface RouteGuardProps {
  children: React.ReactNode;
  /** The role(s) allowed to access this route */
  allowedRole: UserRole;
}

export default function RouteGuard({ children, allowedRole }: RouteGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      // Not logged in — redirect to sign-in
      router.replace('/sign-up-login-screen');
      return;
    }

    if (user.role !== allowedRole) {
      // Wrong role — redirect to their own dashboard
      router.replace(getRoleDashboard(user.role));
    }
  }, [user, isLoading, allowedRole, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== allowedRole) {
    return null;
  }

  return <>{children}</>;
}
