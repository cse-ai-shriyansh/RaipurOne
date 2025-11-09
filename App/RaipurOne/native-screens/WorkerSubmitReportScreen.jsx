import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Camera } from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Video } from 'expo-av';
import axios from 'axios';
import { API_URL, SUPABASE_URL, SUPABASE_ANON_KEY } from '../app/services/config';

export default function WorkerSubmitReportScreen({ route, navigation }) {
  const { task } = route.params;
  const [hasPermission, setHasPermission] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [videoUri, setVideoUri] = useState(null);
  const [documentUri, setDocumentUri] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const cameraRef = useRef(null);

  // Request camera permission
  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Start recording video
  const startRecording = async () => {
    if (cameraRef.current) {
      try {
        setIsRecording(true);
        const video = await cameraRef.current.recordAsync({
          quality: Camera.Constants.VideoQuality['720p'],
          maxDuration: 120, // 2 minutes max
        });
        setVideoUri(video.uri);
        setIsRecording(false);
      } catch (error) {
        console.error('Recording failed:', error);
        setIsRecording(false);
        Alert.alert('Error', 'Failed to record video');
      }
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  };

  // Retake video
  const retakeVideo = () => {
    setVideoUri(null);
  };

  // Pick document (PDF or image)
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        setDocumentUri(result.uri);
        setDocumentName(result.name);
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  // Upload file to Supabase Storage
  const uploadToSupabase = async (uri, folder, filename) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${folder}/${filename}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: Buffer.from(base64, 'base64'),
      });

      if (!response.ok) throw new Error('Upload failed');

      return `${SUPABASE_URL}/storage/v1/object/public/${folder}/${filename}`;
    } catch (error) {
      throw error;
    }
  };

  // Submit report
  const submitReport = async () => {
    if (!videoUri) {
      Alert.alert('Error', 'Please record a video first');
      return;
    }

    Alert.alert(
      'Confirm Submission',
      'Are you sure you want to submit this report? It will be sent to admin for review.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            try {
              setUploading(true);

              // Upload video
              const videoFilename = `task_${task.id}_${Date.now()}.mp4`;
              const videoUrl = await uploadToSupabase(videoUri, 'task-videos', videoFilename);

              // Upload document if exists
              let documentUrl = null;
              if (documentUri) {
                const docExtension = documentName.split('.').pop();
                const docFilename = `task_${task.id}_${Date.now()}.${docExtension}`;
                documentUrl = await uploadToSupabase(documentUri, 'task-documents', docFilename);
              }

              // Submit to backend
              const response = await axios.post(
                `${API_URL}/workers/tasks/${task.id}/submit`,
                {
                  video_url: videoUrl,
                  document_url: documentUrl,
                  submission_notes: submissionNotes,
                  worker_id: task.worker_id,
                }
              );

              setUploading(false);

              if (response.data.success) {
                Alert.alert(
                  'Success',
                  'Report submitted successfully! Waiting for admin approval.',
                  [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
              }
            } catch (error) {
              setUploading(false);
              console.error('Submission error:', error);
              Alert.alert('Error', 'Failed to submit report. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (hasPermission === null) {
    return <View className="flex-1 bg-black items-center justify-center"><Text className="text-white">Requesting camera permission...</Text></View>;
  }

  if (hasPermission === false) {
    return (
      <View className="flex-1 bg-black items-center justify-center p-4">
        <Text className="text-white text-center text-lg mb-4">Camera permission is required to record completion video</Text>
        <TouchableOpacity
          className="bg-blue-500 px-6 py-3 rounded-lg"
          onPress={() => Camera.requestCameraPermissionsAsync()}
        >
          <Text className="text-white font-bold">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-black">
      {/* Header */}
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="text-xl font-bold">Submit Work Report</Text>
        <Text className="text-gray-600 mt-1">{task.task_description}</Text>
      </View>

      {/* Video Recording Section */}
      {!videoUri ? (
        <View className="h-96 bg-black">
          <Camera
            ref={cameraRef}
            style={{ flex: 1 }}
            type={Camera.Constants.Type.back}
            ratio="16:9"
          />
          
          {/* Recording Controls */}
          <View className="absolute bottom-0 left-0 right-0 p-6 flex-row justify-center items-center">
            {!isRecording ? (
              <TouchableOpacity
                className="w-20 h-20 rounded-full bg-red-500 items-center justify-center border-4 border-white"
                onPress={startRecording}
              >
                <View className="w-16 h-16 rounded-full bg-red-600" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="w-20 h-20 rounded-full bg-red-500 items-center justify-center border-4 border-white"
                onPress={stopRecording}
              >
                <View className="w-8 h-8 bg-white" />
              </TouchableOpacity>
            )}
          </View>

          {isRecording && (
            <View className="absolute top-4 left-4 bg-red-500 px-3 py-1 rounded-full flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-white mr-2 animate-pulse" />
              <Text className="text-white font-bold">Recording...</Text>
            </View>
          )}
        </View>
      ) : (
        <View className="h-96 bg-black">
          <Video
            source={{ uri: videoUri }}
            style={{ flex: 1 }}
            useNativeControls
            resizeMode="contain"
            isLooping
          />
          <TouchableOpacity
            className="absolute top-4 right-4 bg-blue-500 px-4 py-2 rounded-lg"
            onPress={retakeVideo}
          >
            <Text className="text-white font-bold">Retake Video</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Document Upload Section */}
      <View className="bg-white p-4 m-4 rounded-lg">
        <Text className="text-lg font-bold mb-2">📄 Authorization Document</Text>
        <Text className="text-gray-600 mb-4">Upload completion certificate, authorization, or related document</Text>
        
        {!documentUri ? (
          <TouchableOpacity
            className="bg-gray-100 border-2 border-dashed border-gray-300 p-6 rounded-lg items-center"
            onPress={pickDocument}
          >
            <Text className="text-gray-600 text-center">📎 Tap to upload PDF or Image</Text>
          </TouchableOpacity>
        ) : (
          <View className="bg-green-50 border border-green-200 p-4 rounded-lg flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-green-700 font-bold">✓ Document Selected</Text>
              <Text className="text-gray-600 text-sm mt-1">{documentName}</Text>
            </View>
            <TouchableOpacity
              className="bg-red-500 px-4 py-2 rounded-lg"
              onPress={() => {
                setDocumentUri(null);
                setDocumentName('');
              }}
            >
              <Text className="text-white font-bold">Remove</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Notes Section */}
      <View className="bg-white p-4 m-4 rounded-lg">
        <Text className="text-lg font-bold mb-2">📝 Notes (Optional)</Text>
        <input
          className="border border-gray-300 rounded-lg p-3 text-base"
          placeholder="Add any additional notes about the work completed..."
          value={submissionNotes}
          onChange={(e) => setSubmissionNotes(e.target.value)}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Submit Button */}
      <View className="p-4">
        <TouchableOpacity
          className={`${videoUri && !uploading ? 'bg-green-500' : 'bg-gray-400'} py-4 rounded-lg items-center`}
          onPress={submitReport}
          disabled={!videoUri || uploading}
        >
          {uploading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">
              ✓ Submit Report for Review
            </Text>
          )}
        </TouchableOpacity>

        <Text className="text-gray-500 text-center mt-4 text-sm">
          Your submission will be reviewed by admin before marking as complete
        </Text>
      </View>
    </ScrollView>
  );
}
