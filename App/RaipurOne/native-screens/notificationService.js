import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabaseClient';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  /**
   * Register for push notifications and get token
   */
  async registerForPushNotifications() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Failed to get push notification permissions');
        return null;
      }

      try {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        
        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
          })
        ).data;

        console.log('✅ Push notification token:', token);
      } catch (error) {
        console.error('❌ Error getting push token:', error);
        return null;
      }
    } else {
      console.log('⚠️ Must use physical device for Push Notifications');
    }

    this.expoPushToken = token;
    return token;
  }

  /**
   * Save push token to Supabase users table
   */
  async savePushTokenToDatabase(userId, token) {
    if (!token || !userId) {
      console.log('⚠️ Missing userId or token');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .update({ push_token: token })
        .eq('id', userId);

      if (error) {
        console.error('❌ Error saving push token to database:', error);
        return { success: false, error };
      }

      console.log('✅ Push token saved to database');
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error in savePushTokenToDatabase:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Set up notification listeners
   */
  setupNotificationListeners(onNotificationReceived, onNotificationResponse) {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('📨 Notification received:', notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('👆 Notification tapped:', response);
      if (onNotificationResponse) {
        onNotificationResponse(response);
      }
    });
  }

  /**
   * Remove notification listeners
   */
  removeNotificationListeners() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  /**
   * Send local notification (for testing)
   */
  async sendLocalNotification(title, body, data = {}) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Send immediately
    });
  }

  /**
   * Get notification permissions status
   */
  async getPermissionStatus() {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }

  /**
   * Request notification permissions
   */
  async requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    return status;
  }

  /**
   * Get current push token
   */
  getPushToken() {
    return this.expoPushToken;
  }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;
