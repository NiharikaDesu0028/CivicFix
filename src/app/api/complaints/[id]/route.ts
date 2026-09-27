import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data: complaint, error } = await supabaseAdmin
      .from('complaints')
      .select(
        '*, profiles!citizen_id(full_name, email), assigned:profiles!assigned_officer_id(full_name), departments(name, code)'
      )
      .eq('id', id)
      .single();

    if (error || !complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    const { data: timeline } = await supabaseAdmin
      .from('complaint_updates')
      .select('*')
      .eq('complaint_id', id)
      .order('created_at', { ascending: true });

    return NextResponse.json({ complaint, timeline: timeline || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { rating, feedback_text } = await request.json();

    const { data: existing } = await supabaseAdmin
      .from('complaints')
      .select('status')
      .eq('id', id)
      .single();

    if (!existing || existing.status !== 'resolved') {
      return NextResponse.json({ error: 'Complaint is not resolved' }, { status: 400 });
    }

    const { data: complaint, error } = await supabaseAdmin
      .from('complaints')
      .update({ rating, feedback_text })
      .eq('id', id)
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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const citizen_id = searchParams.get('citizen_id');

    if (!citizen_id) {
      return NextResponse.json({ error: 'Missing citizen_id' }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from('complaints')
      .select('citizen_id')
      .eq('id', id)
      .single();

    if (!existing || existing.citizen_id !== citizen_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabaseAdmin.from('complaints').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
