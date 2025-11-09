import * as Location from 'expo-location';
import { BACKEND_URL } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

class WorkerLocationService {
  constructor() {
    this.watchSubscription = null;
    this.updateInterval = 5 * 60 * 1000; // 5 minutes in milliseconds
    this.lastUpdateTime = null;
  }

  /**
   * Request location permissions from the user
   * @returns {Promise<boolean>} - Whether permissions were granted
   */
  async requestPermissions() {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        console.warn('❌ Foreground location permission denied');
        return false;
      }

      // Request background permissions (optional, for continuous tracking)
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundStatus !== 'granted') {
        console.warn('⚠️ Background location permission denied (foreground only)');
        // Continue with foreground only
      }

      console.log('✅ Location permissions granted');
      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  /**
   * Get the current GPS location
   * @returns {Promise<Object|null>} - Location coordinates { latitude, longitude, timestamp }
   */
  async getCurrentLocation() {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permissions not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date(location.timestamp).toISOString(),
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        speed: location.coords.speed,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  /**
   * Start tracking worker location with periodic updates
   * @param {string} workerId - The ID of the worker
   * @param {Function} onLocationUpdate - Callback function called on each location update
   * @returns {Promise<boolean>} - Whether tracking was started successfully
   */
  async startTracking(workerId, onLocationUpdate) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permissions not granted');
      }

      // Stop any existing watch
      if (this.watchSubscription) {
        this.watchSubscription.remove();
      }

      console.log('📍 Starting location tracking for worker:', workerId);

      // Watch position with high accuracy
      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: this.updateInterval, // Update every 5 minutes
          distanceInterval: 100, // Or when worker moves 100 meters
        },
        async (location) => {
          const locationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: new Date(location.timestamp).toISOString(),
            accuracy: location.coords.accuracy,
          };

          console.log('📍 Location updated:', locationData);

          // Call the callback
          if (onLocationUpdate) {
            onLocationUpdate(locationData);
          }

          // Send to backend
          await this.sendLocationToBackend(workerId, locationData);
        }
      );

      // Send initial location immediately
      const initialLocation = await this.getCurrentLocation();
      if (initialLocation) {
        await this.sendLocationToBackend(workerId, initialLocation);
      }

      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  }

  /**
   * Stop tracking worker location
   */
  stopTracking() {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
      console.log('🛑 Location tracking stopped');
    }
  }

  /**
   * Send location data to backend API
   * @param {string} workerId - The ID of the worker
   * @param {Object} locationData - The location coordinates
   * @returns {Promise<boolean>} - Whether the update was successful
   */
  async sendLocationToBackend(workerId, locationData) {
    try {
      // Get auth token
      const token = await AsyncStorage.getItem('workerToken');
      if (!token) {
        console.warn('⚠️ No auth token found, skipping location update');
        return false;
      }

      const response = await fetch(`${BACKEND_URL}/workers/${workerId}/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          timestamp: locationData.timestamp,
          accuracy: locationData.accuracy,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Location sent to backend:', result);

      this.lastUpdateTime = new Date();
      return true;
    } catch (error) {
      console.error('❌ Error sending location to backend:', error);
      return false;
    }
  }

  /**
   * Get the last time location was updated
   * @returns {Date|null} - The last update timestamp
   */
  getLastUpdateTime() {
    return this.lastUpdateTime;
  }

  /**
   * Check if tracking is currently active
   * @returns {boolean} - Whether tracking is active
   */
  isTracking() {
    return this.watchSubscription !== null;
  }
}

// Export a singleton instance
export default new WorkerLocationService();
