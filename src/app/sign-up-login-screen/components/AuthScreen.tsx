'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import { Shield, Users, CheckCircle2 } from 'lucide-react';

type Role = 'citizen' | 'officer' | 'admin';
type AuthMode = 'login' | 'signup';

const roleConfig: Record<
  Role,
  {
    label: string;
    description: string;
    color: string;
    bg: string;
    border: string;
    activeBg: string;
    activeText: string;
  }
> = {
  citizen: {
    label: 'Citizen',
    description: 'Report & track civic issues',
    color: 'text-primary',
    bg: 'bg-primary/5',
    border: 'border-primary/20',
    activeBg: 'bg-primary',
    activeText: 'text-white',
  },
  officer: {
    label: 'Officer',
    description: 'Manage assigned complaints',
    color: 'text-accent',
    bg: 'bg-accent/5',
    border: 'border-accent/20',
    activeBg: 'bg-accent',
    activeText: 'text-white',
  },
  admin: {
    label: 'Admin',
    description: 'Department analytics & oversight',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    activeBg: 'bg-purple-600',
    activeText: 'text-white',
  },
};

const mockCredentials: Record<Role, { email: string; password: string }[]> = {
  citizen: [{ email: 'rahul.kumar@civicfix.in', password: 'Citizen@2026' }],
  officer: [{ email: 'priya.nair@bbmp.gov.in', password: 'Officer@2026' }],
  admin: [{ email: 'suresh.admin@bbmp.gov.in', password: 'Admin@2026' }],
};

const stats = [
  { value: '12,480', label: 'Issues Resolved', icon: CheckCircle2 },
  { value: '3,241', label: 'Active Citizens', icon: Users },
  { value: '18', label: 'Departments Covered', icon: Shield },
];

export default function AuthScreen() {
  const [activeRole, setActiveRole] = useState<Role>('citizen');
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const credentials = mockCredentials[activeRole];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left brand panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] shrink-0 bg-gradient-to-br from-primary via-blue-700 to-blue-900 flex-col justify-between p-10 relative overflow-hidden">
        {/* Background decorations */}
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, white 0%, transparent 70%)',
            transform: 'translate(40%, -40%)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, white 0%, transparent 70%)',
            transform: 'translate(-40%, 40%)',
          }}
        />

        {/* Logo */}
        <div className="relative">
          <div className="flex items-center gap-3 mb-8">
            <AppLogo size={44} />
            <div>
              <span className="font-bold text-2xl text-white tracking-tight">CivicFix</span>
              <p className="text-blue-200 text-xs font-medium">Bengaluru Municipal Corporation</p>
            </div>
          </div>

          <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
            Your city.
            <br />
            Your voice.
            <br />
            <span className="text-blue-200">Fixed faster.</span>
          </h1>
          <p className="text-blue-100 text-sm leading-relaxed max-w-xs">
            Report civic issues in seconds. AI automatically routes your complaint to the right
            department for swift resolution.
          </p>
        </div>

        {/* Stats */}
        <div className="relative space-y-3">
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-4">
            Platform Impact
          </p>
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={`stat-${stat.label}`} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <Icon size={16} className="text-blue-100" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg font-tabular leading-none">
                    {stat.value}
                  </p>
                  <p className="text-blue-200 text-xs">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Issue types */}
        <div className="relative">
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-3">
            Issues We Handle
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              'Potholes',
              'Garbage',
              'Streetlights',
              'Water Leakage',
              'Blocked Drains',
              'Traffic Signals',
              'Fallen Trees',
            ].map((issue) => (
              <span
                key={`issue-${issue}`}
                className="px-3 py-1 bg-white/10 text-blue-100 text-xs font-medium rounded-full border border-white/10"
              >
                {issue}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-10 overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <AppLogo size={36} />
          <span className="font-bold text-xl text-foreground">CivicFix</span>
        </div>

        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-foreground">
              {authMode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {authMode === 'login'
                ? 'Sign in to continue to your dashboard.'
                : 'Join CivicFix and start reporting issues in your area.'}
            </p>
          </div>

          {/* Role selector */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">
              Sign in as
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(roleConfig) as Role[]).map((role) => {
                const cfg = roleConfig[role];
                const isActive = activeRole === role;
                return (
                  <button
                    key={`role-${role}`}
                    onClick={() => setActiveRole(role)}
                    className={`flex flex-col items-center py-3 px-2 rounded-xl border transition-all duration-200 text-center ${
                      isActive
                        ? `${cfg.activeBg} ${cfg.activeText} border-transparent shadow-sm`
                        : `${cfg.bg} ${cfg.border} ${cfg.color} hover:opacity-80`
                    }`}
                  >
                    <span className="text-sm font-bold">{cfg.label}</span>
                    <span
                      className={`text-xs mt-0.5 leading-tight ${isActive ? 'opacity-80' : 'opacity-70'}`}
                    >
                      {cfg.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Auth mode toggle */}
          <div className="flex items-center bg-muted rounded-xl p-1 mb-6">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                authMode === 'login'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <Link
              href={activeRole === 'officer' ? '/sign-up/officer' : '/sign-up/citizen'}
              className="flex-1 py-2 rounded-lg text-sm font-semibold text-center transition-all duration-200 text-primary hover:bg-card/70 flex items-center justify-center gap-1"
            >
              <span>Sign Up</span>
              <span className="text-xs">→</span>
            </Link>
          </div>

          {/* Form */}
          <LoginForm role={activeRole} />

          {/* Dedicated Sign Up Navigation Banner */}
          <div className="mt-4 p-3 bg-muted/40 border border-border/80 rounded-xl flex items-center justify-between text-xs text-muted-foreground">
            <span>New to CivicFix?</span>
            <div className="flex items-center gap-3">
              <Link href="/sign-up/citizen" className="font-semibold text-primary hover:underline">
                Citizen Sign Up
              </Link>
              <span>•</span>
              <Link href="/sign-up/officer" className="font-semibold text-accent hover:underline">
                Officer Sign Up
              </Link>
            </div>
          </div>

          {/* Demo credentials */}
          <DemoCredentials role={activeRole} credentials={credentials} />
        </div>
      </div>
    </div>
  );
}

interface DemoCredentialsProps {
  role: Role;
  credentials: { email: string; password: string }[];
}

function DemoCredentials({ role, credentials }: DemoCredentialsProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="mt-6 bg-muted/60 border border-border rounded-xl p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Demo Credentials — {role.charAt(0).toUpperCase() + role.slice(1)}
      </p>
      {credentials.map((cred, idx) => (
        <div key={`cred-${role}-${idx}`} className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-xs font-mono font-semibold text-foreground truncate">
                {cred.email}
              </p>
            </div>
            <button
              onClick={() => handleCopy(cred.email, `email-${idx}`)}
              className="shrink-0 text-xs px-2.5 py-1 rounded-lg bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors font-medium"
            >
              {copied === `email-${idx}` ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Password</p>
              <p className="text-xs font-mono font-semibold text-foreground">{cred.password}</p>
            </div>
            <button
              onClick={() => handleCopy(cred.password, `pass-${idx}`)}
              className="shrink-0 text-xs px-2.5 py-1 rounded-lg bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors font-medium"
            >
              {copied === `pass-${idx}` ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
