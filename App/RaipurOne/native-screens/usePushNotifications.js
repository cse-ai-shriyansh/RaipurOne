import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import notificationService from '../services/notificationService';

/**
 * Custom hook for managing push notifications
 * @param {Object} user - Current user object with id
 */
export const usePushNotifications = (user = null) => {
  const [pushToken, setPushToken] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    registerForPushNotifications();
    setupListeners();

    return () => {
      notificationService.removeNotificationListeners();
    };
  }, [user]);

  const registerForPushNotifications = async () => {
    try {
      // Register for push notifications
      const token = await notificationService.registerForPushNotifications();

      if (token) {
        setPushToken(token);

        // Save token to database if user is logged in
        if (user?.id) {
          const result = await notificationService.savePushTokenToDatabase(user.id, token);
          if (result.success) {
            setIsRegistered(true);
            console.log('✅ Push notifications registered successfully');
          }
        }
      } else {
        console.log('⚠️ Could not register for push notifications');
      }
    } catch (error) {
      console.error('❌ Error registering for push notifications:', error);
    }
  };

  const setupListeners = () => {
    // Handle notification received while app is open
    const handleNotificationReceived = (notification) => {
      console.log('📨 Notification received:', notification);
      
      // You can show an in-app alert or custom UI
      const { title, body } = notification.request.content;
      Alert.alert(title || 'Notification', body || 'You have a new notification');
    };

    // Handle user tapping on notification
    const handleNotificationResponse = (response) => {
      console.log('👆 Notification tapped:', response);
      
      const data = response.notification.request.content.data;
      
      // Navigate based on notification data
      if (data?.type === 'emergency') {
        // Navigate to emergency details
        console.log('Navigate to emergency:', data);
      } else if (data?.type === 'complaint') {
        // Navigate to complaint details
        console.log('Navigate to complaint:', data);
      } else if (data?.type === 'worker_task') {
        // Navigate to worker task
        console.log('Navigate to task:', data);
      }
    };

    notificationService.setupNotificationListeners(
      handleNotificationReceived,
      handleNotificationResponse
    );
  };

  const sendTestNotification = async () => {
    await notificationService.sendLocalNotification(
      '🧪 Test Notification',
      'This is a test notification from RaipurOne!',
      { type: 'test' }
    );
  };

  const requestPermissions = async () => {
    const status = await notificationService.requestPermissions();
    if (status === 'granted') {
      await registerForPushNotifications();
    }
    return status;
  };

  return {
    pushToken,
    isRegistered,
    sendTestNotification,
    requestPermissions,
  };
};
