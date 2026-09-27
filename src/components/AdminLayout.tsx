'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import {
  Users,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronDown,
  BarChart3,
  ShieldAlert,
  FileText,
  MapPin,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function AdminLayout({
  children,
  activeTab = 'overview',
  onTabChange,
}: AdminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const { user, logout } = useAuth();
  const router = useRouter();

  const city = user?.city || 'Bengaluru';

  // Fetch pending officer count
  React.useEffect(() => {
    let isMounted = true;
    const fetchPending = async () => {
      try {
        const res = await fetch(`/api/admin/officers/approvals?city=${encodeURIComponent(city)}&status=pending`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setPendingApprovalsCount(data.counts?.pending || 0);
          }
        }
      } catch {
        // Silent fallback
      }
    };
    fetchPending();
    const interval = setInterval(fetchPending, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [city, activeTab]);

  const handleLogout = () => {
    logout();
    router.push('/sign-up-login-screen');
    setProfileOpen(false);
    setMobileOpen(false);
  };

  const navItems = [
    { key: 'overview', label: 'Overview & Heatmap', icon: BarChart3 },
    { key: 'officers', label: 'Manage Officers', icon: Users },
    {
      key: 'approvals',
      label: 'Officer Approvals',
      icon: UserCheck,
      badge: pendingApprovalsCount,
    },
    { key: 'complaints', label: 'Complaints', icon: FileText },
    { key: 'sla', label: 'SLA Alerts', icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-16">
          <div className="flex items-center justify-between h-16">
            <Link href="/admin-dashboard" className="flex items-center gap-2 shrink-0">
              <AppLogo size={36} />
              <span className="font-bold text-xl text-foreground tracking-tight hidden sm:block">
                CivicFix
              </span>
              <span className="hidden md:flex items-center gap-1 text-xs font-semibold text-white bg-purple-600 px-2.5 py-0.5 rounded-full ml-1">
                Admin
              </span>
              <span className="hidden md:flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                <MapPin size={11} />
                {city}
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const NavIcon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={`admin-nav-${item.key}`}
                    onClick={() => onTabChange?.(item.key)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-purple-50 text-purple-700 font-semibold border border-purple-200'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <NavIcon size={16} />
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-bold rounded-full animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <button className="relative p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
              </button>

              <div className="relative hidden md:block">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-purple-700 font-semibold text-sm">
                      {user?.name
                        ? user.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()
                        : 'AD'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-foreground hidden lg:block">
                    {user?.name ?? 'City Administrator'}
                  </span>
                  <ChevronDown size={14} className="text-muted-foreground" />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-modal py-1 fade-in">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-sm font-semibold text-foreground">
                        {user?.name ?? 'City Administrator'}
                      </p>
                      <p className="text-xs text-muted-foreground">{city} Municipal Admin</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/5 transition-colors"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card fade-in">
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const NavIcon = item.icon;
              const isActive = activeTab === item.key;
              return (
                <button
                  key={`admin-mobile-${item.key}`}
                  onClick={() => {
                    onTabChange?.(item.key);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-purple-50 text-purple-700 font-semibold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <NavIcon size={18} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
            <div className="pt-2 border-t border-border mt-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/5 rounded-lg transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-16 py-6">
        {children}
      </main>
    </div>
  );
}
