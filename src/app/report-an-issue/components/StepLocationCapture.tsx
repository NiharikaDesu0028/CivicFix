'use client';
import React, { useState } from 'react';
import { MapPin, Navigation, CheckCircle2, AlertCircle, Edit3 } from 'lucide-react';
import { ReportFormData } from './ReportIssueForm';
import { getCurrentGPSLocation, getCityCenterCoordinates } from '@/lib/location';
import { useAuth } from '@/context/AuthContext';

interface StepLocationCaptureProps {
  formData: ReportFormData;
  updateFormData: (updates: Partial<ReportFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const wardOptions = [
  'Central Ward',
  'North Ward',
  'South Ward',
  'East Ward',
  'West Ward',
  'Market / Commercial Area',
  'Industrial Sector',
  'Residential Zone 1',
  'Residential Zone 2',
];

export default function StepLocationCapture({
  formData,
  updateFormData,
  onNext,
  onBack,
}: StepLocationCaptureProps) {
  const { user } = useAuth();
  const [isCapturing, setIsCapturing] = useState(false);
  const [gpsCaptured, setGpsCaptured] = useState(Boolean(formData.latitude && formData.longitude));
  const [gpsError, setGpsError] = useState('');
  const [manualMode, setManualMode] = useState(false);

  const captureGPS = async () => {
    setIsCapturing(true);
    setGpsError('');

    try {
      let coords: { lat: number; lng: number } | null = null;
      try {
        coords = await getCurrentGPSLocation();
      } catch {
        coords = getCityCenterCoordinates(user?.city);
      }

      if (coords) {
        updateFormData({
          latitude: coords.lat,
          longitude: coords.lng,
          address:
            formData.address ||
            `Near ${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°E, ${user?.city || 'City Center'}`,
          ward: formData.ward || 'Central Ward',
        });
        setGpsCaptured(true);
      } else {
        setGpsError('Could not detect GPS location. Please enter address manually.');
        setManualMode(true);
      }
    } catch {
      setGpsError('Location service unavailable. Please enter address manually.');
      setManualMode(true);
    } finally {
      setIsCapturing(false);
    }
  };

  const canProceed =
    (gpsCaptured || manualMode) && formData.address.length > 3 && formData.ward !== '';

  return (
    <div className="space-y-5">
      <div className="bg-card rounded-2xl border border-border shadow-card p-6">
        <h2 className="text-base font-semibold text-foreground mb-1">Step 2: Confirm Location</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Use GPS to auto-detect your current location, or enter the address manually for{' '}
          {user?.city || 'your municipality'}.
        </p>

        {/* GPS Capture button */}
        {!gpsCaptured && !manualMode && (
          <div className="space-y-4">
            <button
              onClick={captureGPS}
              disabled={isCapturing}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCapturing ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="font-semibold text-sm">Detecting your location...</span>
                </>
              ) : (
                <>
                  <Navigation size={20} className="pulse-ring rounded-full" />
                  <div className="text-left">
                    <p className="font-semibold text-sm">Use Current GPS Location</p>
                    <p className="text-xs text-primary/70">Tap to auto-detect coordinates</p>
                  </div>
                </>
              )}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <button
              onClick={() => setManualMode(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-muted/50 transition-colors"
            >
              <Edit3 size={15} />
              Enter Address Manually
            </button>
          </div>
        )}

        {/* GPS success */}
        {gpsCaptured && !manualMode && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-success/5 border border-success/20 rounded-xl">
              <CheckCircle2 size={18} className="text-success mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-success">GPS Coordinates Captured</p>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                  {formData.latitude?.toFixed(4)}°N, {formData.longitude?.toFixed(4)}°E
                </p>
              </div>
              <button
                onClick={() => {
                  setGpsCaptured(false);
                  setManualMode(true);
                }}
                className="text-xs text-primary hover:underline font-medium"
              >
                Edit
              </button>
            </div>
          </div>
        )}

        {gpsError && (
          <div className="flex items-center gap-2 p-3 bg-danger/5 border border-danger/20 rounded-xl text-sm text-danger mb-4">
            <AlertCircle size={15} className="shrink-0" />
            {gpsError}
          </div>
        )}

        {/* Address fields */}
        {(gpsCaptured || manualMode) && (
          <div className="space-y-4 mt-4">
            {/* Simulated map placeholder */}
            <div className="w-full h-44 rounded-xl bg-slate-900 border border-border relative overflow-hidden">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <MapPin size={22} className="text-primary" />
                </div>
                <p className="text-xs font-mono font-medium text-white">
                  {formData.latitude && formData.longitude
                    ? `${formData.latitude.toFixed(4)}°N, ${formData.longitude.toFixed(4)}°E`
                    : 'Location captured'}
                </p>
                <p className="text-xs text-muted-foreground">{user?.city || 'Municipal area'}</p>
              </div>
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Street Address / Landmark <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => updateFormData({ address: e.target.value })}
                placeholder="e.g. Near Market junction, 4th Main Road"
                className="input-field w-full px-4 py-2.5 text-sm rounded-xl"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Ward / Zone <span className="text-danger">*</span>
              </label>
              <select
                value={formData.ward}
                onChange={(e) => updateFormData({ ward: e.target.value })}
                className="input-field w-full px-4 py-2.5 text-sm rounded-xl appearance-none"
              >
                <option value="">Select your ward/zone</option>
                {wardOptions.map((ward) => (
                  <option key={`ward-${ward}`} value={ward}>
                    {ward}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-muted/50 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Details →
        </button>
      </div>
    </div>
  );
}
