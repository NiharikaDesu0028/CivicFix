'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, AlertCircle, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

interface SignupFormProps {
  role: 'citizen' | 'officer' | 'admin';
}

interface SignupFormValues {
  fullName: string;
  email: string;
  phone: string;
  ward: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
  employeeId?: string;
  department?: string;
}

const wardOptions = [
  'Ward 10 — Indiranagar',
  'Ward 14 — Koramangala',
  'Ward 15 — HSR Layout Sector 5',
  'Ward 17 — BTM Layout',
  'Ward 22 — Marathahalli',
  'Ward 28 — Whitefield',
  'Ward 31 — Bellandur',
  'Ward 35 — Sarjapur Road',
];

const departmentOptions = [
  'Roads & Infrastructure',
  'Sanitation & Waste',
  'Water Supply & Drainage',
  'Street Lighting & Electrical',
  'Parks & Public Amenities',
];

export default function SignupForm({ role }: SignupFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [signupError, setSignupError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>({
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      ward: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false,
      employeeId: '',
      department: '',
    },
  });

  const watchedPassword = watch('password');

  const onSubmit = async (values: SignupFormValues) => {
    setIsLoading(true);
    setSignupError('');

    try {
      // 1. Call Supabase Auth SignUp
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
            role: role,
            phone: values.phone,
            employee_id: values.employeeId || null,
            department_name: values.department || null,
          },
        },
      });

      if (error) {
        setSignupError(error.message);
        return;
      }

      if (data.user) {
        toast.success(
          `Account created for ${values.fullName}! Please sign in with your credentials.`,
          { duration: 5000 }
        );
      }
    } catch {
      setSignupError('An error occurred during account creation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {signupError && (
        <div className="flex items-start gap-2 p-3 bg-danger/5 border border-danger/20 rounded-xl text-sm text-danger">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          {signupError}
        </div>
      )}

      {/* Full Name */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-1.5">
          Full Name <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          {...register('fullName', {
            required: 'Full name is required.',
            minLength: { value: 3, message: 'Name must be at least 3 characters.' },
          })}
          placeholder="e.g. Priya Venkataraman"
          className={`input-field w-full px-4 py-2.5 text-sm rounded-xl ${errors.fullName ? 'input-error' : ''}`}
        />
        {errors.fullName && (
          <p className="text-xs text-danger mt-1 flex items-center gap-1">
            <AlertCircle size={12} />
            {errors.fullName.message}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-1.5">
          Email Address <span className="text-danger">*</span>
        </label>
        <input
          type="email"
          {...register('email', {
            required: 'Email address is required.',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Enter a valid email address.',
            },
          })}
          placeholder={role === 'officer' ? 'priya.nair@bbmp.gov.in' : 'you@example.com'}
          className={`input-field w-full px-4 py-2.5 text-sm rounded-xl ${errors.email ? 'input-error' : ''}`}
        />
        {errors.email && (
          <p className="text-xs text-danger mt-1 flex items-center gap-1">
            <AlertCircle size={12} />
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-1.5">
          Mobile Number <span className="text-danger">*</span>
        </label>
        <input
          type="tel"
          {...register('phone', {
            required: 'Mobile number is required.',
            pattern: {
              value: /^[6-9]\d{9}$/,
              message: 'Enter a valid 10-digit Indian mobile number.',
            },
          })}
          placeholder="98765 43210"
          className={`input-field w-full px-4 py-2.5 text-sm rounded-xl ${errors.phone ? 'input-error' : ''}`}
        />
        {errors.phone && (
          <p className="text-xs text-danger mt-1 flex items-center gap-1">
            <AlertCircle size={12} />
            {errors.phone.message}
          </p>
        )}
      </div>

      {/* Ward — Citizen only */}
      {role === 'citizen' && (
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">
            Your Ward / Area <span className="text-danger">*</span>
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            Select the ward where you reside to receive local alerts.
          </p>
          <select
            {...register('ward', { required: 'Please select your ward.' })}
            className={`input-field w-full px-4 py-2.5 text-sm rounded-xl appearance-none ${errors.ward ? 'input-error' : ''}`}
          >
            <option value="">Select your ward</option>
            {wardOptions.map((w) => (
              <option key={`ward-signup-${w}`} value={w}>
                {w}
              </option>
            ))}
          </select>
          {errors.ward && (
            <p className="text-xs text-danger mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.ward.message}
            </p>
          )}
        </div>
      )}

      {/* Officer / Admin specific fields */}
      {(role === 'officer' || role === 'admin') && (
        <>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Employee ID <span className="text-danger">*</span>
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Your BBMP / department-issued employee identification number.
            </p>
            <input
              type="text"
              {...register('employeeId', { required: 'Employee ID is required for officers.' })}
              placeholder="e.g. BBMP-2024-04821"
              className={`input-field w-full px-4 py-2.5 text-sm rounded-xl font-mono ${errors.employeeId ? 'input-error' : ''}`}
            />
            {errors.employeeId && (
              <p className="text-xs text-danger mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.employeeId.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Department <span className="text-danger">*</span>
            </label>
            <select
              {...register('department', { required: 'Please select your department.' })}
              className={`input-field w-full px-4 py-2.5 text-sm rounded-xl appearance-none ${errors.department ? 'input-error' : ''}`}
            >
              <option value="">Select department</option>
              {departmentOptions.map((d) => (
                <option key={`dept-signup-${d}`} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {errors.department && (
              <p className="text-xs text-danger mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.department.message}
              </p>
            )}
          </div>
        </>
      )}

      {/* Password */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-1.5">
          Password <span className="text-danger">*</span>
        </label>
        <p className="text-xs text-muted-foreground mb-2">
          Minimum 8 characters — include uppercase, number, and symbol.
        </p>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            {...register('password', {
              required: 'Password is required.',
              minLength: { value: 8, message: 'Password must be at least 8 characters.' },
            })}
            placeholder="Create a strong password"
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

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-1.5">
          Confirm Password <span className="text-danger">*</span>
        </label>
        <div className="relative">
          <input
            type={showConfirm ? 'text' : 'password'}
            {...register('confirmPassword', {
              required: 'Please confirm your password.',
              validate: (val) => val === watchedPassword || 'Passwords do not match.',
            })}
            placeholder="Re-enter your password"
            className={`input-field w-full px-4 py-2.5 pr-11 text-sm rounded-xl ${errors.confirmPassword ? 'input-error' : ''}`}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-danger mt-1 flex items-center gap-1">
            <AlertCircle size={12} />
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Terms */}
      <div>
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="agreeTerms"
            {...register('agreeTerms', { required: 'You must agree to the Terms of Service.' })}
            className="w-4 h-4 mt-0.5 rounded border-border accent-primary cursor-pointer shrink-0"
          />
          <label
            htmlFor="agreeTerms"
            className="text-xs text-muted-foreground cursor-pointer select-none leading-relaxed"
          >
            I agree to CivicFix&apos;s{' '}
            <span className="text-primary hover:underline cursor-pointer">Terms of Service</span>{' '}
            and <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>.
          </label>
        </div>
        {errors.agreeTerms && (
          <p className="text-xs text-danger mt-1 flex items-center gap-1">
            <AlertCircle size={12} />
            {errors.agreeTerms.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Creating account...
          </>
        ) : (
          <>
            <UserPlus size={16} />
            Create {role.charAt(0).toUpperCase() + role.slice(1)} Account
          </>
        )}
      </button>
    </form>
  );
}
