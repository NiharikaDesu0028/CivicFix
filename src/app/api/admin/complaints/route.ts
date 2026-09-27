import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const departmentId = searchParams.get('department_id');

    let query = supabaseAdmin
      .from('complaints')
      .select(
        '*, profiles!citizen_id(full_name, email, phone), assigned:profiles!assigned_officer_id(full_name, email), departments(name, code)'
      );

    if (city && city !== 'all') {
      query = query.eq('city', city);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }
    if (departmentId && departmentId !== 'all') {
      query = query.eq('department_id', departmentId);
    }

    const { data: complaints, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ complaints: [] });
    }

    return NextResponse.json({ complaints: complaints || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch admin complaints.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { complaint_id, action, officer_id, department_id, escalation_reason } = body;

    if (!complaint_id) {
      return NextResponse.json({ error: 'Complaint ID is required.' }, { status: 400 });
    }

    if (action === 'reassign') {
      const updatePayload: Record<string, unknown> = {
        assigned_officer_id: officer_id || null,
        assigned_at: new Date().toISOString(),
        status: officer_id ? 'assigned' : 'submitted',
        updated_at: new Date().toISOString(),
      };
      if (department_id) {
        updatePayload.department_id = department_id;
      }

      const { data: updated, error } = await supabaseAdmin
        .from('complaints')
        .update(updatePayload)
        .eq('id', complaint_id)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      // Log update timeline
      await supabaseAdmin.from('complaint_updates').insert({
        complaint_id,
        author_id: null,
        previous_status: 'assigned',
        new_status: officer_id ? 'assigned' : 'submitted',
        message: `Admin manually reassigned complaint to ${officer_id ? 'officer' : 'department queue'}.`,
      });

      return NextResponse.json({ success: true, complaint: updated });
    }

    if (action === 'escalate') {
      const { data: updated, error } = await supabaseAdmin
        .from('complaints')
        .update({
          status: 'escalated',
          is_escalated: true,
          escalated_at: new Date().toISOString(),
          priority: 'urgent',
          escalation_reason: escalation_reason || 'Manually escalated by System Administrator',
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
        author_id: null,
        previous_status: 'assigned',
        new_status: 'escalated',
        message: `Admin escalated complaint to Urgent Queue: ${escalation_reason || 'Manual Admin Escalation'}`,
      });

      return NextResponse.json({ success: true, complaint: updated });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update complaint.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
