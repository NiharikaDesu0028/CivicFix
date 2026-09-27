'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AlertCircle, Info } from 'lucide-react';
import { ReportFormData } from './ReportIssueForm';

interface StepIssueDetailsProps {
  formData: ReportFormData;
  updateFormData: (updates: Partial<ReportFormData>) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

interface DetailsFormValues {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  contactPhone: string;
  contactEmail: string;
  isAnonymous: boolean;
}

const priorityOptions = [
  {
    value: 'low',
    label: 'Low',
    desc: 'Minor inconvenience, no immediate risk',
    color: 'text-muted-foreground border-border',
    active: 'border-muted-foreground bg-muted/40',
  },
  {
    value: 'medium',
    label: 'Medium',
    desc: 'Affects daily routine, needs attention',
    color: 'text-info border-info/30',
    active: 'border-info bg-info/5',
  },
  {
    value: 'high',
    label: 'High',
    desc: 'Safety risk, requires urgent response',
    color: 'text-warning border-warning/30',
    active: 'border-warning bg-warning/5',
  },
  {
    value: 'critical',
    label: 'Critical',
    desc: 'Immediate danger, emergency response needed',
    color: 'text-danger border-danger/30',
    active: 'border-danger bg-danger/5',
  },
];

const categoryDepartmentMap: Record<string, string> = {
  pothole: 'Roads & Infrastructure',
  garbage: 'Sanitation & Waste',
  streetlight: 'Street Lighting & Electrical',
  'water-leakage': 'Water Supply & Drainage',
  'blocked-drain': 'Water Supply & Drainage',
  'traffic-signal': 'Roads & Infrastructure',
  'fallen-tree': 'Parks & Public Amenities',
};

export default function StepIssueDetails({
  formData,
  updateFormData,
  onSubmit,
  onBack,
  isSubmitting: externalIsSubmitting = false,
}: StepIssueDetailsProps) {
  const [internalSubmitting, setInternalSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DetailsFormValues>({
    defaultValues: {
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      contactPhone: formData.contactPhone,
      contactEmail: formData.contactEmail,
      isAnonymous: formData.isAnonymous,
    },
  });

  const watchedPriority = watch('priority');
  const watchedAnonymous = watch('isAnonymous');
  const department = categoryDepartmentMap[formData.selectedCategory] || 'Relevant Department';
  const isSubmitting = externalIsSubmitting || internalSubmitting;

  const handleFormSubmit = (values: DetailsFormValues) => {
    setInternalSubmitting(true);
    updateFormData(values);
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Department routing info */}
      <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 flex items-start gap-3">
        <Info size={16} className="text-accent mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-accent">Auto-routed to: {department}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Based on the detected issue category — auto-assigned to department officers upon
            submission.
          </p>
        </div>
      </div>

      {/* Issue details card */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-5">
        <h2 className="text-base font-semibold text-foreground">Step 3: Describe the Issue</h2>

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">
            Issue Title <span className="text-danger">*</span>
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            A short, clear description of the problem (e.g., &quot;Large pothole near school
            gate&quot;).
          </p>
          <input
            type="text"
            {...register('title', {
              required: 'Please enter a title for the issue.',
              minLength: { value: 10, message: 'Title must be at least 10 characters.' },
              maxLength: { value: 100, message: 'Title must be under 100 characters.' },
            })}
            placeholder="e.g. Large pothole near school gate on 5th Cross"
            className={`input-field w-full px-4 py-2.5 text-sm rounded-xl ${errors.title ? 'input-error' : ''}`}
          />
          {errors.title && (
            <p className="text-xs text-danger mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.title.message}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">
            Detailed Description <span className="text-danger">*</span>
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            Include how long the issue has persisted, impact on residents, and any other relevant
            details.
          </p>
          <textarea
            {...register('description', {
              required: 'Please describe the issue.',
              minLength: { value: 20, message: 'Description must be at least 20 characters.' },
            })}
            rows={4}
            placeholder="Describe the issue in detail — how long it has existed, who is affected, any safety concerns..."
            className={`input-field w-full px-4 py-2.5 text-sm rounded-xl resize-none ${errors.description ? 'input-error' : ''}`}
          />
          {errors.description && (
            <p className="text-xs text-danger mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">
            Priority Level <span className="text-danger">*</span>
          </label>
          <p className="text-xs text-muted-foreground mb-3">
            Select based on the urgency and safety impact of the issue.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {priorityOptions.map((opt) => (
              <button
                key={`pri-${opt.value}`}
                type="button"
                onClick={() =>
                  setValue('priority', opt.value as 'low' | 'medium' | 'high' | 'critical')
                }
                className={`flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-all duration-150 ${
                  watchedPriority === opt.value
                    ? `${opt.active} ${opt.color} border-2`
                    : 'border-border text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <span className="text-sm font-semibold">{opt.label}</span>
                <span className="text-xs opacity-80 mt-0.5 leading-tight">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contact info card */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Contact Information</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="relative">
              <input type="checkbox" {...register('isAnonymous')} className="sr-only" />
              <div
                onClick={() => setValue('isAnonymous', !watchedAnonymous)}
                className={`w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer ${watchedAnonymous ? 'bg-accent' : 'bg-muted'}`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 absolute top-0.5 ${watchedAnonymous ? 'translate-x-5' : 'translate-x-0.5'}`}
                />
              </div>
            </div>
            <span className="text-xs font-medium text-muted-foreground">Submit Anonymously</span>
          </label>
        </div>

        {!watchedAnonymous && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Phone Number
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                For officer to contact you if needed.
              </p>
              <input
                type="tel"
                {...register('contactPhone', {
                  pattern: {
                    value: /^[6-9]\d{9}$/,
                    message: 'Enter a valid 10-digit Indian mobile number.',
                  },
                })}
                placeholder="+91 98765 43210"
                className={`input-field w-full px-4 py-2.5 text-sm rounded-xl ${errors.contactPhone ? 'input-error' : ''}`}
              />
              {errors.contactPhone && (
                <p className="text-xs text-danger mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.contactPhone.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Email Address
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Receive status updates via email.
              </p>
              <input
                type="email"
                {...register('contactEmail', {
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Enter a valid email address.',
                  },
                })}
                placeholder="rahul.kumar@gmail.com"
                className={`input-field w-full px-4 py-2.5 text-sm rounded-xl ${errors.contactEmail ? 'input-error' : ''}`}
              />
              {errors.contactEmail && (
                <p className="text-xs text-danger mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.contactEmail.message}
                </p>
              )}
            </div>
          </div>
        )}

        {watchedAnonymous && (
          <p className="text-xs text-muted-foreground bg-muted rounded-xl px-4 py-3">
            Your identity will not be shared with the assigned officer or department. You will not
            receive email/SMS updates.
          </p>
        )}
      </div>

      {/* Review summary */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Submission Summary</h3>
        <div className="space-y-2 text-sm">
          {[
            {
              label: 'Issue Type',
              value: formData.selectedCategory
                ? formData.selectedCategory
                    .replace('-', ' ')
                    .replace(/\b\w/g, (c) => c.toUpperCase())
                : 'General Issue',
            },
            { label: 'Location', value: formData.address || '—' },
            { label: 'Ward', value: formData.ward || '—' },
            { label: 'Department', value: department },
            { label: 'Photo', value: formData.photoFile ? `${formData.photoFile.name}` : '—' },
          ].map((row) => (
            <div key={`summary-${row.label}`} className="flex items-start gap-3">
              <span className="text-muted-foreground text-xs w-24 shrink-0 pt-0.5">
                {row.label}
              </span>
              <span className="text-foreground font-medium text-xs flex-1">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-muted/50 transition-colors"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold min-w-[160px] justify-center disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Complaint'
          )}
        </button>
      </div>
    </form>
  );
}
