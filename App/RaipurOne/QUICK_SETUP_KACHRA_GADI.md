# Quick Setup: Kachra Gadi Feature

## 🚀 Run This SQL in Supabase Dashboard

**Steps:**
1. Go to https://supabase.com/dashboard
2. Select your project: `svkffnyzkmgtgtpqkuyr`
3. Click **Database** → **SQL Editor** → **New Query**
4. Copy and paste the SQL below
5. Click **Run**

---

## SQL Script (Copy & Paste This)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===================================
-- CREATE TRUCKS TABLE
-- ===================================
CREATE TABLE IF NOT EXISTS public.kachra_gadi_trucks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_number text UNIQUE NOT NULL,
  driver_name text,
  driver_phone text,
  current_latitude double precision NOT NULL,
  current_longitude double precision NOT NULL,
  status text NOT NULL DEFAULT 'available',
  last_updated timestamptz NOT NULL DEFAULT now(),
  zone text,
  capacity_kg integer DEFAULT 1000,
  current_load_kg integer DEFAULT 0
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_trucks_location ON public.kachra_gadi_trucks(current_latitude, current_longitude);
CREATE INDEX IF NOT EXISTS idx_trucks_status ON public.kachra_gadi_trucks(status);

-- ===================================
-- UPDATE REQUESTS TABLE
-- (Add new columns to existing table)
-- ===================================
ALTER TABLE public.kachra_gadi_requests 
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision,
ADD COLUMN IF NOT EXISTS assigned_truck_id uuid REFERENCES public.kachra_gadi_trucks(id),
ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_kachra_requests_status ON public.kachra_gadi_requests(status);

-- ===================================
-- INSERT SAMPLE TRUCK DATA
-- (Trucks in Raipur area)
-- ===================================
INSERT INTO public.kachra_gadi_trucks (truck_number, driver_name, driver_phone, current_latitude, current_longitude, status, zone) VALUES
  ('RG-01-1234', 'Ramesh Kumar', '9876543210', 21.2514, 81.6296, 'available', 'Civil Lines'),
  ('RG-01-5678', 'Suresh Patel', '9876543211', 21.2379, 81.6337, 'available', 'Pandri'),
  ('RG-01-9012', 'Mahesh Verma', '9876543212', 21.2167, 81.6335, 'busy', 'Shankar Nagar'),
  ('RG-01-3456', 'Dinesh Singh', '9876543213', 21.2711, 81.6051, 'available', 'Devendra Nagar'),
  ('RG-01-7890', 'Rajesh Yadav', '9876543214', 21.1959, 81.6871, 'available', 'Mowa')
ON CONFLICT (truck_number) DO NOTHING;

-- ===================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ===================================
ALTER TABLE public.kachra_gadi_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kachra_gadi_trucks ENABLE ROW LEVEL SECURITY;

-- ===================================
-- DEV POLICIES (For Testing)
-- Use these for development
-- ===================================
CREATE POLICY IF NOT EXISTS "dev_all_requests" ON public.kachra_gadi_requests
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "dev_all_trucks" ON public.kachra_gadi_trucks
  FOR ALL USING (true) WITH CHECK (true);

-- ===================================
-- ENABLE REAL-TIME UPDATES
-- ===================================
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.kachra_gadi_trucks;

-- ===================================
-- VERIFY SETUP
-- ===================================
SELECT 'Setup complete! ✅' as status;
SELECT COUNT(*) as truck_count FROM public.kachra_gadi_trucks;
```

---

## ✅ Verification

After running the SQL, verify with these queries:

```sql
-- Check trucks table exists and has data
SELECT * FROM public.kachra_gadi_trucks;

-- Check requests table has new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'kachra_gadi_requests';
```

You should see 5 trucks in Raipur area!

---

## 🔒 Production Security (Optional)

When ready for production, **delete dev policies** and add secure ones:

```sql
-- Remove dev policies
DROP POLICY IF EXISTS "dev_all_requests" ON public.kachra_gadi_requests;
DROP POLICY IF EXISTS "dev_all_trucks" ON public.kachra_gadi_trucks;

-- Add production policies
CREATE POLICY "users_insert_requests" ON public.kachra_gadi_requests
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "users_view_own_requests" ON public.kachra_gadi_requests
  FOR SELECT USING (user_email = auth.email() OR auth.uid() IS NOT NULL);

CREATE POLICY "public_view_trucks" ON public.kachra_gadi_trucks
  FOR SELECT USING (true);
```

---

## 📱 Test the App

After running SQL:
1. Start your app: `npx expo start`
2. Navigate to **Kachra Gadi** feature
3. You should see:
   - ✅ Map with 5 truck markers
   - ✅ "Find Nearest Truck" button
   - ✅ Real-time truck locations
   - ✅ Distance and ETA calculations

---

## 🚨 Troubleshooting

### Error: "relation 'kachra_gadi_trucks' does not exist"
→ Run the SQL above in Supabase SQL Editor

### Error: "permission denied"
→ Make sure RLS policies are created (dev_all_requests, dev_all_trucks)

### No trucks showing on map
→ Run the INSERT query to add sample trucks

### Map not loading
→ Check location permissions are granted in app settings

---

**Need help?** See full documentation in `KACHRA_GADI_SETUP.md`
