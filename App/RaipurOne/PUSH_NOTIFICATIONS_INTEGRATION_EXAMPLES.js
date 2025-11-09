/**
 * QUICK INTEGRATION EXAMPLE
 * 
 * Copy this code to integrate push notifications in your app
 */

// ====================================================================
// OPTION 1: Auto-register on app start (RECOMMENDED)
// ====================================================================
// File: app/_layout.jsx or App.js

import { useEffect } from 'react';
import notificationService from './services/notificationService';
import { useRouter } from 'expo-router';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    setupPushNotifications();
    
    return () => {
      notificationService.removeNotificationListeners();
    };
  }, []);

  const setupPushNotifications = async () => {
    // Register for push notifications
    const token = await notificationService.registerForPushNotifications();
    
    if (token) {
      console.log('✅ Push token registered:', token);
      
      // If you have user data, save token to database
      // const user = await getCurrentUser();
      // if (user?.id) {
      //   await notificationService.savePushTokenToDatabase(user.id, token);
      // }
    }

    // Set up listeners
    notificationService.setupNotificationListeners(
      // When notification received (app is open)
      (notification) => {
        console.log('📨 Notification received:', notification);
        const { title, body } = notification.request.content;
        alert(`${title}\n${body}`);
      },
      
      // When user taps notification
      (response) => {
        console.log('👆 Notification tapped:', response);
        const data = response.notification.request.content.data;
        
        // Navigate based on notification type
        if (data?.type === 'emergency') {
          router.push(`/emergency/${data.broadcastId}`);
        } else if (data?.type === 'complaint') {
          router.push(`/complaints/${data.complaintId}`);
        } else if (data?.type === 'worker_task') {
          router.push(`/tasks/${data.taskId}`);
        }
      }
    );
  };

  return (
    // Your app content
    <YourAppComponent />
  );
}


// ====================================================================
// OPTION 2: Use in any screen with hook
// ====================================================================
// File: app/screens/HomeScreen.jsx

import { usePushNotifications } from '../hooks/usePushNotifications';

export default function HomeScreen({ user }) {
  const { pushToken, isRegistered, sendTestNotification } = usePushNotifications(user);

  return (
    <View>
      <Text>Notifications: {isRegistered ? '✅ Enabled' : '❌ Disabled'}</Text>
      
      {isRegistered && (
        <Button title="Send Test" onPress={sendTestNotification} />
      )}
    </View>
  );
}


// ====================================================================
// OPTION 3: Add settings screen to navigation
// ====================================================================
// File: app/(tabs)/settings.jsx or similar

import NotificationSettings from '../screens/NotificationSettings';

export default function SettingsScreen({ user }) {
  return (
    <NotificationSettings 
      user={user} 
      onBack={() => router.back()}
    />
  );
}


// ====================================================================
// OPTION 4: Register token after login
// ====================================================================
// File: app/screens/LoginScreen.jsx

import notificationService from '../services/notificationService';

const handleLogin = async (email, password) => {
  try {
    // Your login logic
    const user = await loginUser(email, password);
    
    if (user) {
      // Register push notifications after successful login
      const token = await notificationService.registerForPushNotifications();
      
      if (token) {
        await notificationService.savePushTokenToDatabase(user.id, token);
        console.log('✅ Push notifications enabled for user');
      }
      
      // Navigate to home
      router.replace('/home');
    }
  } catch (error) {
    console.error('Login error:', error);
  }
};


// ====================================================================
// OPTION 5: Send test notification (for debugging)
// ====================================================================
// File: anywhere in your app

import notificationService from './services/notificationService';

const testPushNotification = async () => {
  await notificationService.sendLocalNotification(
    '🧪 Test Notification',
    'This is a test notification from RaipurOne!',
    { 
      type: 'test',
      timestamp: new Date().toISOString()
    }
  );
  
  console.log('✅ Test notification sent!');
};

// Call it from a button
<Button title="Test Push" onPress={testPushNotification} />


// ====================================================================
// BACKEND USAGE (Already implemented in emergencyController.js!)
// ====================================================================
// File: Dashboard/R1_final/bot-backend/src/controllers/emergencyController.js

const { sendPushNotification } = require('../services/pushNotificationService');

// Get users with push tokens
const { data: users } = await supabase
  .from('users')
  .select('id, email, push_token')
  .not('push_token', 'is', null);

// Send notification to each user
for (const user of users) {
  await sendPushNotification(user.push_token, {
    title: '🚨 Emergency Alert',
    body: 'Disease outbreak detected in your area',
    data: {
      type: 'emergency',
      broadcastId: '123',
      severity: 'critical',
    },
    priority: 'high',
  });
}
