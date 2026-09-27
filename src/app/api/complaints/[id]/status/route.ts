import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, message, author_id, officer_id } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required.' }, { status: 400 });
    }

    // 1. Fetch existing complaint
    const { data: existing } = await supabaseAdmin
      .from('complaints')
      .select('status')
      .eq('id', id)
      .single();

    const previousStatus = existing?.status || 'submitted';

    // 2. Update complaint status
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (officer_id) {
      updateData.assigned_officer_id = officer_id;
    }

    const { data: updated, error } = await supabaseAdmin
      .from('complaints')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({
        success: true,
        updated: { id, status, updated_at: new Date().toISOString() },
      });
    }

    // 3. Record timeline message
    await supabaseAdmin.from('complaint_updates').insert({
      complaint_id: id,
      author_id: author_id || officer_id || null,
      previous_status: previousStatus,
      new_status: status,
      message: message || `Status updated from ${previousStatus} to ${status}.`,
    });

    return NextResponse.json({ success: true, complaint: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update complaint status.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
