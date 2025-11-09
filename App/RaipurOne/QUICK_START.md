# 🚀 Quick Start Guide - RaipurOne App

## 1️⃣ First Time Setup (5 minutes)

### Install Dependencies (Already Done! ✅)
```bash
npm install
```

### Configure APIs (Required)

#### A. Supabase Setup
1. Go to https://supabase.com
2. Create a new project
3. Go to **Settings** → **API**
4. Copy your **Project URL** and **anon/public key**
5. Edit `app/services/supabase.js`:
   ```js
   const SUPABASE_URL = 'YOUR_URL_HERE';
   const SUPABASE_ANON_KEY = 'YOUR_KEY_HERE';
   ```

6. Go to **SQL Editor** and run this:
   ```sql
   CREATE TABLE complaints (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_email TEXT NOT NULL,
     description TEXT,
     media_url TEXT,
     location_lat DOUBLE PRECISION,
     location_long DOUBLE PRECISION,
     urgency TEXT,
     status TEXT DEFAULT 'pending',
     created_at TIMESTAMP DEFAULT NOW()
   );

   ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Anyone can insert" ON complaints
     FOR INSERT WITH CHECK (true);
   
   CREATE POLICY "Anyone can view" ON complaints
     FOR SELECT USING (true);
   ```

#### B. Weather API Setup (Optional but Recommended)
1. Go to https://openweathermap.org/api
2. Sign up (free)
3. Get your API key
4. Edit `app/services/weatherService.js`:
   ```js
   const OWM_API_KEY = 'YOUR_API_KEY_HERE';
   ```

## 2️⃣ Run the App

```bash
npx expo start
```

Then:
- Press **`a`** for Android emulator
- Press **`i`** for iOS simulator
- Scan QR code with Expo Go app on your phone

## 3️⃣ Test the App

### Login Credentials
- **User**: `user@raipurone.in` / `user123`
- **Worker**: `worker@raipurone.in` / `worker123`

### Test Flow
1. **Splash Screen** → Wait 3 seconds
2. **Login** → Use test credentials above
3. **Home** → See R1 logo and feature cards
4. **Complaint Box** → Try uploading an image and sending a complaint
5. **Travel Saathi** → Check safety ratings and weather
6. **Profile** → View your activity and stats

## 4️⃣ Common Issues & Fixes

### Error: "Supabase credentials not configured"
→ Update `app/services/supabase.js` with your credentials

### Error: "Image picker not working"
→ Run: `npx expo install expo-image-picker`
→ Test on a real device (not always supported in simulator)

### Error: "Weather data unavailable"
→ Add your OpenWeatherMap API key in `app/services/weatherService.js`

### App won't start
```bash
# Clear cache and restart
npx expo start -c
```

## 5️⃣ Customize the App

### Change Colors
Edit `app/constants/colors.js`:
```js
export const COLORS = {
  primary: '#YOUR_COLOR',     // Main brand color
  secondary: '#YOUR_COLOR',   // Secondary brand color
  accent: '#YOUR_COLOR',      // CTA buttons
  // ... more colors
};
```

### Add More Places to Travel Saathi
Edit `app/screens/TravelSaathiScreen.jsx`, update the `places` array.

### Modify Urgency Types
Edit `app/constants/userRoles.js`, update `URGENCY_TYPES` array.

## 6️⃣ Project Structure Quick Reference

```
📁 app/
  📁 constants/        ← Colors, theme, user roles
  📁 services/         ← API calls (Supabase, Weather)
  📁 screens/          ← Main app screens
  📁 Components/       ← Splash, Login
  📄 AppNavigator.jsx  ← Navigation logic
  📄 index.jsx         ← App entry point
```

## 📝 Notes

- The app works **offline** for UI testing (data won't save without Supabase)
- Weather API has free tier limits (60 calls/minute)
- Complaint media uploads require Supabase storage setup

## 🎯 Next Steps

1. Configure Supabase (5 min)
2. Configure Weather API (2 min) - optional
3. Run `npx expo start`
4. Test all features
5. Customize colors/branding as needed

---

**Need help?** Check `SETUP_GUIDE.md` for detailed instructions.

**Ready to deploy?** Run `npx expo build:android` or `npx expo build:ios`
