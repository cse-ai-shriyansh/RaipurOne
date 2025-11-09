# Kachra Gadi (Garbage Truck) Feature - Complete Setup Guide

## Overview
The Kachra Gadi feature allows citizens to:
- Request garbage pickup at their location
- Track garbage trucks in real-time on a map
- Find the nearest available truck
- See estimated arrival time (ETA)
- View their request history

---

## Table of Contents
1. [Supabase Database Setup](#supabase-database-setup)
2. [Environment Configuration](#environment-configuration)
3. [Feature Architecture](#feature-architecture)
4. [Testing Guide](#testing-guide)
5. [Troubleshooting](#troubleshooting)

---

## 1. Supabase Database Setup

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project (or create a new one)
4. Note your **Project URL** and **anon/public key** from Settings > API

### Step 2: Create Required Tables

#### 2.1 Create `kachra_gadi_requests` Table

Navigate to: **Database** → **SQL Editor** → **New Query**

Paste and run this SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create requests table
CREATE TABLE public.kachra_gadi_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  address text NOT NULL,
  phone text,
  note text,
  status text NOT NULL DEFAULT 'requested',
  created_at timestamptz NOT NULL DEFAULT now(),
  latitude double precision,
  longitude double precision,
  assigned_truck_id uuid,
  completed_at timestamptz
);

-- Create index for faster queries
CREATE INDEX idx_kachra_requests_status ON public.kachra_gadi_requests(status);
CREATE INDEX idx_kachra_requests_created ON public.kachra_gadi_requests(created_at DESC);
```

#### 2.2 Create `kachra_gadi_trucks` Table

```sql
-- Create trucks table for real-time tracking
CREATE TABLE public.kachra_gadi_trucks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_number text UNIQUE NOT NULL,
  driver_name text,
  driver_phone text,
  current_latitude double precision NOT NULL,
  current_longitude double precision NOT NULL,
  status text NOT NULL DEFAULT 'available', -- available, busy, offline
  last_updated timestamptz NOT NULL DEFAULT now(),
  zone text, -- which area/zone this truck serves
  capacity_kg integer DEFAULT 1000,
  current_load_kg integer DEFAULT 0
);

-- Create index for location queries
CREATE INDEX idx_trucks_location ON public.kachra_gadi_trucks(current_latitude, current_longitude);
CREATE INDEX idx_trucks_status ON public.kachra_gadi_trucks(status);

-- Enable real-time updates for trucks table
ALTER PUBLICATION supabase_realtime ADD TABLE public.kachra_gadi_trucks;
```

#### 2.3 Insert Sample Truck Data (for testing)

```sql
-- Insert some sample trucks in Raipur area
INSERT INTO public.kachra_gadi_trucks (truck_number, driver_name, driver_phone, current_latitude, current_longitude, status, zone) VALUES
  ('RG-01-1234', 'Ramesh Kumar', '9876543210', 21.2514, 81.6296, 'available', 'Civil Lines'),
  ('RG-01-5678', 'Suresh Patel', '9876543211', 21.2379, 81.6337, 'available', 'Pandri'),
  ('RG-01-9012', 'Mahesh Verma', '9876543212', 21.2167, 81.6335, 'busy', 'Shankar Nagar'),
  ('RG-01-3456', 'Dinesh Singh', '9876543213', 21.2711, 81.6051, 'available', 'Devendra Nagar'),
  ('RG-01-7890', 'Rajesh Yadav', '9876543214', 21.1959, 81.6871, 'available', 'Mowa');
```

### Step 3: Configure Row Level Security (RLS)

#### For Development (Permissive - Testing Only)

```sql
-- Enable RLS
ALTER TABLE public.kachra_gadi_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kachra_gadi_trucks ENABLE ROW LEVEL SECURITY;

-- Allow all operations for development (NOT for production!)
CREATE POLICY "dev_all_requests" ON public.kachra_gadi_requests
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "dev_all_trucks" ON public.kachra_gadi_trucks
  FOR ALL USING (true) WITH CHECK (true);
```

#### For Production (Recommended)

```sql
-- Requests policies
CREATE POLICY "users_insert_requests" ON public.kachra_gadi_requests
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "users_view_own_requests" ON public.kachra_gadi_requests
  FOR SELECT USING (user_id = auth.uid() OR auth.uid() IS NOT NULL);

CREATE POLICY "users_update_own_requests" ON public.kachra_gadi_requests
  FOR UPDATE USING (user_id = auth.uid());

-- Trucks policies (read-only for users, admin can update)
CREATE POLICY "public_view_trucks" ON public.kachra_gadi_trucks
  FOR SELECT USING (true);

CREATE POLICY "admin_update_trucks" ON public.kachra_gadi_trucks
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
```

### Step 4: Verify Tables Created

Run this query to confirm:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('kachra_gadi_requests', 'kachra_gadi_trucks');
```

You should see both tables listed.

---

## 2. Environment Configuration

### Step 1: Update `app/services/supabase.js`

Make sure your Supabase configuration is correct:

```javascript
import { createClient } from '@supabase/supabase-js';

// Get from Supabase Dashboard > Settings > API
const supabaseUrl = 'https://YOUR-PROJECT-ID.supabase.co';
const supabaseAnonKey = 'YOUR-ANON-KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl.includes('supabase.co'));

export const TABLES = {
  COMPLAINTS: 'complaints',
  COMPLAINT_MESSAGES: 'complaint_messages',
  COMPLAINT_MEDIA: 'complaint_media',
  KACHRA_GADI: 'kachra_gadi_requests',
  KACHRA_GADI_TRUCKS: 'kachra_gadi_trucks'
};
```

### Step 2: Install Required Dependencies

Run these commands in your project directory:

```bash
# Install Supabase client (if not already installed)
npm install @supabase/supabase-js

# Install map dependencies
npm install react-native-maps

# Install geolocation (Expo package)
npm install expo-location

# For iOS (if targeting iOS)
cd ios && pod install && cd ..
```

### Step 3: Configure Permissions

#### Android (`android/app/src/main/AndroidManifest.xml`)

Add these permissions inside the `<manifest>` tag:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

#### iOS (`ios/RaipurOne/Info.plist`)

Add these keys:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to find nearby garbage trucks</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>We need your location to track garbage trucks</string>
```

---

## 3. Feature Architecture

### File Structure

```
app/
├── services/
│   ├── supabase.js              # Supabase client config
│   ├── truckTrackingService.js  # Truck tracking logic
│   └── complaintService.js
├── screens/
│   ├── KachraGadiScreen.jsx     # Main UI with map
│   └── HomeScreen.jsx
└── AppNavigator.jsx              # Navigation
```

### Key Components

#### 1. **truckTrackingService.js**
- `getNearbyTrucks(userLat, userLng, radiusKm)` - Find trucks within radius
- `findNearestTruck(userLat, userLng)` - Get closest available truck
- `calculateETA(truckLat, truckLng, destLat, destLng)` - Estimate arrival time
- `subscribeToTruckUpdates(callback)` - Real-time truck position updates

#### 2. **KachraGadiScreen.jsx**
- Interactive map showing user location and truck markers
- "Find Nearest Truck" button
- ETA display
- Request submission form
- Request history

### Data Flow

```
User Opens Screen
    ↓
Get User Location (GPS)
    ↓
Fetch Nearby Trucks from Supabase
    ↓
Display on Map with Markers
    ↓
User Clicks "Find Nearest"
    ↓
Calculate Distances & ETAs
    ↓
Show Nearest Truck Info
    ↓
User Submits Request
    ↓
Save to Supabase
    ↓
Assign Truck (optional)
    ↓
Real-time Updates via Supabase Subscription
```

---

## 4. Testing Guide

### Test 1: Verify Database Connection

1. Open the app
2. Navigate to Kachra Gadi screen
3. Check console for any Supabase errors
4. If you see "relation does not exist" → tables not created

### Test 2: Test Truck Display

1. The map should show multiple truck markers
2. Each marker should show truck number on tap
3. Verify coordinates match Raipur area (lat ~21.25, lng ~81.63)

### Test 3: Test "Find Nearest Truck"

1. Allow location permissions
2. Click "Find Nearest Truck" button
3. Should show:
   - Truck number
   - Distance in km
   - ETA in minutes
   - Driver name

### Test 4: Submit Request

1. Fill in:
   - Address
   - Phone number
   - Optional note
2. Click Submit
3. Check request appears in history below
4. Verify in Supabase: Database → Table Editor → kachra_gadi_requests

### Test 5: Real-time Updates

1. Open two devices/browsers with the app
2. In Supabase SQL Editor, update a truck location:
   ```sql
   UPDATE public.kachra_gadi_trucks 
   SET current_latitude = 21.26, current_longitude = 81.64 
   WHERE truck_number = 'RG-01-1234';
   ```
3. Watch the marker move on the map in real-time

---

## 5. Troubleshooting

### Problem: "Invalid Supabase URL"
**Solution:** 
- Check `app/services/supabase.js`
- Ensure URL is `https://XXXXX.supabase.co` format
- Get correct URL from Supabase Dashboard → Settings → API

### Problem: "relation 'kachra_gadi_requests' does not exist"
**Solution:**
- Run the CREATE TABLE SQL in Supabase SQL Editor
- Verify table exists: Database → Table Editor

### Problem: "permission denied for table"
**Solution:**
- Check RLS policies are created
- For dev: use permissive policies
- For prod: ensure user is authenticated

### Problem: Map not showing
**Solution:**
- Check location permissions granted
- Verify react-native-maps installed
- For Android: check Google Play Services installed
- Check console for map API errors

### Problem: Trucks not appearing on map
**Solution:**
- Verify trucks table has data: `SELECT * FROM kachra_gadi_trucks;`
- Check console for fetch errors
- Ensure RLS policy allows SELECT on trucks table

### Problem: ETA shows "N/A"
**Solution:**
- Ensure user location is available
- Check truck has valid lat/lng coordinates
- Verify distance calculation function works

### Problem: Real-time updates not working
**Solution:**
- Verify Realtime is enabled in Supabase: Database → Replication
- Check table is added to publication:
  ```sql
  ALTER PUBLICATION supabase_realtime ADD TABLE public.kachra_gadi_trucks;
  ```
- Ensure RLS allows SELECT

---

## 6. Admin Panel (Optional Future Enhancement)

To update truck locations in real-time, you can build a simple admin panel or use Supabase Dashboard directly:

### Manual Update via SQL:
```sql
UPDATE public.kachra_gadi_trucks 
SET 
  current_latitude = 21.2600,
  current_longitude = 81.6400,
  last_updated = NOW()
WHERE truck_number = 'RG-01-1234';
```

### Automatic Update (GPS tracking app for drivers):
- Build a separate driver app
- Use Geolocation API to get driver's position
- Update truck location every 30 seconds:
  ```javascript
  supabase
    .from('kachra_gadi_trucks')
    .update({ 
      current_latitude: position.coords.latitude,
      current_longitude: position.coords.longitude,
      last_updated: new Date().toISOString()
    })
    .eq('id', truckId);
  ```

---

## 7. Security Best Practices

1. **Use Environment Variables** (don't commit keys to git):
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=xxx
   ```

2. **Enable RLS** on all tables

3. **Validate user input** before saving

4. **Use service_role key ONLY on backend** - never expose in client app

5. **Rate limit** requests to prevent spam

6. **Sanitize phone numbers and addresses**

---

## 8. API Reference

### Truck Tracking Service

```javascript
import truckTrackingService from './services/truckTrackingService';

// Get all available trucks
const trucks = await truckTrackingService.getAvailableTrucks();

// Find trucks within 5km radius
const nearby = await truckTrackingService.getNearbyTrucks(21.25, 81.63, 5);

// Find closest truck
const nearest = await truckTrackingService.findNearestTruck(21.25, 81.63);

// Calculate ETA
const eta = truckTrackingService.calculateETA(
  21.25, 81.63,  // truck position
  21.26, 81.64   // destination
);

// Subscribe to real-time updates
const unsubscribe = truckTrackingService.subscribeToTruckUpdates((trucks) => {
  console.log('Trucks updated:', trucks);
});

// Later: unsubscribe()
```

---

## Support

For issues or questions:
- Check console logs for errors
- Verify Supabase Dashboard → Logs
- Review this guide's troubleshooting section
- Contact: team.vedastack@example.com

---

**Last Updated:** November 5, 2025  
**Version:** 1.0.0  
**Team:** VEDASTACK
