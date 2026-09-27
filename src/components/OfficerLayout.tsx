'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { LayoutDashboard, ClipboardList, Bell, Menu, X, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface OfficerLayoutProps {
  children: React.ReactNode;
  activePage?: 'dashboard' | 'complaints' | 'map';
}

const navItems = [
  { key: 'dashboard', label: 'Dashboard', href: '/officer-dashboard', icon: LayoutDashboard },
  { key: 'complaints', label: 'My Assignments', href: '/officer-dashboard', icon: ClipboardList },
];

export default function OfficerLayout({ children, activePage }: OfficerLayoutProps) {
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
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-16">
          <div className="flex items-center justify-between h-16">
            <Link href="/officer-dashboard" className="flex items-center gap-2 shrink-0">
              <AppLogo size={36} />
              <span className="font-bold text-xl text-foreground tracking-tight hidden sm:block">
                CivicFix
              </span>
              <span className="hidden md:block text-xs font-medium text-white bg-accent px-2 py-0.5 rounded-full ml-1">
                Officer
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const NavIcon = item.icon;
                const isActive = activePage === item.key;
                return (
                  <Link
                    key={`officer-nav-${item.key}`}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-accent/10 text-accent'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <NavIcon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <button className="relative p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-warning rounded-full" />
              </button>

              <div className="relative hidden md:block">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <span className="text-accent font-semibold text-sm">
                      {user?.name
                        ? user.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()
                        : 'PN'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-foreground hidden lg:block">
                    {user?.name ?? 'Priya Nair'}
                  </span>
                  <ChevronDown size={14} className="text-muted-foreground" />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-modal py-1 fade-in">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-sm font-semibold text-foreground">
                        {user?.name ?? 'Priya Nair'}
                      </p>
                      <p className="text-xs text-muted-foreground">BBMP Officer</p>
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
              const isActive = activePage === item.key;
              return (
                <Link
                  key={`officer-mobile-${item.key}`}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-accent/10 text-accent'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <NavIcon size={18} />
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-border mt-2">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className="text-accent font-semibold text-sm">
                    {user?.name
                      ? user.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()
                      : 'PN'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {user?.name ?? 'Priya Nair'}
                  </p>
                  <p className="text-xs text-muted-foreground">Officer Account</p>
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

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-16 py-6">
        {children}
      </main>
    </div>
  );
}
