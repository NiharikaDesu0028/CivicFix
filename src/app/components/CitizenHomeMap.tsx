'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getCurrentGPSLocation, getCityCenterCoordinates } from '@/lib/location';
import { MapPin, Navigation, Crosshair } from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';

interface ComplaintPin {
  id: string;
  title: string;
  category: string;
  status: string;
  latitude: number;
  longitude: number;
  distance_from_user?: number;
}

export default function CitizenHomeMap() {
  const { user } = useAuth();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [complaints, setComplaints] = useState<ComplaintPin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initMap() {
      if (!user) return;
      try {
        let coords: { lat: number; lng: number } | null = null;
        try {
          coords = await getCurrentGPSLocation();
        } catch {
          coords = getCityCenterCoordinates(user.city);
        }

        if (!coords) {
          coords = getCityCenterCoordinates(user.city);
        }

        setLocation(coords);

        const res = await fetch(
          `/api/complaints/nearby?lat=${coords.lat}&lng=${coords.lng}&radius_km=5`
        );
        if (res.ok) {
          const data = await res.json();
          setComplaints(data.complaints || []);
        }
      } catch (err) {
        console.error('Map init failed', err);
      } finally {
        setLoading(false);
      }
    }
    initMap();
  }, [user]);

  const mapStatusToBadge = (s: string) => {
    if (s === 'submitted') return 'received';
    if (s === 'in_progress') return 'in-progress';
    if (s === 'assigned') return 'assigned';
    if (s === 'resolved') return 'resolved';
    return 'received';
  };

  const getPinColor = (status: string) => {
    switch (status) {
      case 'escalated':
      case 'urgent':
        return 'text-danger drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]';
      case 'in_progress':
      case 'assigned':
        return 'text-warning drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]';
      case 'resolved':
        return 'text-success drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]';
      default:
        return 'text-primary drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]';
    }
  };

  if (!user) return null;

  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            Nearby Issues ({complaints.length})
          </h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <Crosshair className="w-3.5 h-3.5" />
            Within 5 km of your location in {user.city || 'your area'}
          </p>
        </div>
        <Link href="/explore" className="text-sm text-primary font-medium hover:underline">
          Explore all nearby
        </Link>
      </div>

      <div className="relative w-full h-[280px] md:h-[350px] rounded-2xl overflow-hidden bg-slate-900 border border-border shadow-card">
        {/* Map Background Grid */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Current Location Badge */}
        {location && (
          <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs font-mono text-white">
            <Navigation className="w-3 h-3 text-primary animate-pulse" />
            {location.lat.toFixed(4)}°N, {location.lng.toFixed(4)}°E
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Complaint Pins */}
        {!loading &&
          complaints.slice(0, 8).map((complaint, idx) => {
            const positions = [
              { top: '30%', left: '40%' },
              { top: '60%', left: '65%' },
              { top: '25%', left: '75%' },
              { top: '50%', left: '20%' },
              { top: '75%', left: '45%' },
              { top: '15%', left: '55%' },
              { top: '40%', left: '85%' },
              { top: '80%', left: '80%' },
            ];
            const pos = positions[idx % positions.length];

            return (
              <div
                key={complaint.id}
                className="absolute group z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-110 hover:z-20"
                style={pos}
              >
                <MapPin
                  className={`w-6 h-6 ${getPinColor(complaint.status)}`}
                  fill="currentColor"
                />

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[220px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                  <div className="bg-popover text-popover-foreground text-xs p-2.5 rounded-xl shadow-modal border border-border whitespace-normal text-center flex flex-col items-center gap-1">
                    <span className="font-semibold truncate w-full">{complaint.title}</span>
                    <span className="text-[10px] text-muted-foreground capitalize">
                      {complaint.category}
                    </span>
                    <StatusBadge status={mapStatusToBadge(complaint.status) as any} size="sm" />
                  </div>
                </div>
              </div>
            );
          })}

        {/* Center dot for user location */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,1)] z-10">
          <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-50" />
        </div>

        {/* Map Legend */}
        <div className="absolute bottom-4 right-4 z-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 flex flex-wrap gap-3 text-[10px] sm:text-xs text-white">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-danger" /> Urgent
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-warning" /> Progress
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success" /> Resolved
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary" /> Received
          </div>
        </div>
      </div>
    </div>
  );
}
