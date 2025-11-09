import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase credentials or set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://svkffnyzkmgtgtpqkuyr.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2a2Zmbnl6a21ndGd0cHFrdXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODE4NzgsImV4cCI6MjA3Nzg1Nzg3OH0.og58hUhah6JiXepEQMEtBMig89lW6npf42vvfqQVcEY';

// Create client (credentials are now valid)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const isSupabaseConfigured = true;

// Database tables
export const TABLES = {
  COMPLAINTS: 'complaints',
  COMPLAINT_SESSIONS: 'complaint_sessions',
  COMPLAINT_MESSAGES: 'complaint_messages',
  KACHRA_GADI: 'kachra_gadi_requests',
  KACHRA_GADI_TRUCKS: 'kachra_gadi_trucks',
  REVIEWS: 'reviews',
  CRIME_DATA: 'crime_data',
  USERS: 'users',
};
