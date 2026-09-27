'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  User,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Compass,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface CitizenTopbarProps {
  activePage?: 'dashboard' | 'report' | 'complaints' | 'profile' | 'explore';
}

const navItems = [
  { key: 'dashboard', label: 'Dashboard', href: '/citizen-home', icon: LayoutDashboard },
  { key: 'report', label: 'Report Issue', href: '/report-an-issue', icon: PlusCircle },
  { key: 'complaints', label: 'My Complaints', href: '/citizen-dashboard', icon: FileText },
  { key: 'explore', label: 'Explore Nearby', href: '/explore', icon: Compass },
];

export default function CitizenTopbar({ activePage }: CitizenTopbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/sign-up-login-screen');
    setProfileOpen(false);
    setMobileOpen(false);
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-16">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/citizen-home" className="flex items-center gap-2 shrink-0">
            <AppLogo size={36} />
            <span className="font-bold text-xl text-foreground tracking-tight hidden sm:block">
              CivicFix
            </span>
            <span className="hidden md:block text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full ml-1">
              Citizen
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.key;
              return (
                <Link
                  key={`nav-${item.key}`}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <button className="relative p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-warning rounded-full"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm">
                    {user?.name
                      ? user.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()
                      : 'RK'}
                  </span>
                </div>
                <span className="text-sm font-medium text-foreground hidden lg:block">
                  {user?.name ?? 'Rahul Kumar'}
                </span>
                <ChevronDown size={14} className="text-muted-foreground" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-modal py-1 fade-in">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-sm font-semibold text-foreground">
                      {user?.name ?? 'Rahul Kumar'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email ?? 'rahul.kumar@gmail.com'}
                    </p>
                  </div>
                  <Link
                    href="#"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    onClick={() => setProfileOpen(false)}
                  >
                    <User size={14} />
                    Profile
                  </Link>
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

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card fade-in">
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.key;
              return (
                <Link
                  key={`mobile-nav-${item.key}`}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-border mt-2">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm">
                    {user?.name
                      ? user.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()
                      : 'RK'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {user?.name ?? 'Rahul Kumar'}
                  </p>
                  <p className="text-xs text-muted-foreground">Citizen Account</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/5 rounded-lg transition-colors mt-1"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
