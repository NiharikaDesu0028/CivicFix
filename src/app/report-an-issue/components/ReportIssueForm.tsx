'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import StepPhotoUpload from './StepPhotoUpload';
import StepLocationCapture from './StepLocationCapture';
import StepIssueDetails from './StepIssueDetails';
import StepSuccess from './StepSuccess';
import { useAuth } from '@/context/AuthContext';
import { ThumbsUp, RefreshCw, AlertTriangle, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { toast } from 'sonner';

export type IssueCategory =
  | 'pothole'
  | 'garbage'
  | 'streetlight'
  | 'water-leakage'
  | 'blocked-drain'
  | 'traffic-signal'
  | 'fallen-tree'
  | '';

export interface ReportFormData {
  photoFile: File | null;
  photoPreview: string | null;
  aiDetectedCategory: IssueCategory;
  aiConfidence: number;
  selectedCategory: IssueCategory;
  latitude: number | null;
  longitude: number | null;
  address: string;
  ward: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  contactPhone: string;
  contactEmail: string;
  isAnonymous: boolean;
  isRecurrence?: boolean;
  parentComplaintId?: string | null;
}

const initialFormData: ReportFormData = {
  photoFile: null,
  photoPreview: null,
  aiDetectedCategory: '',
  aiConfidence: 0,
  selectedCategory: '',
  latitude: null,
  longitude: null,
  address: '',
  ward: '',
  title: '',
  description: '',
  priority: 'medium',
  contactPhone: '',
  contactEmail: '',
  isAnonymous: false,
  isRecurrence: false,
  parentComplaintId: null,
};

const steps = [
  { id: 1, label: 'Upload Photo', description: 'AI detects category' },
  { id: 2, label: 'Location', description: 'Auto GPS capture' },
  { id: 3, label: 'Details', description: 'Describe & confirm' },
];

interface NearbyMatch {
  id: string;
  title: string;
  category: string;
  status: string;
  location_address?: string;
  distance_from_user?: number;
  created_at: string;
  resolved_at?: string;
}

function ReportIssueFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ReportFormData>(initialFormData);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Duplicate / Recurrence check states
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [duplicateModal, setDuplicateModal] = useState<{
    type: 'unresolved_duplicate' | 'resolved_recurrence';
    complaint: NearbyMatch;
  } | null>(null);
  const [isUpvoting, setIsUpvoting] = useState(false);

  // Check URL search params for recurrence flags
  useEffect(() => {
    const recurrenceParam = searchParams.get('recurrence');
    const parentId = searchParams.get('parent_id');
    const category = searchParams.get('category') as IssueCategory;

    if (recurrenceParam === 'true' && parentId) {
      setFormData((prev) => ({
        ...prev,
        isRecurrence: true,
        parentComplaintId: parentId,
        selectedCategory: category || prev.selectedCategory,
        title: prev.title || `Recurring Issue #${parentId.slice(0, 8)}`,
      }));
      toast.info('Reporting a recurrence of issue #' + parentId.slice(0, 8));
    }
  }, [searchParams]);

  const updateFormData = (updates: Partial<ReportFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  // Called when citizen clicks "Submit" in Step 3
  const handleInitiateSubmit = async () => {
    // If this is already explicitly flagged as recurrence, skip duplicate search
    if (formData.isRecurrence) {
      await executeFinalSubmit();
      return;
    }

    // Check for nearby matching complaints
    if (formData.latitude && formData.longitude) {
      setCheckingDuplicates(true);
      try {
        const cat = formData.selectedCategory || formData.aiDetectedCategory || '';
        const res = await fetch(
          `/api/complaints/nearby?lat=${formData.latitude}&lng=${formData.longitude}&radius_km=1&category=${encodeURIComponent(cat)}`
        );

        if (res.ok) {
          const data = await res.json();
          const matches: NearbyMatch[] = (data.complaints || []).filter(
            (c: NearbyMatch) => c.category.toLowerCase() === cat.toLowerCase()
          );

          if (matches.length > 0) {
            const match = matches[0];
            // Case 1: Matching complaint is already resolved -> Prompt recurrence
            if (match.status === 'resolved') {
              setDuplicateModal({
                type: 'resolved_recurrence',
                complaint: match,
              });
              setCheckingDuplicates(false);
              return;
            }
            // Case 2: Matching complaint is open/unresolved -> Prompt upvote
            else {
              setDuplicateModal({
                type: 'unresolved_duplicate',
                complaint: match,
              });
              setCheckingDuplicates(false);
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Duplicate check skipped on error', err);
      } finally {
        setCheckingDuplicates(false);
      }
    }

    // No duplicate found -> proceed with normal submission
    await executeFinalSubmit();
  };

  const executeFinalSubmit = async (recurrenceOverrides?: { parentId: string }) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title || `${formData.selectedCategory || 'Civic'} Issue`,
          category: formData.selectedCategory || formData.aiDetectedCategory || 'pothole',
          description: formData.description,
          location_address: formData.address,
          latitude: formData.latitude,
          longitude: formData.longitude,
          images: formData.photoPreview ? [formData.photoPreview] : [],
          citizen_id: user?.id,
          priority: formData.priority,
          city: user?.city || 'Bengaluru',
          parent_complaint_id: recurrenceOverrides?.parentId || formData.parentComplaintId || null,
          is_recurrence: Boolean(recurrenceOverrides || formData.isRecurrence),
          recurrence_note: recurrenceOverrides
            ? `Reported as recurring occurrence of issue #${recurrenceOverrides.parentId.slice(0, 8)}`
            : null,
        }),
      });

      const resData = await response.json();
      const ticket = resData.complaint?.id || `CF-${2615 + Math.floor(Math.random() * 100)}`;
      setTicketNumber(ticket);
      setSubmitted(true);
      setDuplicateModal(null);
    } catch {
      const fallbackTicket = `CF-${2615 + Math.floor(Math.random() * 100)}`;
      setTicketNumber(fallbackTicket);
      setSubmitted(true);
      setDuplicateModal(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upvote existing unresolved issue
  const handleUpvoteExisting = async (complaintId: string) => {
    setIsUpvoting(true);
    try {
      const res = await fetch('/api/complaints/nearby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaint_id: complaintId }),
      });

      if (res.ok) {
        toast.success('Upvoted! Thank you for confirming this existing issue.');
        setDuplicateModal(null);
        router.push('/citizen-dashboard');
      } else {
        toast.error('Failed to upvote. Submitting as new complaint...');
        await executeFinalSubmit();
      }
    } catch {
      toast.error('Error upvoting issue.');
    } finally {
      setIsUpvoting(false);
    }
  };

  if (submitted) {
    return <StepSuccess ticketNumber={ticketNumber} formData={formData} />;
  }

  return (
    <div>
      {/* Step progress */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-5 mb-6">
        <div className="flex items-center gap-0">
          {steps.map((step, idx) => (
            <React.Fragment key={`step-${step.id}`}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    currentStep === step.id
                      ? 'bg-primary text-white shadow-md'
                      : currentStep > step.id
                        ? 'bg-success text-white'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {currentStep > step.id ? '✓' : step.id}
                </div>
                <p
                  className={`text-xs font-semibold mt-1.5 whitespace-nowrap ${
                    currentStep === step.id ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground hidden sm:block">{step.description}</p>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 mb-5 transition-colors duration-300 ${
                    currentStep > step.id ? 'bg-success' : 'bg-border'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="fade-in">
        {currentStep === 1 && (
          <StepPhotoUpload
            formData={formData}
            updateFormData={updateFormData}
            onNext={() => setCurrentStep(2)}
          />
        )}
        {currentStep === 2 && (
          <StepLocationCapture
            formData={formData}
            updateFormData={updateFormData}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        )}
        {currentStep === 3 && (
          <StepIssueDetails
            formData={formData}
            updateFormData={updateFormData}
            onSubmit={handleInitiateSubmit}
            onBack={() => setCurrentStep(2)}
            isSubmitting={isSubmitting || checkingDuplicates}
          />
        )}
      </div>

      {/* MODAL 1: Similar Unresolved Complaint Found (Upvote Prompt) */}
      {duplicateModal?.type === 'unresolved_duplicate' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-modal space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Similar Issue Already Reported Nearby!
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  We found an open complaint matching this category{' '}
                  <strong className="text-foreground">
                    {duplicateModal.complaint.distance_from_user
                      ? `${duplicateModal.complaint.distance_from_user}m away`
                      : 'in your area'}
                  </strong>
                  . Upvoting helps authorities prioritize it without cluttering the queue.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-1.5">
              <p className="text-sm font-semibold text-foreground">
                {duplicateModal.complaint.title}
              </p>
              <p className="text-xs text-muted-foreground">
                Location: {duplicateModal.complaint.location_address || 'Nearby coordinates'}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] font-bold uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Status: {duplicateModal.complaint.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  Reported {new Date(duplicateModal.complaint.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => executeFinalSubmit()}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                Submit as New Anyway
              </button>
              <button
                type="button"
                onClick={() => handleUpvoteExisting(duplicateModal.complaint.id)}
                disabled={isUpvoting}
                className="w-full sm:w-auto btn-primary flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold"
              >
                <ThumbsUp size={14} />
                {isUpvoting ? 'Upvoting...' : 'Upvote Existing Issue (+1)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Previously Resolved Complaint Found (Recurrence Prompt) */}
      {duplicateModal?.type === 'resolved_recurrence' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-modal space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                <RefreshCw size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Previously Resolved Issue Detected
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  This issue was previously resolved on{' '}
                  <strong className="text-foreground">
                    {duplicateModal.complaint.resolved_at
                      ? new Date(duplicateModal.complaint.resolved_at).toLocaleDateString()
                      : new Date(duplicateModal.complaint.created_at).toLocaleDateString()}
                  </strong>
                  . Are you reporting a new occurrence?
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-1.5">
              <p className="text-sm font-semibold text-foreground">
                {duplicateModal.complaint.title}
              </p>
              <p className="text-xs text-muted-foreground">
                Location: {duplicateModal.complaint.location_address || 'Nearby coordinates'}
              </p>
              <p className="text-xs text-success font-medium flex items-center gap-1">
                <CheckCircle2 size={13} /> Linked to original Ticket #
                {duplicateModal.complaint.id.slice(0, 8)}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDuplicateModal(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeFinalSubmit({ parentId: duplicateModal.complaint.id })}
                disabled={isSubmitting}
                className="w-full sm:w-auto btn-primary flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold"
              >
                <RefreshCw size={14} />
                {isSubmitting ? 'Submitting Recurrence...' : 'Yes, Report as Recurrence'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportIssueForm() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">
          Loading form...
        </div>
      }
    >
      <ReportIssueFormContent />
    </Suspense>
  );
}
