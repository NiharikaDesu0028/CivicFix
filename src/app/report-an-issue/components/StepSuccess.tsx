'use client';
import React, { useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, MapPin, FileText, ArrowRight, Home } from 'lucide-react';
import { ReportFormData } from './ReportIssueForm';
import { toast } from 'sonner';

interface StepSuccessProps {
  ticketNumber: string;
  formData: ReportFormData;
}

const categoryDepartmentMap: Record<string, string> = {
  pothole: 'BBMP Roads Department',
  garbage: 'BBMP Sanitation Department',
  streetlight: 'BESCOM (Electricity)',
  'water-leakage': 'BWSSB (Water Supply)',
  'blocked-drain': 'BBMP Drainage Department',
  'traffic-signal': 'Traffic Police / BBMP',
  'fallen-tree': 'BBMP Horticulture Department',
};

export default function StepSuccess({ ticketNumber, formData }: StepSuccessProps) {
  useEffect(() => {
    toast.success(`Complaint ${ticketNumber} submitted successfully!`, {
      description: 'You will receive updates as your complaint progresses.',
      duration: 5000,
    });
  }, [ticketNumber]);

  const department = categoryDepartmentMap[formData.selectedCategory] || 'Relevant Department';

  return (
    <div className="slide-up">
      <div className="bg-card rounded-2xl border border-success/30 shadow-card p-8 text-center mb-5">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={40} className="text-success" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Complaint Submitted!</h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
          Your issue has been logged and routed to the correct department. You will receive
          SMS/email updates as it progresses.
        </p>

        {/* Ticket number */}
        <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-5 py-3 mb-6">
          <FileText size={16} className="text-primary" />
          <div className="text-left">
            <p className="text-xs text-muted-foreground">Your Ticket Number</p>
            <p className="text-xl font-bold text-primary font-tabular tracking-wider">
              #{ticketNumber}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="bg-muted rounded-xl p-4 text-left space-y-2.5 mb-6">
          {[
            {
              label: 'Issue Category',
              value: formData.selectedCategory
                .replace('-', ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase()),
            },
            { label: 'Routed To', value: department },
            { label: 'Location', value: formData.address || 'Location captured via GPS' },
            { label: 'Current Status', value: 'Received — Awaiting Assignment' },
            { label: 'Expected Response', value: 'Within 2 working days' },
          ].map((row) => (
            <div key={`success-${row.label}`} className="flex items-start gap-3">
              <span className="text-muted-foreground text-xs w-28 shrink-0 pt-0.5">
                {row.label}
              </span>
              <span className="text-foreground font-semibold text-xs flex-1">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Next steps */}
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 text-left mb-6">
          <p className="text-sm font-semibold text-accent mb-2">What happens next?</p>
          <ol className="space-y-1.5">
            {[
              'Your complaint is reviewed by the ward officer within 24 hours.',
              'An officer is assigned and will visit the site.',
              'Work is completed and marked resolved with a photo.',
              'You receive a resolution notification.',
            ].map((step, i) => (
              <li
                key={`step-${i}`}
                className="flex items-start gap-2 text-xs text-muted-foreground"
              >
                <span className="w-4 h-4 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Home size={16} />
            Back to Dashboard
          </Link>
          <Link
            href="/citizen-dashboard"
            className="btn-primary flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
          >
            <MapPin size={16} />
            Track My Complaints
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
