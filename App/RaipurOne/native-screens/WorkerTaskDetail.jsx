import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { COLORS } from '../app/constants/colors';
import { BACKEND_URL, API_ENDPOINTS } from '../app/services/config';

const WorkerTaskDetail = ({ task, workerId, onBack, onTaskCompleted, onSubmitReport }) => {
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionImages, setCompletionImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);

  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to take photos.');
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        quality: 0.7,
        allowsEditing: true,
        aspect: [4, 3],
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setCompletionImages([...completionImages, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const removeCompletionImage = (index) => {
    const newImages = completionImages.filter((_, i) => i !== index);
    setCompletionImages(newImages);
  };

  const handleCompleteTask = async () => {
    if (!completionNotes.trim()) {
      Alert.alert('Required', 'Please add completion notes');
      return;
    }

    if (completionImages.length === 0) {
      Alert.alert('Required', 'Please take at least one photo of the completed work');
      return;
    }

    Alert.alert(
      'Complete Task',
      'Are you sure you want to mark this task as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            setLoading(true);
            try {
              // Upload completion images (simplified - implement proper upload)
              const imageUrls = completionImages; // In production, upload to storage

              const response = await fetch(`${BACKEND_URL}${API_ENDPOINTS.WORKER_COMPLETE}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  ticket_id: task.ticket_id,
                  worker_id: workerId,
                  completion_notes: completionNotes,
                  completion_images: imageUrls,
                }),
              });

              const result = await response.json();

              if (result.success) {
                Alert.alert('Success', 'Task marked as completed!', [
                  { text: 'OK', onPress: () => onTaskCompleted() },
                ]);
              } else {
                Alert.alert('Error', result.message || 'Failed to complete task');
              }
            } catch (error) {
              console.error('Error completing task:', error);
              Alert.alert('Error', 'Failed to complete task');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Task Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.taskId}>#{task.ticket_id}</Text>
            <View style={[styles.statusBadge, getStatusStyle(task.status)]}>
              <Text style={styles.statusText}>{task.status.toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.query}>{task.query}</Text>

          {task.location && (
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color={COLORS.accent} />
              <Text style={styles.infoText}>{task.location}</Text>
            </View>
          )}

          {task.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color={COLORS.accent} />
              <Text style={styles.infoText}>{task.phone}</Text>
            </View>
          )}

          {task.deadline && (
            <View style={styles.infoRow}>
              <Ionicons name="time" size={20} color={COLORS.error} />
              <Text style={styles.infoText}>
                Deadline: {new Date(task.deadline).toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {/* Original Images */}
        {task.images && task.images.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Complaint Images</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
              {task.images.map((img, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setViewingImage(img)}
                  style={styles.imageContainer}
                >
                  <Image source={{ uri: img }} style={styles.image} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Completion Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Complete Task</Text>

          {/* NEW: Submit Report Button */}
          <TouchableOpacity
            style={styles.submitReportButton}
            onPress={() => onSubmitReport && onSubmitReport(task)}
          >
            <Ionicons name="videocam" size={24} color="#fff" />
            <Text style={styles.submitReportText}>📹 Submit Report with Video & Documents</Text>
          </TouchableOpacity>

          <Text style={styles.orDivider}>━━━━━━━ OR ━━━━━━━</Text>

          <Text style={styles.label}>Completion Notes *</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe the work done..."
            placeholderTextColor={COLORS.textLight}
            value={completionNotes}
            onChangeText={setCompletionNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Completion Photos *</Text>
          <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
            <Ionicons name="camera" size={24} color={COLORS.secondary} />
            <Text style={styles.cameraButtonText}>Take Photo</Text>
          </TouchableOpacity>

          {completionImages.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
              {completionImages.map((img, index) => (
                <View key={index} style={styles.completionImageContainer}>
                  <Image source={{ uri: img }} style={styles.image} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeCompletionImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity
            style={[styles.completeButton, loading && styles.completeButtonDisabled]}
            onPress={handleCompleteTask}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.secondary} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.secondary} />
                <Text style={styles.completeButtonText}>Mark as Completed</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Full Screen Image Viewer */}
      {viewingImage && (
        <View style={styles.fullScreenImage}>
          <TouchableOpacity
            style={styles.closeImageButton}
            onPress={() => setViewingImage(null)}
          >
            <Ionicons name="close" size={32} color={COLORS.secondary} />
          </TouchableOpacity>
          <Image
            source={{ uri: viewingImage }}
            style={styles.fullImage}
            resizeMode="contain"
          />
        </View>
      )}
    </View>
  );
};

const getStatusStyle = (status) => {
  switch (status) {
    case 'assigned':
      return { backgroundColor: COLORS.accent };
    case 'in-progress':
      return { backgroundColor: '#FFA500' };
    case 'completed':
      return { backgroundColor: '#4CAF50' };
    default:
      return { backgroundColor: COLORS.textSecondary };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.surface,
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
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
  query: {
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 24,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  imageScroll: {
    marginTop: 8,
  },
  imageContainer: {
    marginRight: 12,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
    marginTop: 16,
  },
  textArea: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 100,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  cameraButtonText: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  completionImageContainer: {
    marginRight: 12,
    position: 'relative',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 24,
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  completeButtonText: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  submitReportText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orDivider: {
    textAlign: 'center',
    color: COLORS.textLight,
    marginVertical: 16,
    fontSize: 14,
  },
  fullScreenImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeImageButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 8,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});

export default WorkerTaskDetail;
