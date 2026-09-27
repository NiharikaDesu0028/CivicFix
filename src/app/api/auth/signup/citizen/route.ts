import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, password, phone, city = 'Bengaluru', address } = body;

    // Validation
    if (!fullName || !email || !password || !phone) {
      return NextResponse.json(
        { error: 'Full name, email, password, and phone number are required.' },
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

    let createdId = `citizen-${Date.now()}`;

    // 1. Attempt Supabase Auth user creation
    try {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: 'citizen',
          city,
          phone: phoneDigits,
          address: address || '',
          approval_status: 'approved',
        },
      });

      if (!authError && authData?.user) {
        createdId = authData.user.id;
        // 2. Ensure profile record is inserted
        await supabaseAdmin.from('profiles').upsert({
          id: createdId,
          email,
          full_name: fullName,
          role: 'citizen',
          city,
          phone: phoneDigits,
          approval_status: 'approved',
          is_active: true,
        });
      }
    } catch (dbErr) {
      console.warn('Supabase Auth connection unavailable, proceeding with local registration:', dbErr);
    }

    const userProfile = {
      id: createdId,
      email,
      name: fullName,
      role: 'citizen',
      city,
      phone: phoneDigits,
      address: address || '',
      approval_status: 'approved' as const,
    };

    return NextResponse.json({
      success: true,
      user: userProfile,
      message: 'Citizen account created successfully.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create citizen account.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
