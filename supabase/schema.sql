-- ==========================================
-- CIVICFIX MULTI-CITY SUPABASE DATABASE SCHEMA
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------
-- 1. DEPARTMENTS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Bengaluru',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name, city)
);

-- Seed default departments for major cities
INSERT INTO public.departments (name, code, city)
VALUES 
  ('Roads & Infrastructure', 'ROADS', 'Bengaluru'),
  ('Sanitation & Waste', 'WASTE', 'Bengaluru'),
  ('Water Supply & Drainage', 'WATER', 'Bengaluru'),
  ('Street Lighting & Electrical', 'LIGHTING', 'Bengaluru'),
  ('Parks & Public Amenities', 'PARKS', 'Bengaluru'),

  ('Roads & Infrastructure', 'ROADS', 'Mumbai'),
  ('Sanitation & Waste', 'WASTE', 'Mumbai'),
  ('Water Supply & Drainage', 'WATER', 'Mumbai'),
  ('Street Lighting & Electrical', 'LIGHTING', 'Mumbai'),
  ('Parks & Public Amenities', 'PARKS', 'Mumbai'),

  ('Roads & Infrastructure', 'ROADS', 'Delhi'),
  ('Sanitation & Waste', 'WASTE', 'Delhi'),
  ('Water Supply & Drainage', 'WATER', 'Delhi'),
  ('Street Lighting & Electrical', 'LIGHTING', 'Delhi'),
  ('Parks & Public Amenities', 'PARKS', 'Delhi')
ON CONFLICT DO NOTHING;

-- ------------------------------------------
-- 2. USER PROFILES TABLE (Extends auth.users)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('citizen', 'officer', 'admin')) DEFAULT 'citizen',
  city TEXT NOT NULL DEFAULT 'Bengaluru',
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  phone TEXT,
  approval_status TEXT NOT NULL CHECK (approval_status IN ('pending', 'approved', 'rejected')) DEFAULT 'approved',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
CREATE POLICY "Allow public read access to profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
CREATE POLICY "Allow users to update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow admins to manage profiles" ON public.profiles;
CREATE POLICY "Allow admins to manage profiles" ON public.profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Trigger to auto-create profile when user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, city, department_id, phone, approval_status, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'citizen'),
    COALESCE(NEW.raw_user_meta_data->>'city', 'Bengaluru'),
    NULLIF(NEW.raw_user_meta_data->>'department_id', '')::uuid,
    NEW.raw_user_meta_data->>'phone',
    COALESCE(
      NEW.raw_user_meta_data->>'approval_status',
      CASE WHEN NEW.raw_user_meta_data->>'role' = 'officer' THEN 'pending' ELSE 'approved' END
    ),
    TRUE
  );
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------
-- 3. COMPLAINTS TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Bengaluru',
  location_address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  images TEXT[] DEFAULT '{}',
  after_image_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('submitted', 'assigned', 'in_progress', 'resolved', 'rejected', 'escalated')) DEFAULT 'submitted',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  citizen_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  assigned_officer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  start_latitude DOUBLE PRECISION,
  start_longitude DOUBLE PRECISION,
  resolved_at TIMESTAMPTZ,
  resolved_latitude DOUBLE PRECISION,
  resolved_longitude DOUBLE PRECISION,
  resolution_verified BOOLEAN DEFAULT TRUE,
  distance_meters DOUBLE PRECISION,
  is_escalated BOOLEAN DEFAULT FALSE,
  escalated_at TIMESTAMPTZ,
  escalation_reason TEXT,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  feedback_text TEXT,
  upvote_count INT DEFAULT 0,
  parent_complaint_id UUID REFERENCES public.complaints(id) ON DELETE SET NULL,
  is_recurrence BOOLEAN DEFAULT FALSE,
  recurrence_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on complaints
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read complaints policy" ON public.complaints;
CREATE POLICY "Read complaints policy" ON public.complaints
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert complaints policy" ON public.complaints;
CREATE POLICY "Insert complaints policy" ON public.complaints
  FOR INSERT WITH CHECK (auth.uid() = citizen_id OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Update complaints policy" ON public.complaints;
CREATE POLICY "Update complaints policy" ON public.complaints
  FOR UPDATE USING (true);

-- ------------------------------------------
-- 4. COMPLAINT UPDATES & TIMELINE TABLE
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.complaint_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  previous_status TEXT,
  new_status TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.complaint_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read access for complaint updates" ON public.complaint_updates;
CREATE POLICY "Read access for complaint updates" ON public.complaint_updates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert access for complaint updates" ON public.complaint_updates;
CREATE POLICY "Insert access for complaint updates" ON public.complaint_updates FOR INSERT WITH CHECK (true);

-- ------------------------------------------
-- 5. AUTO-ASSIGN & 24-HOUR ESCALATION MATRIX FUNCTION
-- ------------------------------------------
CREATE OR REPLACE FUNCTION public.escalate_unaccepted_complaints()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  rec RECORD;
  next_officer_id UUID;
  reassigned_count INT := 0;
  escalated_count INT := 0;
BEGIN
  FOR rec IN 
    SELECT c.id, c.department_id, c.assigned_officer_id, c.city
    FROM public.complaints c
    WHERE c.status IN ('submitted', 'assigned')
      AND c.assigned_at IS NOT NULL
      AND c.assigned_at < (NOW() - INTERVAL '24 hours')
  LOOP
    next_officer_id := NULL;

    SELECT p.id INTO next_officer_id
    FROM public.profiles p
    LEFT JOIN public.complaints act ON act.assigned_officer_id = p.id AND act.status IN ('assigned', 'in_progress')
    WHERE p.role = 'officer'
      AND p.is_active = TRUE
      AND (p.city = rec.city)
      AND (rec.department_id IS NULL OR p.department_id = rec.department_id)
      AND p.id IS DISTINCT FROM rec.assigned_officer_id
    GROUP BY p.id
    ORDER BY COUNT(act.id) ASC
    LIMIT 1;

    IF next_officer_id IS NOT NULL THEN
      UPDATE public.complaints
      SET assigned_officer_id = next_officer_id,
          assigned_at = NOW(),
          status = 'assigned',
          updated_at = NOW()
      WHERE id = rec.id;

      INSERT INTO public.complaint_updates (complaint_id, author_id, previous_status, new_status, message)
      VALUES (rec.id, NULL, 'assigned', 'assigned', 'System: Auto-reassigned to next available department officer in city due to 24-hour response timeout.');

      reassigned_count := reassigned_count + 1;
    ELSE
      UPDATE public.complaints
      SET status = 'escalated',
          is_escalated = TRUE,
          escalated_at = NOW(),
          priority = 'urgent',
          escalation_reason = '24-hour SLA breach: Assigned officer did not accept and no alternative department officer was available.',
          updated_at = NOW()
      WHERE id = rec.id;

      INSERT INTO public.complaint_updates (complaint_id, author_id, previous_status, new_status, message)
      VALUES (rec.id, NULL, 'assigned', 'escalated', 'System: Escalated to Admin Urgent Queue due to 24-hour SLA timeout.');

      escalated_count := escalated_count + 1;
    END IF;
  END LOOP;

  RETURN json_build_object(
    'reassigned_count', reassigned_count,
    'escalated_count', escalated_count,
    'processed_at', NOW()
  );
END;
$function$;
