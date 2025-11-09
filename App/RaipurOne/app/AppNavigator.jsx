import React, { useState, lazy, Suspense } from 'react';
import { Platform, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Login from './Components/Login';
import Splash from './Components/Splash';
import ComplaintBoxScreen from './screens/ComplaintBoxScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import TravelSaathiScreen from './screens/TravelSaathiScreen';

// Create simple fallback component for web
const WebFallback = ({ featureName, onBack }) => (
  <View style={styles.webWarning}>
    <Text style={styles.warningTitle}>⚠️ Feature Not Available on Web</Text>
    <Text style={styles.warningText}>
      {featureName} requires native device features (camera, GPS, maps).
      Please use the Expo Go app on your phone.
    </Text>
    <TouchableOpacity 
      style={styles.backButton}
      onPress={onBack}
    >
      <Text style={styles.backButtonText}>← Go Back</Text>
    </TouchableOpacity>
  </View>
);

// Loading component
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
    <ActivityIndicator size="large" color="#FF6B35" />
    <Text style={{ marginTop: 16, color: '#666' }}>Loading...</Text>
  </View>
);

export default function AppNavigator() {
  const [screen, setScreen] = useState('splash'); // 'splash' | 'login' | 'worker' | 'home' | 'complaint' | 'kachragadi' | 'travel' | 'profile'
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState('user'); // 'user' | 'worker'

  const handleSplashComplete = () => {
    setScreen('login');
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setScreen('home');
  };

  const handleLogout = () => {
    setUser(null);
    setScreen('login');
  };

  const handleNavigate = (destination) => {
    setScreen(destination);
  };

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    if (newMode === 'worker') {
      setScreen('worker');
    } else {
      setScreen('login');
    }
  };

  const renderScreen = () => {
    switch (screen) {
      case 'splash':
        return <Splash onSplashComplete={handleSplashComplete} />;
      
      case 'login':
        return (
          <Login 
            onLogin={handleLogin} 
            onModeSwitch={handleModeSwitch}
            currentMode={mode}
          />
        );
      
      case 'worker':
        // Worker features require native modules (camera, notifications)
        if (Platform.OS === 'web') {
          return <WebFallback featureName="Worker Features" onBack={() => setScreen('login')} />;
        }
        // Lazy load on native platforms only
        const WorkerMain = require('../native-screens/WorkerMain').default;
        return (
          <Suspense fallback={<LoadingScreen />}>
            <WorkerMain />
          </Suspense>
        );
      
      case 'home':
        return (
          <HomeScreen
            user={user}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
          />
        );
      
      case 'complaint':
        return (
          <ComplaintBoxScreen
            user={user}
            onBack={() => setScreen('home')}
          />
        );
      
      case 'kachragadi':
        // KachraGadi only works on native (requires react-native-maps)
        if (Platform.OS === 'web') {
          return <WebFallback featureName="KachraGadi Tracking" onBack={() => setScreen('home')} />;
        }
        // Lazy load on native platforms only
        const KachraGadiScreen = require('../native-screens/KachraGadiScreen').default;
        return (
          <Suspense fallback={<LoadingScreen />}>
            <KachraGadiScreen
              user={user}
              onBack={() => setScreen('home')}
            />
          </Suspense>
        );
      
      case 'travel':
        return (
          <TravelSaathiScreen
            onBack={() => setScreen('home')}
          />
        );
      
      case 'profile':
        return (
          <ProfileScreen
            user={user}
            onBack={() => setScreen('home')}
            onLogout={handleLogout}
          />
        );
      
      default:
        return <Splash onSplashComplete={handleSplashComplete} />;
    }
  };

  return renderScreen();
}

const styles = StyleSheet.create({
  webWarning: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF3CD',
  },
  warningTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 16,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 16,
    color: '#856404',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  backButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
