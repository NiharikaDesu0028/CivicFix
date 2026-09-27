import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { calculateDistanceMeters } from '@/lib/location';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const radiusStr = searchParams.get('radius_km');
    const category = searchParams.get('category');

    if (!latStr || !lngStr) {
      return NextResponse.json({ error: 'Missing lat or lng' }, { status: 400 });
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    const radius_km = radiusStr ? parseFloat(radiusStr) : 2;

    let query = supabaseAdmin.from('complaints').select('*');
    if (category) {
      query = query.eq('category', category);
    }

    const { data: allComplaints, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const complaints =
      allComplaints
        ?.map((c) => {
          const dist = calculateDistanceMeters(lat, lng, c.latitude, c.longitude);
          return { ...c, distance_from_user: dist };
        })
        .filter((c) => c.distance_from_user <= radius_km * 1000) || [];

    return NextResponse.json({ complaints });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { complaint_id } = await request.json();
    if (!complaint_id) {
      return NextResponse.json({ error: 'Missing complaint_id' }, { status: 400 });
    }

    const { data: current } = await supabaseAdmin
      .from('complaints')
      .select('upvote_count')
      .eq('id', complaint_id)
      .single();

    if (!current) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    const { data: complaint, error } = await supabaseAdmin
      .from('complaints')
      .update({ upvote_count: (current.upvote_count || 0) + 1 })
      .eq('id', complaint_id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ complaint });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
