import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city') || 'Bengaluru';

    // Fetch all officers in the city
    const { data: officers, error } = await supabaseAdmin
      .from('profiles')
      .select('*, departments(id, name, code)')
      .eq('role', 'officer')
      .eq('city', city)
      .eq('approval_status', 'approved')
      .order('created_at', { ascending: false });

    if (error || !officers || officers.length === 0) {
      const { officersStore } = await import('@/lib/officersStore');
      const storeList = officersStore.getAll({ city, approval_status: 'approved' });
      return NextResponse.json({
        officers: storeList.map((o) => ({
          ...o,
          departments: { id: o.department_id || 'dept-01', name: o.department_name, code: 'DEPT' },
        })),
      });
    }

    // Enhance officers with performance stats
    const enhanced = await Promise.all(
      (officers || []).map(async (officer) => {
        const { data: resolvedList } = await supabaseAdmin
          .from('complaints')
          .select('created_at, resolved_at, rating')
          .eq('assigned_officer_id', officer.id)
          .eq('status', 'resolved');

        const resolvedCount = resolvedList?.length || 0;
        let totalHours = 0;
        let ratingSum = 0;
        let ratingCount = 0;

        (resolvedList || []).forEach((c) => {
          if (c.created_at && c.resolved_at) {
            totalHours +=
              (new Date(c.resolved_at).getTime() - new Date(c.created_at).getTime()) /
              (1000 * 60 * 60);
          }
          if (c.rating) {
            ratingSum += c.rating;
            ratingCount++;
          }
        });

        const avgResolutionHours =
          resolvedCount > 0 ? Math.round((totalHours / resolvedCount) * 10) / 10 : 24.0;
        const avgRating = ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : 4.8;

        return {
          ...officer,
          resolved_count: resolvedCount,
          avg_resolution_hours: avgResolutionHours,
          rating: avgRating,
        };
      })
    );

    return NextResponse.json({ officers: enhanced });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch officers.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, full_name, department_id, city = 'Bengaluru', phone } = body;

    if (!email || !full_name) {
      return NextResponse.json({ error: 'Email and Full Name are required.' }, { status: 400 });
    }

    // Create user in Supabase Auth via admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password || 'Officer@2026',
      email_confirm: true,
      user_metadata: {
        full_name,
        role: 'officer',
        city,
        department_id,
        phone,
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Ensure profile row exists & is linked
    if (authData.user) {
      await supabaseAdmin.from('profiles').upsert({
        id: authData.user.id,
        email,
        full_name,
        role: 'officer',
        city,
        department_id,
        phone,
        is_active: true,
      });
    }

    return NextResponse.json({ success: true, user: authData.user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create officer.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { officer_id, department_id, city, is_active } = body;

    if (!officer_id) {
      return NextResponse.json({ error: 'Officer ID is required.' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (department_id !== undefined) updateData.department_id = department_id;
    if (city !== undefined) updateData.city = city;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: updated, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', officer_id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, officer: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update officer.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
