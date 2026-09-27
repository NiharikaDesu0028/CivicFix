'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import AppLogo from '@/components/ui/AppLogo';
import {
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Building2,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Clock,
  Shield,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

interface OfficerSignupValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  city: string;
  department: string;
}

const CITIES = ['Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai'];

const DEPARTMENTS = [
  'Roads & Infrastructure',
  'Sanitation & Waste',
  'Water Supply & Drainage',
  'Street Lighting & Electrical',
  'Parks & Public Amenities',
];

export default function OfficerSignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<OfficerSignupValues>({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      city: 'Bengaluru',
      department: 'Roads & Infrastructure',
    },
  });

  const passwordValue = watch('password');

  // 3-second countdown and redirect upon successful submission
  useEffect(() => {
    if (!submittedSuccess) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/sign-up-login-screen');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [submittedSuccess, router]);

  const onSubmit = async (values: OfficerSignupValues) => {
    setIsSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/auth/signup/officer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFormError(data.error || 'Failed to submit officer application.');
        toast.error(data.error || 'Registration failed.');
        return;
      }

      setSubmittedSuccess(true);
      toast.info(
        "Your account is pending admin approval. You'll receive email once approved.",
        { duration: 5000 }
      );
    } catch {
      setFormError('Network connection error. Please try again.');
      toast.error('Network connection error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/40 via-slate-50 to-blue-50/30 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      {/* Header / Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center px-4">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-3 group">
          <AppLogo size={42} />
          <span className="text-2xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
            CivicFix
          </span>
          <span className="text-xs font-semibold text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full ml-1">
            Officer Portal
          </span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Field Officer Registration
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
          Register as a municipal department engineer or field inspector. Officer accounts require
          administrative verification before login.
        </p>
      </div>

      {/* Main Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="bg-card border border-border/80 shadow-card rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          {/* Success Screen after submission */}
          {submittedSuccess ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Clock size={32} className="animate-pulse" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">
                  Registration Application Submitted
                </h2>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm max-w-md mx-auto leading-relaxed">
                  <p className="font-semibold text-base mb-1">
                    Your account is pending admin approval.
                  </p>
                  <p className="text-xs text-amber-800">
                    You'll receive email once approved. Once a municipal administrator verifies your
                    department credentials, your account will be activated.
                  </p>
                </div>
              </div>

              <div className="pt-2 text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>
                  Redirecting to Sign In screen in{' '}
                  <strong className="text-foreground text-sm">{countdown}s</strong>...
                </span>
              </div>

              <div className="pt-4">
                <Link
                  href="/sign-up-login-screen"
                  className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold"
                >
                  <span>Go to Sign In Now</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Approval Notice Banner */}
              <div className="mb-5 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3 text-xs text-amber-900">
                <Shield size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="font-semibold text-amber-950">Administrative Verification Required:</strong>{' '}
                  Submitted officer accounts enter a <strong>Pending Approval</strong> state. A municipal administrator will review your application before you can sign in.
                </div>
              </div>

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
                    Full Name & Title <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Priya Nair, Asst. Engineer"
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

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5">
                      Government / Work Email <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="priya.nair@bbmp.gov.in"
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
                      Contact Phone (10 digits) <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        placeholder="9876543210"
                        maxLength={10}
                        {...register('phone', {
                          required: '10-digit phone number is required.',
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

                {/* City & Department Dropdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* City */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5">
                      Municipal Jurisdiction <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <select
                        {...register('city', { required: 'Please select your municipal jurisdiction.' })}
                        className={`input-field w-full pl-10 pr-4 py-2.5 text-sm rounded-xl appearance-none bg-card ${
                          errors.city ? 'input-error' : ''
                        }`}
                      >
                        {CITIES.map((c) => (
                          <option key={`officer-city-${c}`} value={c}>
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

                  {/* Department */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5">
                      Assigned Department <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <select
                        {...register('department', { required: 'Please select your department.' })}
                        className={`input-field w-full pl-10 pr-4 py-2.5 text-sm rounded-xl appearance-none bg-card ${
                          errors.department ? 'input-error' : ''
                        }`}
                      >
                        {DEPARTMENTS.map((d) => (
                          <option key={`officer-dept-${d}`} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                    {errors.department && (
                      <p className="text-xs text-danger mt-1 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {errors.department.message}
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

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-accent hover:bg-accent/90 text-white flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold shadow-md shadow-accent/20 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Officer Application</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Navigation Footer */}
              <div className="mt-6 pt-5 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
                <div>
                  Already an approved officer?{' '}
                  <Link
                    href="/sign-up-login-screen"
                    className="font-semibold text-primary hover:underline"
                  >
                    Sign In
                  </Link>
                </div>
                <div>
                  Are you a citizen?{' '}
                  <Link
                    href="/sign-up/citizen"
                    className="font-semibold text-primary hover:underline flex items-center gap-1 inline-flex"
                  >
                    <Users size={13} />
                    Citizen Sign Up
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
