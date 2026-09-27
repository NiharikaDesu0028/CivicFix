import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  return handleEscalation(request);
}

export async function POST(request: Request) {
  return handleEscalation(request);
}

async function handleEscalation(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Optional secret key validation if set in env
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized cron key' }, { status: 401 });
    }

    // 1. Try calling the PostgreSQL function escalate_unaccepted_complaints()
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
      'escalate_unaccepted_complaints'
    );

    if (!rpcError && rpcData) {
      return NextResponse.json({
        success: true,
        method: 'database_rpc',
        result: rpcData,
      });
    }

    // 2. Fallback JS implementation if RPC function is not yet created in Supabase
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: staleComplaints, error: fetchErr } = await supabaseAdmin
      .from('complaints')
      .select('id, department_id, assigned_officer_id, title')
      .in('status', ['submitted', 'assigned'])
      .not('assigned_at', 'is', null)
      .lt('assigned_at', cutoffTime);

    if (fetchErr || !staleComplaints || staleComplaints.length === 0) {
      return NextResponse.json({
        success: true,
        method: 'js_fallback',
        reassigned_count: 0,
        escalated_count: 0,
        message: 'No stale unaccepted complaints found (>24 hours).',
      });
    }

    let reassignedCount = 0;
    let escalatedCount = 0;

    for (const complaint of staleComplaints) {
      // Find next available officer in department
      let query = supabaseAdmin.from('profiles').select('id').eq('role', 'officer');

      if (complaint.department_id) {
        query = query.eq('department_id', complaint.department_id);
      }

      if (complaint.assigned_officer_id) {
        query = query.neq('id', complaint.assigned_officer_id);
      }

      const { data: altOfficers } = await query.limit(1);

      if (altOfficers && altOfficers.length > 0) {
        // Reassign officer
        const newOfficerId = altOfficers[0].id;
        await supabaseAdmin
          .from('complaints')
          .update({
            assigned_officer_id: newOfficerId,
            assigned_at: new Date().toISOString(),
            status: 'assigned',
            updated_at: new Date().toISOString(),
          })
          .eq('id', complaint.id);

        await supabaseAdmin.from('complaint_updates').insert({
          complaint_id: complaint.id,
          author_id: null,
          previous_status: 'assigned',
          new_status: 'assigned',
          message:
            'System: Auto-reassigned to next department officer due to 24-hour response SLA breach.',
        });

        reassignedCount++;
      } else {
        // Escalate to Admin Urgent Queue
        await supabaseAdmin
          .from('complaints')
          .update({
            status: 'escalated',
            is_escalated: true,
            escalated_at: new Date().toISOString(),
            priority: 'urgent',
            escalation_reason:
              '24-hour SLA breach: Officer did not accept within 24 hours and no replacement officer was available.',
            updated_at: new Date().toISOString(),
          })
          .eq('id', complaint.id);

        await supabaseAdmin.from('complaint_updates').insert({
          complaint_id: complaint.id,
          author_id: null,
          previous_status: 'assigned',
          new_status: 'escalated',
          message: 'System: Escalated to Admin Urgent Queue due to 24-hour SLA timeout.',
        });

        escalatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      method: 'js_fallback',
      reassigned_count: reassignedCount,
      escalated_count: escalatedCount,
      processed_at: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Cron execution failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
