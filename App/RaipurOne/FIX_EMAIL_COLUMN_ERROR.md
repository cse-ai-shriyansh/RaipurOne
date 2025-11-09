# Quick Fix: "column email does not exist" Error

## Problem
The error `ERROR: 42703: column "email" does not exist` means your Supabase `users` table doesn't have the required columns for the Profile feature.

## Solution: Run SQL in Supabase

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project: `svkffnyzkmgtgtpqkuyr`
3. Click **Database** → **SQL Editor** → **New Query**

### Step 2: Copy & Paste This SQL

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table for profile management
CREATE TABLE IF NOT EXISTS public.users (
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
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Enable RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- DEV POLICY: Allow all operations (for testing)
CREATE POLICY IF NOT EXISTS "dev_all_users" ON public.users
  FOR ALL USING (true) WITH CHECK (true);

-- Sample data
INSERT INTO public.users (email, name, phone, address) VALUES
  ('demo@vedastack.com', 'Demo User', '9999999999', 'Raipur, Chhattisgarh')
ON CONFLICT (email) DO NOTHING;
```

### Step 3: Click "Run"

### Step 4: Verify
Run this to confirm the table exists:
```sql
SELECT * FROM public.users;
```

You should see the demo user and the columns: id, email, name, phone, address, city, created_at, updated_at

---

## Now Test in the App

1. Open Profile screen in your app
2. Fill in Name, Phone, Address
3. Click "Save Profile"
4. You should see: "Saved ✓ - Profile saved to Supabase"

---

## What Changed in Code

### Updated Files:
1. **app/services/userService.js** - Added detailed error logging
2. **app/screens/ProfileScreen.jsx** - Shows actionable error messages
3. **SETUP_USERS_TABLE.sql** - Complete SQL setup script (you can also use this file)

### Error Handling:
- If table doesn't exist: Alert shows "Run SETUP_USERS_TABLE.sql"
- If column is missing: Alert shows which column
- Console logs full error details for debugging

---

## Production Security (Optional - Later)

When ready for production, replace the dev policy with:

```sql
-- Remove dev policy
DROP POLICY IF EXISTS "dev_all_users" ON public.users;

-- Add production policies
CREATE POLICY "users_view_own" ON public.users
  FOR SELECT USING (email = auth.email());

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (email = auth.email());

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (email = auth.email());
```

This restricts users to only view/edit their own profile.

---

**Ready to test!** Run the SQL above, then try saving your profile in the app.
