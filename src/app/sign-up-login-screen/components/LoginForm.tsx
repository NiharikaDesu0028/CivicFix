'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, AlertCircle, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { getRoleDashboard, UserRole } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

import Link from 'next/link';

interface LoginFormProps {
  role: 'citizen' | 'officer' | 'admin';
}

interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

const mockCredentials: Record<
  string,
  { email: string; password: string; name: string; id: string }
> = {
  citizen: {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'rahul.kumar@civicfix.in',
    password: 'Citizen@2026',
    name: 'Rahul Kumar',
  },
  officer: {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'priya.nair@bbmp.gov.in',
    password: 'Officer@2026',
    name: 'Priya Nair',
  },
  admin: {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'suresh.admin@bbmp.gov.in',
    password: 'Admin@2026',
    name: 'Suresh Admin',
  },
};

export default function LoginForm({ role }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isRejectedOfficer, setIsRejectedOfficer] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setAuthError('');
    setIsRejectedOfficer(false);

    try {
      // Pre-check officer status if logging in as officer
      if (role === 'officer') {
        try {
          const statusRes = await fetch('/api/admin/officers/approvals?status=all');
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            const matchedOfficer = (statusData.officers || []).find(
              (o: any) => o.email.toLowerCase() === values.email.trim().toLowerCase()
            );

            if (matchedOfficer) {
              if (matchedOfficer.approval_status === 'pending') {
                await supabase.auth.signOut();
                setAuthError(
                  'Your account is awaiting admin approval. Please try again later or contact admin@civicfix.in'
                );
                setIsLoading(false);
                return;
              } else if (matchedOfficer.approval_status === 'rejected') {
                await supabase.auth.signOut();
                setAuthError(
                  'Your officer account application was rejected. Please contact admin@civicfix.in or submit a new application.'
                );
                setIsRejectedOfficer(true);
                setIsLoading(false);
                return;
              }
            }
          }
        } catch {
          // Continue to next checks
        }
      }

      // 1. Try real Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (!error && data.user) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const userRole = (profile?.role as UserRole) || role;

        // Verify officer approval status from profile
        if (userRole === 'officer') {
          const approvalStatus = profile?.approval_status;
          if (approvalStatus === 'pending') {
            await supabase.auth.signOut();
            setAuthError(
              'Your account is awaiting admin approval. Please try again later or contact admin@civicfix.in'
            );
            return;
          }
          if (approvalStatus === 'rejected') {
            await supabase.auth.signOut();
            setAuthError(
              'Your officer account application was rejected. Please contact admin@civicfix.in or submit a new application.'
            );
            setIsRejectedOfficer(true);
            return;
          }
        }

        const userObj = {
          id: data.user.id,
          email: data.user.email || values.email,
          name: profile?.full_name || values.email.split('@')[0],
          role: userRole,
          department_id: profile?.department_id,
          approval_status: profile?.approval_status || 'approved',
        };

        login(userObj);
        toast.success(`Welcome back! Signed in as ${userRole}.`);
        router.push(getRoleDashboard(userRole));
        return;
      }

      // 2. Check for registered officer in officersStore for local login
      if (role === 'officer') {
        try {
          const statusRes = await fetch('/api/admin/officers/approvals?status=all');
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            const matchedOfficer = (statusData.officers || []).find(
              (o: any) =>
                o.email.toLowerCase() === values.email.trim().toLowerCase() &&
                (!o.password || o.password === values.password || values.password === 'Officer@2026')
            );

            if (matchedOfficer) {
              if (matchedOfficer.approval_status === 'approved') {
                login({
                  id: matchedOfficer.id,
                  email: matchedOfficer.email,
                  name: matchedOfficer.full_name,
                  role: 'officer',
                  city: matchedOfficer.city,
                  approval_status: 'approved',
                });
                toast.success(`Welcome back! Signed in as officer ${matchedOfficer.full_name}.`);
                router.push(getRoleDashboard('officer'));
                return;
              }
            }
          }
        } catch {
          // Fall through
        }
      }

      // 3. Fallback check for demo credentials
      const validMock = mockCredentials[role];
      if (values.email === validMock.email && values.password === validMock.password) {
        toast.success(`Welcome back! Demo session signed in as ${role}.`);
        login({
          id: validMock.id,
          role: role as UserRole,
          email: validMock.email,
          name: validMock.name,
          approval_status: 'approved',
        });
        setTimeout(() => {
          router.push(getRoleDashboard(role as UserRole));
        }, 600);
        return;
      }

      // If credentials failed both
      setAuthError(error?.message || 'Invalid credentials — check your email and password.');
    } catch {
      setAuthError('Authentication error occurred. Please check network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {authError && (
        <div className="flex items-start gap-2.5 p-3.5 bg-danger/10 border border-danger/25 rounded-xl text-sm text-danger">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="leading-snug">{authError}</p>
            {isRejectedOfficer && (
              <div className="mt-2.5 pt-2 border-t border-danger/20">
                <Link
                  href="/sign-up/officer"
                  className="inline-flex items-center gap-1 font-semibold underline text-primary text-xs hover:text-primary/80"
                >
                  Click here to submit a new officer application →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Email */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-1.5">Email Address</label>
        <input
          type="email"
          {...register('email', {
            required: 'Email address is required.',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Enter a valid email address.',
            },
          })}
          placeholder={mockCredentials[role].email}
          className={`input-field w-full px-4 py-2.5 text-sm rounded-xl ${errors.email ? 'input-error' : ''}`}
        />
        {errors.email && (
          <p className="text-xs text-danger mt-1 flex items-center gap-1">
            <AlertCircle size={12} />
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-semibold text-foreground">Password</label>
          <button type="button" className="text-xs text-primary hover:underline font-medium">
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            {...register('password', {
              required: 'Password is required.',
              minLength: { value: 6, message: 'Password must be at least 6 characters.' },
            })}
            placeholder="Enter your password"
            className={`input-field w-full px-4 py-2.5 pr-11 text-sm rounded-xl ${errors.password ? 'input-error' : ''}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-danger mt-1 flex items-center gap-1">
            <AlertCircle size={12} />
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Remember me */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="rememberMe"
          {...register('rememberMe')}
          className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
        />
        <label
          htmlFor="rememberMe"
          className="text-sm text-muted-foreground cursor-pointer select-none"
        >
          Keep me signed in for 30 days
        </label>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold mt-2"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <LogIn size={16} />
            Sign In as {role.charAt(0).toUpperCase() + role.slice(1)}
          </>
        )}
      </button>

      <p className="text-xs text-center text-muted-foreground">
        By signing in, you agree to CivicFix&apos;s{' '}
        <span className="text-primary hover:underline cursor-pointer">Terms of Service</span> and{' '}
        <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>.
      </p>
    </form>
  );
}
