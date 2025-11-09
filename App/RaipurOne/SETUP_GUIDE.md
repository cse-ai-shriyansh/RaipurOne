# RaipurOne - Required Dependencies

## Installation Commands

```bash
# Core Expo and React Native packages (already installed)
# expo, react, react-native

# Install additional required packages
npm install @supabase/supabase-js

# Expo packages for features
npx expo install expo-image-picker
npx expo install expo-location  
npx expo install expo-av
npx expo install expo-linear-gradient
npx expo install react-native-svg

# Already installed (check package.json):
# - @expo/vector-icons
# - expo-constants
# - react-native-safe-area-context
```

## Supabase Setup

1. Create a Supabase project at https://supabase.com
2. Create tables:

```sql
-- Complaints table
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

-- Reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL,
  place_name TEXT NOT NULL,
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust as needed)
CREATE POLICY "Users can insert their own complaints" ON complaints
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own complaints" ON complaints
  FOR SELECT USING (true);
```

3. Get your Supabase URL and anon key from Project Settings > API
4. Update `app/services/supabase.js` with your credentials

## OpenWeatherMap API Setup

1. Sign up at https://openweathermap.org/api
2. Get your free API key
3. Update `app/services/weatherService.js` with your API key

## File Structure

```
app/
├── constants/
│   ├── colors.js          # Color palette
│   ├── theme.js           # Theme configuration
│   └── userRoles.js       # User roles and constants
├── services/
│   ├── supabase.js        # Supabase client
│   ├── complaintService.js # Complaint CRUD operations
│   └── weatherService.js   # Weather & AQI API
├── screens/
│   ├── HomeScreen.jsx      # Main dashboard
│   ├── ComplaintBoxScreen.jsx  # Complaint chat UI
│   ├── TravelSaathiScreen.jsx  # Travel safety & weather
│   └── ProfileScreen.jsx   # Profile & activity
├── Components/
│   ├── Splash.jsx         # Splash screen
│   └── Login.jsx          # Login screen
├── AppNavigator.jsx       # Main navigation
└── index.jsx              # App entry point
```

## Test Credentials

- **User**: user@raipurone.in / user123
- **Worker**: worker@raipurone.in / worker123

## Features Implemented

✅ Splash screen with R1 logo
✅ Role-based login (User/Worker)
✅ Home dashboard with feature cards
✅ Complaint Box with Telegram-style chat UI
  - Image/video/audio upload support
  - Location tracking
  - Urgency levels
  - Supabase integration
✅ Travel Saathi
  - Safety checker for places
  - Time-based safety ratings
  - Weather API integration
  - AQI monitoring
✅ Profile & Activity
  - User stats
  - Complaint history with filters
  - Status tracking

## Color Scheme

The app uses a Chhattisgarh/Raipur-inspired palette:
- Primary: Forest Green (#2C5F2D)
- Secondary: Warm Sand/Terracotta (#D4A574)
- Accent: Vibrant Orange (#FF6B35)
- Background: Warm Off-white (#F8F6F1)

## Next Steps

1. Install all dependencies
2. Configure Supabase credentials
3. Configure OpenWeatherMap API key
4. Test on device/emulator
5. Customize colors in `constants/colors.js` if needed
6. Add real news scraping API for crime data (optional)
7. Implement push notifications for complaint updates (optional)
