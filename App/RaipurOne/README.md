# 🏛️ RaipurOne - Smart Municipal Services App

![RaipurOne Logo](https://img.shields.io/badge/RaipurOne-नगर_पालिका-2C5F2D?style=for-the-badge)
![React Native](https://img.shields.io/badge/React_Native-0.81.5-61DAFB?style=for-the-badge&logo=react)
![Expo](https://img.shields.io/badge/Expo-54.0-000020?style=for-the-badge&logo=expo)

A comprehensive mobile application for Raipur municipal services, combining civic complaint management with travel safety insights.

## ✨ Features

### 🏠 Main Dashboard
- Clean, professional UI with R1 logo branding
- Role-based access (Citizen User / Municipal Worker)
- Quick access to core services
- Chhattisgarh-inspired color palette

### 📢 Complaint Box
- **Telegram-style chat interface** for filing civic complaints
- **Media attachments**: Upload images, videos, or audio
- **Location tracking**: GPS coordinates for incident location
- **Priority levels**: Urgent, Criminal Offense, Public Safety, Normal
- **Real-time status**: Pending → Initiated → Completed/Rejected
- **Supabase backend**: Cloud storage and database

### ✈️ Travel Saathi
- **Safety Checker**: 
  - Search Raipur locations
  - Time-based safety ratings (Morning/Afternoon/Evening/Night)
  - Safety scores based on reviews and incidents
  - Recent crime/incident alerts
- **Weather & AQI**:
  - Real-time weather via OpenWeatherMap API
  - Air Quality Index monitoring
  - Travel recommendations based on conditions

### 👤 Profile & Activity
- User profile with avatar and role badge
- **Activity Dashboard**:
  - Complaint statistics (Resolved, Pending, In Progress, Rejected)
  - Complete complaint history
  - Filter by status

## 🚀 Getting Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
