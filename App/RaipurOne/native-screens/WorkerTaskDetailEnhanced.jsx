import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL, API_ENDPOINTS } from '../app/services/config';

const COLORS = {
  background: '#000000',
  surface: '#111111',
  surfaceLight: '#1A1A1A',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  border: '#333333',
  primary: '#000000',
  secondary: '#FFFFFF',
  blue: '#3B82F6',
  red: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
};

const WorkerTaskDetailScreen = ({ route, navigation }) => {
  const { task } = route.params;
  const [hasPermission, setHasPermission] = useState(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    requestPermissions();
    getCurrentLocation();
  }, []);

  const requestPermissions = async () => {
    // Location permission
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    setHasPermission(locationStatus === 'granted');

    // Camera permission
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    setHasCameraPermission(cameraStatus === 'granted');

    if (locationStatus !== 'granted' || cameraStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and location permissions are required to submit work proof.',
        [{ text: 'OK' }]
      );
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c * 1000; // Distance in meters
    return distance;
  };

  const verifyLocation = () => {
    if (!currentLocation || !task.location) {
      Alert.alert(
        'Location Required',
        'Unable to verify your location. Please ensure GPS is enabled and try again.',
        [{ text: 'OK' }]
      );
      return false;
    }

    // Parse task location
    let taskLat, taskLon;
    try {
      if (typeof task.location === 'object') {
        taskLat = parseFloat(task.location.latitude);
        taskLon = parseFloat(task.location.longitude);
      } else if (typeof task.location === 'string') {
        const coords = task.location.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
        if (coords) {
          taskLat = parseFloat(coords[1]);
          taskLon = parseFloat(coords[2]);
        }
      }
    } catch (error) {
      console.error('Error parsing task location:', error);
      Alert.alert(
        'Location Error',
        'Unable to parse task location. Please contact support.',
        [{ text: 'OK' }]
      );
      return false;
    }

    if (!taskLat || !taskLon) {
      Alert.alert(
        'Location Error',
        'Task location not available. Please contact admin.',
        [{ text: 'OK' }]
      );
      return false;
    }

    const distance = getDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      taskLat,
      taskLon
    );

    // STRICT: Allow submission ONLY if within 500 meters
    if (distance > 500) {
      Alert.alert(
        '⚠️ Location Verification Failed',
        `You are ${Math.round(distance)}m away from the complaint location.\n\n` +
        `Maximum allowed distance: 500m\n\n` +
        `Please move closer to the complaint location to capture photo/video as proof of work completion.`,
        [{ text: 'Understood', style: 'cancel' }]
      );
      return false;
    }

    // Show success message for close proximity
    if (distance <= 100) {
      // Very close, good!
      return true;
    } else {
      // Within range but show distance
      Alert.alert(
        '✅ Location Verified',
        `You are ${Math.round(distance)}m from the complaint location. You may proceed.`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => false },
          { text: 'Continue', onPress: () => true }
        ]
      );
      return true;
    }
  };

  const capturePhoto = async () => {
    if (!cameraRef.current) return;

    // ENFORCE strict location check
    const locationValid = await verifyLocation();
    if (!locationValid) return;

    try {
      await getCurrentLocation(); // Get fresh location

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: true,
      });

      setCapturedMedia([
        ...capturedMedia,
        {
          uri: photo.uri,
          type: 'image',
          location: currentLocation,
          timestamp: new Date().toISOString(),
        },
      ]);

      Alert.alert('Success', 'Photo captured!');
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const startVideoRecording = async () => {
    if (!cameraRef.current) return;

    // ENFORCE strict location check
    const locationValid = await verifyLocation();
    if (!locationValid) return;

    try {
      await getCurrentLocation();

      setIsRecording(true);
      const video = await cameraRef.current.recordAsync({
        quality: Camera.Constants.VideoQuality['720p'],
        maxDuration: 30, // 30 seconds max
      });

      setCapturedMedia([
        ...capturedMedia,
        {
          uri: video.uri,
          type: 'video',
          location: currentLocation,
          timestamp: new Date().toISOString(),
        },
      ]);

      setIsRecording(false);
      Alert.alert('Success', 'Video recorded!');
    } catch (error) {
      console.error('Error recording video:', error);
      setIsRecording(false);
      Alert.alert('Error', 'Failed to record video');
    }
  };

  const stopVideoRecording = async () => {
    if (cameraRef.current) {
      cameraRef.current.stopRecording();
    }
  };

  const removeMedia = (index) => {
    setCapturedMedia(capturedMedia.filter((_, i) => i !== index));
  };

  const validateWithGemini = async (mediaUri, location) => {
    try {
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(mediaUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Send to backend for Gemini validation
      const response = await fetch(`${BACKEND_URL}${API_ENDPOINTS.VALIDATE_WORK}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediaBase64: base64,
          location: location,
          taskLocation: task.location,
          taskDescription: task.query,
          taskDepartment: task.department,
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error validating with Gemini:', error);
      return { success: false, message: 'Validation failed' };
    }
  };

  const handleSubmit = async () => {
    if (capturedMedia.length === 0) {
      Alert.alert('Error', 'Please capture at least one photo or video as proof');
      return;
    }

    if (!verifyLocation()) {
      return;
    }

    Alert.alert(
      'Confirm Submission',
      'Are you sure you want to submit this work? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setSubmitting(true);

            try {
              // Validate each media with Gemini AI
              const validationPromises = capturedMedia.map((media) =>
                validateWithGemini(media.uri, media.location)
              );

              const validationResults = await Promise.all(validationPromises);

              // Check if any validation failed
              const failed = validationResults.find((result) => !result.success);
              if (failed) {
                Alert.alert(
                  'Validation Failed',
                  failed.message || 'The submitted media does not match the task requirements.',
                  [{ text: 'OK' }]
                );
                setSubmitting(false);
                return;
              }

              // Upload media and submit
              const formData = new FormData();
              formData.append('ticketId', task.ticket_id);
              formData.append('workerId', task.worker_id);
              formData.append('location', JSON.stringify(currentLocation));

              capturedMedia.forEach((media, index) => {
                formData.append('media', {
                  uri: media.uri,
                  type: media.type === 'image' ? 'image/jpeg' : 'video/mp4',
                  name: `proof_${index}.${media.type === 'image' ? 'jpg' : 'mp4'}`,
                });
              });

              const response = await fetch(`${BACKEND_URL}${API_ENDPOINTS.SUBMIT_WORK}`, {
                method: 'POST',
                body: formData,
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              });

              const result = await response.json();

              if (result.success) {
                Alert.alert('Success', 'Work submitted successfully!', [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                  },
                ]);
              } else {
                Alert.alert('Error', result.message || 'Failed to submit work');
              }
            } catch (error) {
              console.error('Error submitting work:', error);
              Alert.alert('Error', 'Failed to submit work. Please try again.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Task',
      'Are you sure you want to cancel this task? This will notify the admin.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${BACKEND_URL}${API_ENDPOINTS.CANCEL_TASK}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  ticketId: task.ticket_id,
                  workerId: task.worker_id,
                }),
              });

              const result = await response.json();

              if (result.success) {
                Alert.alert('Task Cancelled', 'The task has been cancelled.', [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                  },
                ]);
              } else {
                Alert.alert('Error', result.message || 'Failed to cancel task');
              }
            } catch (error) {
              console.error('Error cancelling task:', error);
              Alert.alert('Error', 'Failed to cancel task');
            }
          },
        },
      ]
    );
  };

  if (hasCameraPermission === null || hasPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.blue} />
      </View>
    );
  }

  if (hasCameraPermission === false || hasPermission === false) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.red} />
        <Text style={styles.errorText}>Camera and Location permissions are required</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermissions}>
          <Text style={styles.buttonText}>Grant Permissions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={Camera.Constants.Type.back}
          ratio="16:9"
        >
          <View style={styles.cameraOverlay}>
            <TouchableOpacity
              style={styles.closeCamera}
              onPress={() => setShowCamera(false)}
            >
              <Ionicons name="close" size={32} color={COLORS.secondary} />
            </TouchableOpacity>

            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={[styles.captureButton, isRecording && styles.recordingButton]}
                onPress={isRecording ? stopVideoRecording : capturePhoto}
              >
                {isRecording ? (
                  <View style={styles.recordingIndicator} />
                ) : (
                  <Ionicons name="camera" size={32} color={COLORS.secondary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.videoButton}
                onPress={isRecording ? stopVideoRecording : startVideoRecording}
                disabled={isRecording}
              >
                <Ionicons
                  name={isRecording ? 'stop-circle' : 'videocam'}
                  size={32}
                  color={isRecording ? COLORS.red : COLORS.secondary}
                />
              </TouchableOpacity>
            </View>

            {isRecording && (
              <View style={styles.recordingBadge}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>Recording...</Text>
              </View>
            )}
          </View>
        </Camera>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Details</Text>
      </View>

      {/* Task Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Task Information</Text>
        <View style={styles.taskIdRow}>
          <Text style={styles.ticketId}>#{task.ticket_id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: COLORS.blue }]}>
            <Text style={styles.statusText}>{task.status?.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.taskQuery}>{task.query}</Text>

        {task.department && (
          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={18} color={COLORS.blue} />
            <Text style={styles.infoText}>{task.department}</Text>
          </View>
        )}

        {task.location && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={COLORS.red} />
            <Text style={styles.infoText} numberOfLines={2}>
              {typeof task.location === 'string' ? task.location : 'Location provided'}
            </Text>
          </View>
        )}

        {task.deadline && (
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color={COLORS.warning} />
            <Text style={styles.infoText}>
              Deadline: {new Date(task.deadline).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      {/* Current Location */}
      {currentLocation && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Current Location</Text>
          <Text style={styles.locationText}>
            📍 {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
          </Text>
          <Text style={styles.locationHint}>
            Location is automatically captured with each photo/video
          </Text>
        </View>
      )}

      {/* Captured Media */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Work Proof ({capturedMedia.length})</Text>
        <Text style={styles.cardSubtitle}>
          Capture live photos and videos from the work location
        </Text>

        {capturedMedia.length > 0 && (
          <View style={styles.mediaGrid}>
            {capturedMedia.map((media, index) => (
              <View key={index} style={styles.mediaThumbnail}>
                <Image source={{ uri: media.uri }} style={styles.mediaImage} />
                <TouchableOpacity
                  style={styles.removeMediaButton}
                  onPress={() => removeMedia(index)}
                >
                  <Ionicons name="close-circle" size={24} color={COLORS.red} />
                </TouchableOpacity>
                <View style={styles.mediaTypeBadge}>
                  <Ionicons
                    name={media.type === 'image' ? 'image' : 'videocam'}
                    size={16}
                    color={COLORS.secondary}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.captureButton}
          onPress={() => setShowCamera(true)}
        >
          <Ionicons name="camera-outline" size={24} color={COLORS.secondary} />
          <Text style={styles.captureButtonText}>Open Camera</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={handleCancel}
          disabled={submitting}
        >
          <Ionicons name="close-circle-outline" size={24} color={COLORS.red} />
          <Text style={[styles.actionButtonText, { color: COLORS.red }]}>Cancel Task</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.submitButton]}
          onPress={handleSubmit}
          disabled={submitting || capturedMedia.length === 0}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.secondary} />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={24} color={COLORS.secondary} />
              <Text style={styles.actionButtonText}>Submit Work</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: COLORS.blue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  card: {
    backgroundColor: COLORS.surface,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  taskIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ticketId: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  taskQuery: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 16,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  locationText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 8,
  },
  locationHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  mediaThumbnail: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
  },
  mediaTypeBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 4,
    borderRadius: 6,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.blue,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  captureButtonText: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 2,
    borderColor: COLORS.red,
  },
  submitButton: {
    backgroundColor: COLORS.success,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  closeCamera: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    borderRadius: 24,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  recordingButton: {
    backgroundColor: COLORS.red,
  },
  videoButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
    borderRadius: 40,
  },
  recordingBadge: {
    position: 'absolute',
    top: 50,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    backgroundColor: COLORS.secondary,
    borderRadius: 6,
  },
  recordingText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  recordingIndicator: {
    width: 24,
    height: 24,
    backgroundColor: COLORS.secondary,
    borderRadius: 4,
  },
});

export default WorkerTaskDetailScreen;
