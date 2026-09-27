import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { officersStore } from '@/lib/officersStore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, password, phone, city = 'Bengaluru', department } = body;

    // Validation
    if (!fullName || !email || !password || !phone || !department) {
      return NextResponse.json(
        { error: 'Full name, email, password, phone number, and department are required.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      return NextResponse.json(
        { error: 'Phone number must be exactly 10 digits.' },
        { status: 400 }
      );
    }

    let createdId = `officer-${Date.now()}`;

    // 1. Attempt Supabase Auth user creation
    try {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: 'officer',
          city,
          phone: phoneDigits,
          department_name: department,
          approval_status: 'pending',
        },
      });

      if (!authError && authData?.user) {
        createdId = authData.user.id;
        // 2. Ensure profile record is inserted with pending status
        await supabaseAdmin.from('profiles').upsert({
          id: createdId,
          email,
          full_name: fullName,
          role: 'officer',
          city,
          phone: phoneDigits,
          approval_status: 'pending',
          is_active: true,
        });
      }
    } catch (dbErr) {
      console.warn('Supabase Auth connection unavailable, proceeding with store registration:', dbErr);
    }

    // 3. Register in shared officers store with pending approval
    const storedOfficer = officersStore.addOfficer({
      id: createdId,
      full_name: fullName,
      email,
      phone: phoneDigits,
      role: 'officer',
      city,
      department_name: department,
      approval_status: 'pending',
      password,
    });

    return NextResponse.json({
      success: true,
      officer: storedOfficer,
      message: "Your account is pending admin approval. You'll receive email once approved.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to register officer.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
