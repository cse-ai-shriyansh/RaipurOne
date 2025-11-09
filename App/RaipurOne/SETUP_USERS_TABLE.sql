-- ===================================
-- CREATE USERS/PROFILES TABLE
-- Run this in Supabase SQL Editor
-- ===================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing table if it exists (CAUTION: deletes all data)
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table for profile management
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

-- Create index for faster email lookups
CREATE INDEX idx_users_email ON public.users(email);

-- Enable RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- DEV POLICY: Allow all operations (for testing)
-- Remove this in production and use authenticated policies
DROP POLICY IF EXISTS "dev_all_users" ON public.users;
CREATE POLICY "dev_all_users" ON public.users
  FOR ALL USING (true) WITH CHECK (true);

-- PRODUCTION POLICIES (comment out dev policy above and use these):
/*
CREATE POLICY "users_view_own" ON public.users
  FOR SELECT USING (email = auth.email());

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (email = auth.email());

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (email = auth.email());
*/

-- Sample data (optional)
INSERT INTO public.users (email, name, phone, address) VALUES
  ('demo@vedastack.com', 'Demo User', '9999999999', 'Raipur, Chhattisgarh')
ON CONFLICT (email) DO NOTHING;

-- Verify
SELECT * FROM public.users;
