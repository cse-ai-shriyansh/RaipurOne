import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import SafetyRating from '../Components/SafetyRating';
import { uploadMultipleImages } from '../services/imageUploadService';
import { BACKEND_URL, API_ENDPOINTS } from '../services/config';

const ComplaintSubmission = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Garbage');
  const [safetyRating, setSafetyRating] = useState(5);
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  const categories = [
    { name: 'Garbage', icon: 'trash', color: '#4CAF50' },
    { name: 'Sanitation', icon: 'water', color: '#2196F3' },
    { name: 'Street Light', icon: 'bulb', color: '#FFC107' },
    { name: 'Road', icon: 'construct', color: '#9E9E9E' },
    { name: 'Other', icon: 'help-circle', color: '#757575' },
  ];

  // Request permissions
  React.useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera roll permission is required');
      }

      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required');
      } else {
        getCurrentLocation();
      }
    })();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        address: 'Fetching address...',
      });

      // Reverse geocode
      const [address] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (address) {
        setLocation((prev) => ({
          ...prev,
          address: `${address.street || ''}, ${address.city || ''}, ${address.region || ''}`,
        }));
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsMultipleSelection: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        setImages([...images, ...result.assets.map((asset) => asset.uri)]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        setImages([...images, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (images.length === 0) {
      Alert.alert('Error', 'Please add at least one image');
      return;
    }

    setLoading(true);

    try {
      // Convert image URIs to Base64
      const imageBase64Array = await Promise.all(
        images.map(async (uri) => {
          try {
            const base64 = await FileSystem.readAsStringAsync(uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            return base64;
          } catch (error) {
            console.error('Error converting image to Base64:', error);
            return null;
          }
        })
      );

      // Filter out failed conversions
      const validBase64Images = imageBase64Array.filter((b64) => b64 !== null);

      if (validBase64Images.length === 0) {
        throw new Error('Failed to process images');
      }

      // Upload images to Supabase
      const uploadResults = await uploadMultipleImages(validBase64Images, 'complaint-images', 'user-submissions');

      const successfulUploads = uploadResults.filter((r) => r.success);

      if (successfulUploads.length === 0) {
        throw new Error('Failed to upload images');
      }

      // Create complaint data
      const complaintData = {
        title,
        description,
        category,
        safetyRating,
        images: successfulUploads.map((r) => r.url),
        imagePaths: successfulUploads.map((r) => r.path),
        location: location
          ? {
              latitude: location.latitude,
              longitude: location.longitude,
              address: location.address,
            }
          : null,
        timestamp: new Date().toISOString(),
        status: 'pending',
        priority: safetyRating <= 3 ? 'high' : safetyRating <= 6 ? 'medium' : 'low',
      };

      // Submit to backend
      const response = await fetch(`${BACKEND_URL}${API_ENDPOINTS.CREATE_TICKET}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(complaintData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error:', errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        Alert.alert(
          'Success',
          'Your complaint has been submitted successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setTitle('');
                setDescription('');
                setImages([]);
                setSafetyRating(5);
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        throw new Error(result.message || 'Failed to submit complaint');
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
      Alert.alert(
        'Error', 
        error.message || 'Failed to submit complaint. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Complaint</Text>
      </View>

      {/* Category Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Category *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.name}
              style={[
                styles.categoryCard,
                category === cat.name && { borderColor: cat.color, backgroundColor: `${cat.color}15` },
              ]}
              onPress={() => setCategory(cat.name)}
            >
              <Ionicons
                name={cat.icon}
                size={28}
                color={category === cat.name ? cat.color : '#6b7280'}
              />
              <Text
                style={[
                  styles.categoryText,
                  category === cat.name && { color: cat.color, fontWeight: '700' },
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Title */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="Brief description of the issue"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Provide detailed information about the complaint..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          maxLength={500}
        />
        <Text style={styles.charCount}>{description.length}/500</Text>
      </View>

      {/* Safety Rating */}
      <SafetyRating onRatingChange={setSafetyRating} initialRating={safetyRating} />

      {/* Image Upload */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photos * ({images.length}/5)</Text>
        <View style={styles.imageGrid}>
          {images.map((uri, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeImage(index)}
              >
                <Ionicons name="close-circle" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
          {images.length < 5 && (
            <>
              <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                <Ionicons name="images" size={32} color="#6b7280" />
                <Text style={styles.addImageText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addImageButton} onPress={takePhoto}>
                <Ionicons name="camera" size={32} color="#6b7280" />
                <Text style={styles.addImageText}>Camera</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Location */}
      {location && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.locationCard}>
            <Ionicons name="location" size={24} color="#3b82f6" />
            <Text style={styles.locationText}>{location.address}</Text>
          </View>
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
            <Text style={styles.submitButtonText}>Submit Complaint</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  categoryScroll: {
    marginHorizontal: -8,
  },
  categoryCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    minWidth: 100,
  },
  categoryText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1f2937',
  },
  textArea: {
    height: 140,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 8,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageContainer: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  addImageButton: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    fontWeight: '600',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    marginLeft: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    margin: 16,
    padding: 18,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});

export default ComplaintSubmission;
