import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { calculateDistanceMeters } from '@/lib/location';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const officerId = searchParams.get('officer_id');
    const departmentId = searchParams.get('department_id');
    const city = searchParams.get('city');

    let query = supabaseAdmin
      .from('complaints')
      .select('*, profiles!citizen_id(full_name, email, phone), departments(name, code)');

    if (officerId) {
      query = query.eq('assigned_officer_id', officerId);
    } else if (departmentId) {
      query = query.eq('department_id', departmentId);
    }

    if (city) {
      query = query.eq('city', city);
    }

    const { data: complaints, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ complaints: [] });
    }

    return NextResponse.json({ complaints: complaints || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch officer complaints.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { complaint_id, action, latitude, longitude, after_image_url, officer_id, notes } = body;

    if (!complaint_id) {
      return NextResponse.json({ error: 'Complaint ID is required.' }, { status: 400 });
    }

    // 1. Fetch original complaint to verify location
    const { data: complaint } = await supabaseAdmin
      .from('complaints')
      .select('*')
      .eq('id', complaint_id)
      .single();

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found.' }, { status: 404 });
    }

    // Action: Start Work
    if (action === 'start') {
      const { data: updated, error } = await supabaseAdmin
        .from('complaints')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
          start_latitude: latitude || complaint.latitude,
          start_longitude: longitude || complaint.longitude,
          updated_at: new Date().toISOString(),
        })
        .eq('id', complaint_id)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      await supabaseAdmin.from('complaint_updates').insert({
        complaint_id,
        author_id: officer_id || null,
        previous_status: complaint.status,
        new_status: 'in_progress',
        message:
          notes ||
          `Officer started work at GPS location (${latitude?.toFixed(4) || '—'}, ${longitude?.toFixed(4) || '—'}).`,
      });

      return NextResponse.json({ success: true, complaint: updated });
    }

    // Action: Resolve Issue
    if (action === 'resolve') {
      if (!after_image_url) {
        return NextResponse.json(
          { error: 'An "after" photo of the fixed issue is required to mark as resolved.' },
          { status: 400 }
        );
      }

      const origLat = complaint.latitude || 12.9716;
      const origLng = complaint.longitude || 77.5946;
      const curLat = latitude || origLat;
      const curLng = longitude || origLng;

      // Compute Haversine distance
      const distanceMeters = calculateDistanceMeters(origLat, origLng, curLat, curLng);
      // Verified if within 250 meters
      const resolutionVerified = distanceMeters <= 250;

      const { data: updated, error } = await supabaseAdmin
        .from('complaints')
        .update({
          status: 'resolved',
          after_image_url,
          resolved_at: new Date().toISOString(),
          resolved_latitude: curLat,
          resolved_longitude: curLng,
          resolution_verified: resolutionVerified,
          distance_meters: distanceMeters,
          updated_at: new Date().toISOString(),
        })
        .eq('id', complaint_id)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      await supabaseAdmin.from('complaint_updates').insert({
        complaint_id,
        author_id: officer_id || null,
        previous_status: complaint.status,
        new_status: 'resolved',
        message: `Officer resolved issue. Photo uploaded. GPS Verification: ${resolutionVerified ? 'MATCHED' : 'WARNING (Distance: ' + distanceMeters + 'm)'}`,
      });

      return NextResponse.json({
        success: true,
        complaint: updated,
        resolutionVerified,
        distanceMeters,
      });
    }

    return NextResponse.json({ error: 'Invalid action parameter.' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update complaint status.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
