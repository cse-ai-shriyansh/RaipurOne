-- ===================================
-- COMPLETE DATABASE SETUP
-- Run this in Supabase SQL Editor
-- This creates ALL required tables for the Raipur One app
-- ===================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===================================
-- 1. USERS TABLE
-- ===================================
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  phone text,
  address text,
  city text DEFAULT 'Raipur',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON public.users(email);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_all_users" ON public.users;
CREATE POLICY "dev_all_users" ON public.users
  FOR ALL USING (true) WITH CHECK (true);

-- ===================================
-- 2. KACHRA GADI TRUCKS TABLE
-- ===================================
DROP TABLE IF EXISTS public.kachra_gadi_trucks CASCADE;

CREATE TABLE public.kachra_gadi_trucks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_number text UNIQUE NOT NULL,
  driver_name text,
  driver_phone text,
  current_lat decimal(10, 8),
  current_lng decimal(11, 8),
  status text DEFAULT 'available',
  capacity integer DEFAULT 1000,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_trucks_status ON public.kachra_gadi_trucks(status);
ALTER TABLE public.kachra_gadi_trucks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_trucks_all" ON public.kachra_gadi_trucks;
CREATE POLICY "dev_trucks_all" ON public.kachra_gadi_trucks
  FOR ALL USING (true) WITH CHECK (true);

-- ===================================
-- 3. KACHRA GADI REQUESTS TABLE
-- ===================================
DROP TABLE IF EXISTS public.kachra_gadi_requests CASCADE;

CREATE TABLE public.kachra_gadi_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  address text NOT NULL,
  phone text NOT NULL,
  note text,
  truck_id uuid REFERENCES public.kachra_gadi_trucks(id) ON DELETE SET NULL,
  pickup_lat decimal(10, 8),
  pickup_lng decimal(11, 8),
  status text DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_requests_user ON public.kachra_gadi_requests(user_email);
CREATE INDEX idx_requests_truck ON public.kachra_gadi_requests(truck_id);
CREATE INDEX idx_requests_status ON public.kachra_gadi_requests(status);
ALTER TABLE public.kachra_gadi_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_requests_all" ON public.kachra_gadi_requests;
CREATE POLICY "dev_requests_all" ON public.kachra_gadi_requests
  FOR ALL USING (true) WITH CHECK (true);

-- ===================================
-- 4. COMPLAINTS TABLE
-- ===================================
DROP TABLE IF EXISTS public.complaints CASCADE;

CREATE TABLE public.complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  description text NOT NULL,
  media_url text,
  location_lat decimal(10, 8),
  location_long decimal(11, 8),
  urgency text DEFAULT 'normal',
  status text DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_complaints_user ON public.complaints(user_email);
CREATE INDEX idx_complaints_status ON public.complaints(status);
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_complaints_all" ON public.complaints;
CREATE POLICY "dev_complaints_all" ON public.complaints
  FOR ALL USING (true) WITH CHECK (true);

-- ===================================
-- 5. COMPLAINT SESSIONS TABLE
-- ===================================
DROP TABLE IF EXISTS public.complaint_sessions CASCADE;

CREATE TABLE public.complaint_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  title text,
  status text DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_user ON public.complaint_sessions(user_email);
ALTER TABLE public.complaint_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_sessions_all" ON public.complaint_sessions;
CREATE POLICY "dev_sessions_all" ON public.complaint_sessions
  FOR ALL USING (true) WITH CHECK (true);

-- ===================================
-- 6. COMPLAINT MESSAGES TABLE
-- ===================================
DROP TABLE IF EXISTS public.complaint_messages CASCADE;

CREATE TABLE public.complaint_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.complaint_sessions(id) ON DELETE CASCADE,
  text text,
  media_url text,
  location_lat decimal(10, 8),
  location_long decimal(11, 8),
  urgency text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_session ON public.complaint_messages(session_id);
ALTER TABLE public.complaint_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_messages_all" ON public.complaint_messages;
CREATE POLICY "dev_messages_all" ON public.complaint_messages
  FOR ALL USING (true) WITH CHECK (true);

-- ===================================
-- SAMPLE DATA
-- ===================================

-- Sample user
INSERT INTO public.users (email, name, phone, address) VALUES
  ('demo@vedastack.com', 'Demo User', '9999999999', 'Raipur, Chhattisgarh')
ON CONFLICT (email) DO NOTHING;

-- Sample trucks
INSERT INTO public.kachra_gadi_trucks (truck_number, driver_name, driver_phone, current_lat, current_lng, status) VALUES
  ('RJ14AA0001', 'Raj Kumar', '9876543210', 21.2458, 81.6298, 'available'),
  ('RJ14AA0002', 'Vikram Singh', '9876543211', 21.2500, 81.6350, 'available'),
  ('RJ14AA0003', 'Amit Patel', '9876543212', 21.2400, 81.6250, 'busy'),
  ('RJ14AA0004', 'Suresh Gupta', '9876543213', 21.2550, 81.6400, 'available'),
  ('RJ14AA0005', 'Mohan Sharma', '9876543214', 21.2480, 81.6320, 'available')
ON CONFLICT (truck_number) DO NOTHING;

-- ===================================
-- VERIFY TABLES
-- ===================================
SELECT 'Users table:' as table_name, COUNT(*) as record_count FROM public.users
UNION ALL
SELECT 'Trucks table:', COUNT(*) FROM public.kachra_gadi_trucks
UNION ALL
SELECT 'Requests table:', COUNT(*) FROM public.kachra_gadi_requests
UNION ALL
SELECT 'Complaints table:', COUNT(*) FROM public.complaints
UNION ALL
SELECT 'Sessions table:', COUNT(*) FROM public.complaint_sessions
UNION ALL
SELECT 'Messages table:', COUNT(*) FROM public.complaint_messages;
