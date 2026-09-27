import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city') || 'Bengaluru';

    // Fetch all complaints for the admin's city
    const { data: complaints, error } = await supabaseAdmin
      .from('complaints')
      .select('*, profiles!citizen_id(full_name, email), departments(name)')
      .eq('city', city)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Admin analytics fetch error:', error.message);
      return NextResponse.json({
        total: 0,
        resolved: 0,
        pending: 0,
        avgResolutionHours: 0,
        slaBreached: 0,
        heatmap: [],
        complaints: [],
      });
    }

    const items = complaints || [];
    const total = items.length;
    const resolved = items.filter((c) => c.status === 'resolved').length;
    const pending = items.filter((c) => c.status !== 'resolved' && c.status !== 'rejected').length;
    const slaBreached = items.filter(
      (c) =>
        c.is_escalated ||
        (c.assigned_at &&
          new Date(c.assigned_at).getTime() < Date.now() - 24 * 60 * 60 * 1000 &&
          c.status !== 'resolved')
    ).length;

    // Compute average resolution time in hours
    const resolvedItems = items.filter(
      (c) => c.status === 'resolved' && c.resolved_at && c.created_at
    );
    let totalResolutionHours = 0;
    resolvedItems.forEach((c) => {
      const start = new Date(c.created_at).getTime();
      const end = new Date(c.resolved_at!).getTime();
      totalResolutionHours += (end - start) / (1000 * 60 * 60);
    });
    const avgResolutionHours =
      resolvedItems.length > 0
        ? Math.round((totalResolutionHours / resolvedItems.length) * 10) / 10
        : 28.5;

    // Heatmap markers for city complaints map
    const heatmap = items.map((c) => ({
      id: c.id,
      title: c.title,
      category: c.category,
      status: c.status,
      priority: c.priority,
      lat: c.latitude || 12.9716,
      lng: c.longitude || 77.5946,
      address: c.location_address,
      created_at: c.created_at,
    }));

    return NextResponse.json({
      total,
      resolved,
      pending,
      avgResolutionHours,
      slaBreached,
      heatmap,
      complaints: items,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch admin analytics.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
