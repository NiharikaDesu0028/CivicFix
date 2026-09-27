import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { officersStore } from '@/lib/officersStore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city') || undefined;
    const status = searchParams.get('status') || 'pending';

    // 1. Fetch from Supabase if accessible
    let dbOfficers: any[] = [];
    try {
      let query = supabaseAdmin
        .from('profiles')
        .select('*, departments(id, name, code)')
        .eq('role', 'officer');

      if (city) query = query.eq('city', city);
      if (status !== 'all') query = query.eq('approval_status', status);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error && data) {
        dbOfficers = data.map((d) => ({
          id: d.id,
          full_name: d.full_name,
          email: d.email,
          phone: d.phone || 'N/A',
          department_name: d.departments?.name || 'General Municipal Service',
          city: d.city,
          approval_status: d.approval_status || 'approved',
          created_at: d.created_at,
          is_active: d.is_active,
        }));
      }
    } catch {
      // Fallback
    }

    // 2. Fetch from officersStore
    const storeOfficers = officersStore.getAll({ city, approval_status: status });

    // Merge without duplicates (by email or id)
    const combinedMap = new Map<string, any>();
    storeOfficers.forEach((o) => combinedMap.set(o.id, o));
    dbOfficers.forEach((o) => combinedMap.set(o.id, o));

    const officersList = Array.from(combinedMap.values());

    // Calculate status counts
    const allCityOfficers = officersStore.getAll({ city });
    const pendingCount = allCityOfficers.filter((o) => o.approval_status === 'pending').length;
    const approvedCount = allCityOfficers.filter((o) => o.approval_status === 'approved').length;
    const rejectedCount = allCityOfficers.filter((o) => o.approval_status === 'rejected').length;

    return NextResponse.json({
      officers: officersList,
      counts: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: allCityOfficers.length,
      },
      emailLogs: officersStore.getEmailLogs().slice(0, 10),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve officer approvals.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { officer_id, action } = body;

    if (!officer_id || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Valid officer_id and action ("approve" or "reject") are required.' },
        { status: 400 }
      );
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // 1. Update in Supabase profiles if possible
    try {
      await supabaseAdmin
        .from('profiles')
        .update({
          approval_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', officer_id);
    } catch {
      // Fallback
    }

    // 2. Update in shared officersStore and generate email dispatch
    const result = officersStore.updateApproval(officer_id, newStatus);

    if (!result) {
      return NextResponse.json({ error: 'Officer profile not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      officer: result.officer,
      emailSent: result.emailLog,
      message:
        action === 'approve'
          ? `Officer ${result.officer.full_name} has been approved. Confirmation email dispatched.`
          : `Officer application for ${result.officer.full_name} has been rejected. Notification dispatched.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to process officer approval action.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
