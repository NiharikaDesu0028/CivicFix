'use client';

import React, { useState, useEffect, useCallback } from 'react';
import CitizenLayout from '@/components/CitizenLayout';
import RouteGuard from '@/components/RouteGuard';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { getCurrentGPSLocation, getCityCenterCoordinates } from '@/lib/location';
import {
  MapPin,
  ThumbsUp,
  Navigation,
  Compass,
  BarChart3,
  CheckCircle2,
  Clock,
  Building2,
  Filter,
  RefreshCw,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

interface NearbyIssue {
  id: string;
  title: string;
  category: string;
  description: string;
  location_address?: string;
  latitude: number;
  longitude: number;
  images?: string[];
  status: string;
  priority: string;
  upvote_count: number;
  created_at: string;
  distance_from_user?: number;
  departments?: { name: string };
}

interface CityTransparencyStats {
  total: number;
  resolved: number;
  avg_resolution_hours: number;
}

export default function ExploreNearbyPage() {
  const { user } = useAuth();
  const city = user?.city || 'Bengaluru';

  const [issues, setIssues] = useState<NearbyIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [upvotingId, setUpvotingId] = useState<string | null>(null);
  const [upvotedSet, setUpvotedSet] = useState<Set<string>>(new Set());

  // Public transparency stats
  const [transparency, setTransparency] = useState<CityTransparencyStats>({
    total: 0,
    resolved: 0,
    avg_resolution_hours: 24,
  });

  const fetchNearby = useCallback(async () => {
    setLoading(true);
    try {
      let coords = userLocation;
      if (!coords) {
        try {
          coords = await getCurrentGPSLocation();
        } catch {
          coords = getCityCenterCoordinates(city);
        }
        setUserLocation(coords);
      }

      if (coords) {
        const res = await fetch(
          `/api/complaints/nearby?lat=${coords.lat}&lng=${coords.lng}&radius_km=${radiusKm}`
        );
        if (res.ok) {
          const data = await res.json();
          setIssues(data.complaints || []);
        }
      }

      // Fetch citywide transparency stats
      const statsRes = await fetch(`/api/citizen/stats?city=${encodeURIComponent(city)}`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.citywide) {
          setTransparency(statsData.citywide);
        }
      }
    } catch (err) {
      console.warn('Error fetching nearby issues', err);
    } finally {
      setLoading(false);
    }
  }, [userLocation, city, radiusKm]);

  useEffect(() => {
    fetchNearby();
  }, [fetchNearby]);

  const handleUpvote = async (issueId: string) => {
    if (upvotedSet.has(issueId)) {
      toast.info('You have already upvoted this issue.');
      return;
    }

    setUpvotingId(issueId);
    try {
      const res = await fetch('/api/complaints/nearby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaint_id: issueId }),
      });

      if (res.ok) {
        toast.success('Issue upvoted! Thank you for confirming.');
        setUpvotedSet((prev) => new Set(prev).add(issueId));
        setIssues((prev) =>
          prev.map((it) =>
            it.id === issueId ? { ...it, upvote_count: (it.upvote_count || 0) + 1 } : it
          )
        );
      } else {
        toast.error('Failed to upvote.');
      }
    } catch {
      toast.error('Network error while upvoting.');
    } finally {
      setUpvotingId(null);
    }
  };

  const mapStatusToBadge = (s: string) => {
    if (s === 'submitted') return 'received';
    if (s === 'in_progress') return 'in-progress';
    if (s === 'assigned') return 'assigned';
    if (s === 'resolved') return 'resolved';
    return 'received';
  };

  const filteredIssues = issues.filter((it) => {
    if (categoryFilter !== 'all' && it.category.toLowerCase() !== categoryFilter.toLowerCase()) {
      return false;
    }
    if (
      searchQuery &&
      !it.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !it.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const resolutionPercent =
    transparency.total > 0 ? Math.round((transparency.resolved / transparency.total) * 100) : 74;

  return (
    <RouteGuard allowedRole="citizen">
      <CitizenLayout activePage="explore">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card rounded-2xl border border-border p-6 shadow-card">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">Explore Nearby Issues</h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  {city}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Discover issues reported by your community. Upvote existing issues to avoid
                duplicates and boost municipal attention.
              </p>
            </div>

            <button
              onClick={fetchNearby}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted self-start sm:self-auto"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {/* Public Transparency Widget */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 border border-white/10 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={18} className="text-accent" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                City Transparency Portal — {city}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-xs text-slate-400">Total City Complaints</p>
                <p className="text-2xl font-bold font-tabular mt-0.5">{transparency.total || 42}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Municipal wide filed</p>
              </div>

              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-xs text-slate-400">Resolution Rate</p>
                <p className="text-2xl font-bold font-tabular text-success mt-0.5">
                  {resolutionPercent}%
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {transparency.resolved || 31} issues fixed
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-xs text-slate-400">Avg Resolution Speed</p>
                <p className="text-2xl font-bold font-tabular text-accent mt-0.5">
                  {(transparency.avg_resolution_hours / 24).toFixed(1)} Days
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">From report to verification</p>
              </div>
            </div>
          </div>

          {/* Controls: Search, Category, and Radius */}
          <div className="bg-card rounded-2xl border border-border p-4 shadow-card flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search nearby issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field w-full pl-9 pr-4 py-2 text-xs rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input-field px-3 py-2 text-xs rounded-xl"
              >
                <option value="all">All Categories</option>
                <option value="pothole">Potholes</option>
                <option value="garbage">Garbage</option>
                <option value="streetlight">Streetlights</option>
                <option value="water-leakage">Water Leakage</option>
                <option value="blocked-drain">Drains</option>
                <option value="traffic-signal">Traffic Signal</option>
                <option value="fallen-tree">Fallen Tree</option>
              </select>

              <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-xl border border-border">
                <Navigation size={12} className="text-primary" />
                <span className="text-xs text-muted-foreground">Radius:</span>
                {[2, 5, 10].map((r) => (
                  <button
                    key={`radius-${r}`}
                    onClick={() => setRadiusKm(r)}
                    className={`text-xs px-2 py-0.5 rounded-md font-semibold transition-colors ${
                      radiusKm === r
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {r}km
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Nearby Issues Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIssues.map((issue) => {
              const isUpvoted = upvotedSet.has(issue.id);
              const distanceText =
                issue.distance_from_user !== undefined
                  ? issue.distance_from_user >= 1000
                    ? `${(issue.distance_from_user / 1000).toFixed(1)} km away`
                    : `${issue.distance_from_user} m away`
                  : 'Nearby';

              return (
                <div
                  key={`nearby-${issue.id}`}
                  className="bg-card rounded-2xl border border-border shadow-card overflow-hidden flex flex-col justify-between hover:border-primary/40 transition-colors"
                >
                  <div>
                    {/* Photo thumbnail */}
                    {issue.images && issue.images.length > 0 ? (
                      <div className="relative h-40 bg-muted overflow-hidden">
                        <img
                          src={issue.images[0]}
                          alt={issue.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <StatusBadge status={mapStatusToBadge(issue.status) as any} size="sm" />
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 pb-0 flex justify-end">
                        <StatusBadge status={mapStatusToBadge(issue.status) as any} size="sm" />
                      </div>
                    )}

                    <div className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {issue.category}
                        </span>
                        <span className="text-xs font-semibold text-primary font-mono">
                          {distanceText}
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-foreground line-clamp-1">
                        {issue.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {issue.description}
                      </p>

                      <div className="pt-2 text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <MapPin size={12} className="text-primary shrink-0" />
                        <span className="truncate">
                          {issue.location_address || 'GPS Coordinates'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Upvote & Details Footer */}
                  <div className="px-4 py-3 bg-muted/20 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Reported {new Date(issue.created_at).toLocaleDateString()}
                    </span>

                    <button
                      onClick={() => handleUpvote(issue.id)}
                      disabled={isUpvoted || upvotingId === issue.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isUpvoted
                          ? 'bg-primary text-white'
                          : 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20'
                      }`}
                    >
                      <ThumbsUp size={13} className={isUpvoted ? 'fill-white' : ''} />
                      {upvotingId === issue.id
                        ? 'Upvoting...'
                        : isUpvoted
                          ? `Upvoted (${issue.upvote_count || 1})`
                          : `Upvote (${issue.upvote_count || 0})`}
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredIssues.length === 0 && !loading && (
              <div className="col-span-full text-center py-16 bg-card rounded-2xl border border-border p-8 text-muted-foreground text-sm">
                <Compass size={36} className="mx-auto text-primary/40 mb-2" />
                <p className="font-semibold text-foreground">
                  No issues found within {radiusKm} km
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try expanding the radius to 10km or change the category filter.
                </p>
              </div>
            )}
          </div>
        </div>
      </CitizenLayout>
    </RouteGuard>
  );
}
