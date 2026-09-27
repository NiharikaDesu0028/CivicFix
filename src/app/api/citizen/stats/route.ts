import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const citizen_id = searchParams.get('citizen_id');
    const city = searchParams.get('city');

    let personalStats = {
      total: 0,
      received_count: 0,
      assigned_count: 0,
      in_progress_count: 0,
      resolved_count: 0,
      pending_count: 0,
      avg_resolution_hours: 0,
    };

    let citywideStats = {
      total: 0,
      resolved_count: 0,
      avg_resolution_hours: 0,
    };

    if (citizen_id) {
      const { data: myComplaints } = await supabaseAdmin
        .from('complaints')
        .select('*')
        .eq('citizen_id', citizen_id);

      if (myComplaints) {
        personalStats.total = myComplaints.length;
        let sumHours = 0;
        let resCount = 0;

        myComplaints.forEach((c) => {
          if (c.status === 'received' || c.status === 'submitted') personalStats.received_count++;
          if (c.status === 'assigned') personalStats.assigned_count++;
          if (c.status === 'in_progress') personalStats.in_progress_count++;
          if (c.status === 'resolved') {
            personalStats.resolved_count++;
            if (c.resolved_at && c.created_at) {
              const diffMs = new Date(c.resolved_at).getTime() - new Date(c.created_at).getTime();
              sumHours += diffMs / (1000 * 60 * 60);
              resCount++;
            }
          }
        });

        personalStats.pending_count = personalStats.received_count + personalStats.assigned_count;
        if (resCount > 0) {
          personalStats.avg_resolution_hours = sumHours / resCount;
        }
      }
    }

    if (city) {
      const { data: cityComplaints } = await supabaseAdmin
        .from('complaints')
        .select('*')
        .eq('city', city);

      if (cityComplaints) {
        citywideStats.total = cityComplaints.length;
        let sumHours = 0;
        let resCount = 0;

        cityComplaints.forEach((c) => {
          if (c.status === 'resolved') {
            citywideStats.resolved_count++;
            if (c.resolved_at && c.created_at) {
              const diffMs = new Date(c.resolved_at).getTime() - new Date(c.created_at).getTime();
              sumHours += diffMs / (1000 * 60 * 60);
              resCount++;
            }
          }
        });

        if (resCount > 0) {
          citywideStats.avg_resolution_hours = sumHours / resCount;
        }
      }
    }

    return NextResponse.json({ personal: personalStats, citywide: citywideStats });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
