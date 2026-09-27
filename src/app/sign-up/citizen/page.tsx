'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import AppLogo from '@/components/ui/AppLogo';
import { useAuth } from '@/context/AuthContext';
import {
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Home,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface CitizenSignupValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  city: string;
  address: string;
}

const CITIES = ['Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai'];

export default function CitizenSignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CitizenSignupValues>({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      city: 'Bengaluru',
      address: '',
    },
  });

  const passwordValue = watch('password');

  const onSubmit = async (values: CitizenSignupValues) => {
    setIsSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/auth/signup/citizen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFormError(data.error || 'Failed to create account. Please try again.');
        toast.error(data.error || 'Failed to create citizen account.');
        return;
      }

      // Auto-approved, instant access!
      toast.success(`Welcome to CivicFix, ${values.fullName}! Redirecting to dashboard...`);
      login(data.user);
      router.push('/citizen-home');
    } catch {
      setFormError('Network connection error. Please try again.');
      toast.error('Network connection error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50/40 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      {/* Header / Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center px-4">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-3 group">
          <AppLogo size={42} />
          <span className="text-2xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
            CivicFix
          </span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Citizen Registration
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
          Create your free citizen account for instant access to report, upvote, and track civic
          infrastructure repairs.
        </p>
      </div>

      {/* Main Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="bg-card border border-border/80 shadow-card rounded-2xl p-6 sm:p-8">
          {formError && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5">
                Full Name <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Rahul Kumar"
                  {...register('fullName', {
                    required: 'Full name is required.',
                    minLength: { value: 3, message: 'Name must be at least 3 characters.' },
                  })}
                  className={`input-field w-full pl-10 pr-4 py-2.5 text-sm rounded-xl ${
                    errors.fullName ? 'input-error' : ''
                  }`}
                />
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
              {errors.fullName && (
                <p className="text-xs text-danger mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* Email & Phone Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5">
                  Email Address <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="you@example.com"
                    {...register('email', {
                      required: 'Email address is required.',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Enter a valid email address.',
                      },
                    })}
                    className={`input-field w-full pl-10 pr-4 py-2.5 text-sm rounded-xl ${
                      errors.email ? 'input-error' : ''
                    }`}
                  />
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
                {errors.email && (
                  <p className="text-xs text-danger mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Phone (10 digits) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5">
                  Mobile Number (10 digits) <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    {...register('phone', {
                      required: '10-digit mobile number is required.',
                      pattern: {
                        value: /^[6-9]\d{9}$/,
                        message: 'Enter a valid 10-digit mobile number.',
                      },
                    })}
                    className={`input-field w-full pl-10 pr-4 py-2.5 text-sm rounded-xl ${
                      errors.phone ? 'input-error' : ''
                    }`}
                  />
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
                {errors.phone && (
                  <p className="text-xs text-danger mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            {/* City & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* City */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5">
                  City <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <select
                    {...register('city', { required: 'Please choose your city.' })}
                    className={`input-field w-full pl-10 pr-4 py-2.5 text-sm rounded-xl appearance-none bg-card ${
                      errors.city ? 'input-error' : ''
                    }`}
                  >
                    {CITIES.map((c) => (
                      <option key={`city-opt-${c}`} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
                {errors.city && (
                  <p className="text-xs text-danger mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.city.message}
                  </p>
                )}
              </div>

              {/* Address */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5">
                  Residential Address / Ward <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. 14th Main, HSR Layout Sector 2"
                    {...register('address', {
                      required: 'Address or residential area is required.',
                      minLength: { value: 5, message: 'Please provide a descriptive address.' },
                    })}
                    className={`input-field w-full pl-10 pr-4 py-2.5 text-sm rounded-xl ${
                      errors.address ? 'input-error' : ''
                    }`}
                  />
                  <Home size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
                {errors.address && (
                  <p className="text-xs text-danger mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.address.message}
                  </p>
                )}
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5">
                  Password <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 characters"
                    {...register('password', {
                      required: 'Password is required.',
                      minLength: { value: 8, message: 'Password must be at least 8 characters.' },
                    })}
                    className={`input-field w-full pl-10 pr-10 py-2.5 text-sm rounded-xl ${
                      errors.password ? 'input-error' : ''
                    }`}
                  />
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5">
                  Confirm Password <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    {...register('confirmPassword', {
                      required: 'Please confirm your password.',
                      validate: (val) => val === passwordValue || 'Passwords do not match.',
                    })}
                    className={`input-field w-full pl-10 pr-10 py-2.5 text-sm rounded-xl ${
                      errors.confirmPassword ? 'input-error' : ''
                    }`}
                  />
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-danger mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            {/* Instant access note */}
            <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
              <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
              <span>
                <strong>Instant Access:</strong> Citizen accounts are activated immediately upon registration. You will be redirected straight to your home dashboard.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold shadow-md shadow-primary/20 hover:shadow-lg transition-all"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Citizen Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Links back to login and officer signup */}
          <div className="mt-6 pt-5 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
            <div>
              Already registered?{' '}
              <Link
                href="/sign-up-login-screen"
                className="font-semibold text-primary hover:underline"
              >
                Sign In here
              </Link>
            </div>
            <div>
              Are you a municipal officer?{' '}
              <Link
                href="/sign-up/officer"
                className="font-semibold text-accent hover:underline flex items-center gap-1 inline-flex"
              >
                <ShieldCheck size={13} />
                Officer Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
