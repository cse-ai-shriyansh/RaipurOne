import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

const GARBAGE_TRUCK_SPEED = 0.00003; // Very slow movement speed (degrees per update)
const UPDATE_INTERVAL = 3000; // Update every 3 seconds (very slow pace)

export default function KachraGadiScreen({ onBack }) {
  const [userLocation, setUserLocation] = useState(null);
  const [truckLocation, setTruckLocation] = useState(null);
  const [truckPath, setTruckPath] = useState([]);
  const [isTracking, setIsTracking] = useState(true); // Auto-start tracking
  const [alertDistance, setAlertDistance] = useState(500); // Default 500 meters
  const [currentDistance, setCurrentDistance] = useState(null);
  const [eta, setEta] = useState(null);
  const [showDistanceOptions, setShowDistanceOptions] = useState(false);
  
  const mapRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const locationSubscription = useRef(null);
  const alertShown = useRef(false);

  // Distance options for alert
  const distanceOptions = [100, 200, 500, 1000];

  useEffect(() => {
    initializeLocation();
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (isTracking && userLocation && truckLocation) {
      const interval = setInterval(simulateTruckMovement, UPDATE_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [isTracking, userLocation, truckLocation]);

  useEffect(() => {
    if (userLocation && truckLocation) {
      const dist = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        truckLocation.latitude,
        truckLocation.longitude
      );
      setCurrentDistance(dist);
      calculateETA(dist);

      // Alert when truck is within set distance (only once per tracking session)
      if (dist <= alertDistance && isTracking && !alertShown.current) {
        alertShown.current = true;
        triggerAlert();
      }
    }
  }, [truckLocation, userLocation, alertDistance]);

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Use fallback location even without permission
        const fallbackCoords = {
          latitude: 21.2514, // Raipur center
          longitude: 81.6296,
        };
        setUserLocation(fallbackCoords);
        
        // Set truck location nearby
        const truckCoords = {
          latitude: fallbackCoords.latitude - 0.015, // ~1.5km away
          longitude: fallbackCoords.longitude - 0.015,
        };
        setTruckLocation(truckCoords);
        setTruckPath([truckCoords]);
        return;
      }

      // Get initial user location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const userCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(userCoords);

      // Simulate garbage truck starting location (nearby)
      const truckCoords = {
        latitude: userCoords.latitude - 0.015, // ~1.5km away
        longitude: userCoords.longitude - 0.015,
      };
      setTruckLocation(truckCoords);
      setTruckPath([truckCoords]);

      // Watch user location for real-time updates
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (newLocation) => {
          setUserLocation({
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          });
        }
      );
    } catch (error) {
      console.error('Error getting location:', error);
      // Use fallback location
      const fallbackCoords = {
        latitude: 21.2514,
        longitude: 81.6296,
      };
      setUserLocation(fallbackCoords);
      const truckCoords = {
        latitude: fallbackCoords.latitude - 0.015,
        longitude: fallbackCoords.longitude - 0.015,
      };
      setTruckLocation(truckCoords);
      setTruckPath([truckCoords]);
    }
  };

  const simulateTruckMovement = () => {
    if (!userLocation || !truckLocation) return;

    // Move truck towards user location (slow pace)
    const latDiff = userLocation.latitude - truckLocation.latitude;
    const lngDiff = userLocation.longitude - truckLocation.longitude;

    // Normalize direction
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    if (distance < 0.0001) {
      // Truck has reached user
      setIsTracking(false);
      Alert.alert('Arrived! 🎉', 'The garbage truck has reached your location!');
      return;
    }

    const newLat = truckLocation.latitude + (latDiff / distance) * GARBAGE_TRUCK_SPEED;
    const newLng = truckLocation.longitude + (lngDiff / distance) * GARBAGE_TRUCK_SPEED;

    const newTruckLocation = {
      latitude: newLat,
      longitude: newLng,
    };

    setTruckLocation(newTruckLocation);
    setTruckPath((prev) => [...prev, newTruckLocation]);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Haversine formula for distance in meters
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const calculateETA = (distance) => {
    // Very slow garbage truck speed ~5 km/h = 1.39 m/s (realistic slow collection speed)
    const avgSpeed = 1.39;
    const timeInSeconds = distance / avgSpeed;
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    setEta({ minutes, seconds });
  };

  const triggerAlert = () => {
    // Pulse animation
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.3,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Vibration
    if (Platform.OS !== 'web') {
      Vibration.vibrate([500, 500, 500]);
    }

    Alert.alert(
      '🚛 Truck Approaching!',
      `The garbage truck is within ${alertDistance}m from your location!`,
      [{ text: 'OK' }]
    );
  };

  const startTracking = () => {
    if (!userLocation || !truckLocation) {
      Alert.alert('Error', 'Unable to get locations. Please try again.');
      return;
    }
    setIsTracking(true);
    alertShown.current = false; // Reset alert flag
  };

  const stopTracking = () => {
    setIsTracking(false);
    alertShown.current = false;
  };

  const centerOnUser = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  };

  const centerOnTruck = () => {
    if (mapRef.current && truckLocation) {
      mapRef.current.animateToRegion({
        latitude: truckLocation.latitude,
        longitude: truckLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  };

  const formatDistance = (meters) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${meters.toFixed(0)} m`;
  };

  if (!userLocation || !truckLocation) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="locate" size={64} color="#4CAF50" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {/* User Location Marker */}
        <Marker coordinate={userLocation} anchor={{ x: 0.5, y: 0.5 }}>
          <Animated.View style={[styles.userMarker, { transform: [{ scale: pulseAnim }] }]}>
            <Ionicons name="person" size={24} color="#FFFFFF" />
          </Animated.View>
        </Marker>

        {/* Garbage Truck Marker */}
        <Marker coordinate={truckLocation} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.truckMarker}>
            <Ionicons name="trash-bin" size={28} color="#FFFFFF" />
          </View>
        </Marker>

        {/* Truck Path */}
        {truckPath.length > 1 && (
          <Polyline
            coordinates={truckPath}
            strokeColor="#4CAF50"
            strokeWidth={4}
            lineDashPattern={[5, 5]}
          />
        )}

        {/* Alert Distance Circle */}
        <Circle
          center={userLocation}
          radius={alertDistance}
          fillColor="rgba(76, 175, 80, 0.1)"
          strokeColor="rgba(76, 175, 80, 0.5)"
          strokeWidth={2}
        />
      </MapView>

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      {/* Info Card (Delivery App Style) */}
      <View style={styles.infoCard}>
        {/* Truck Status Header */}
        <View style={styles.statusHeader}>
          <View style={styles.truckIconContainer}>
            <Ionicons name="trash-bin" size={32} color="#4CAF50" />
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>
              {isTracking ? 'Truck is on the way! 🚛' : 'Tracking paused'}
            </Text>
            <Text style={styles.statusSubtitle}>Municipal Garbage Collection</Text>
          </View>
        </View>

        {/* Distance and ETA */}
        {currentDistance !== null && (
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Ionicons name="location" size={24} color="#4CAF50" />
              <Text style={styles.statValue}>{formatDistance(currentDistance)}</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>

            {eta && isTracking && (
              <View style={styles.statBox}>
                <Ionicons name="time" size={24} color="#FF9800" />
                <Text style={styles.statValue}>
                  {eta.minutes}:{eta.seconds.toString().padStart(2, '0')}
                </Text>
                <Text style={styles.statLabel}>ETA</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.statBox}
              onPress={() => setShowDistanceOptions(!showDistanceOptions)}
            >
              <Ionicons name="notifications" size={24} color="#F44336" />
              <Text style={styles.statValue}>{alertDistance}m</Text>
              <Text style={styles.statLabel}>Alert At</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Distance Options */}
        {showDistanceOptions && (
          <View style={styles.distanceOptions}>
            <Text style={styles.optionsTitle}>Set Alert Distance:</Text>
            <View style={styles.optionsRow}>
              {distanceOptions.map((dist) => (
                <TouchableOpacity
                  key={dist}
                  style={[
                    styles.optionButton,
                    alertDistance === dist && styles.optionButtonActive,
                  ]}
                  onPress={() => {
                    setAlertDistance(dist);
                    setShowDistanceOptions(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      alertDistance === dist && styles.optionTextActive,
                    ]}
                  >
                    {dist}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!isTracking ? (
            <TouchableOpacity style={styles.trackButton} onPress={startTracking}>
              <Ionicons name="play" size={24} color="#FFFFFF" />
              <Text style={styles.trackButtonText}>Start Tracking</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.stopButton} onPress={stopTracking}>
              <Ionicons name="stop" size={24} color="#FFFFFF" />
              <Text style={styles.stopButtonText}>Stop Tracking</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity style={styles.controlButton} onPress={centerOnUser}>
            <Ionicons name="person" size={20} color="#4CAF50" />
            <Text style={styles.controlButtonText}>My Location</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={centerOnTruck}>
            <Ionicons name="trash-bin" size={20} color="#4CAF50" />
            <Text style={styles.controlButtonText}>Truck Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  map: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  userMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  truckMarker: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  infoCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  truckIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  distanceOptions: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FFF9C4',
    borderRadius: 12,
  },
  optionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  optionButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  actionButtons: {
    marginBottom: 12,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  trackButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  stopButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  mapControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
  controlButtonText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 6,
  },
});

