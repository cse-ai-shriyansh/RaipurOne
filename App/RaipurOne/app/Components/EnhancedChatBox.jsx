import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Audio, Video } from 'expo-av';
import { COLORS } from '../constants/colors';

const { width } = Dimensions.get('window');

const EnhancedChatBox = ({ messages = [], onSendMessage, isLoading = false }) => {
  const [inputText, setInputText] = useState('');
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(null);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: audioStatus } = await Audio.requestPermissionsAsync();
    
    if (cameraStatus !== 'granted' || audioStatus !== 'granted') {
      Alert.alert('Permissions Required', 'Camera and microphone permissions are needed');
      return false;
    }
    return true;
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        quality: 0.7,
        allowsEditing: true,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        onSendMessage({
          type: 'image',
          uri: result.assets[0].uri,
          text: '',
        });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleRecordVideo = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'videos',
        quality: 0.7,
        videoMaxDuration: 30, // 30 seconds max
      });

      if (!result.canceled && result.assets[0]) {
        onSendMessage({
          type: 'video',
          uri: result.assets[0].uri,
          text: '',
        });
      }
    } catch (error) {
      console.error('Error recording video:', error);
      Alert.alert('Error', 'Failed to record video');
    }
  };

  const startRecording = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        onSendMessage({
          type: 'audio',
          uri: uri,
          text: '',
        });
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const handlePlayAudio = async (audioUri, messageId) => {
    try {
      // Stop current playing audio if any
      if (playingAudio) {
        await playingAudio.stopAsync();
        await playingAudio.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
      setPlayingAudio(sound);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingAudio(null);
        }
      });

      await sound.playAsync();
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const handleSendText = () => {
    if (inputText.trim()) {
      onSendMessage({
        type: 'text',
        text: inputText.trim(),
        uri: null,
      });
      setInputText('');
    }
  };

  const renderMessage = (message, index) => {
    const isUser = message.sender === 'user';
    const isBot = message.sender === 'bot';

    return (
      <View
        key={index}
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.botBubble,
        ]}
      >
        {/* Text Message */}
        {message.type === 'text' && (
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {message.text}
          </Text>
        )}

        {/* Image Message */}
        {message.type === 'image' && (
          <View>
            {message.text && (
              <Text style={[styles.messageText, isUser && styles.userMessageText, styles.captionText]}>
                {message.text}
              </Text>
            )}
            <Image
              source={{ uri: message.uri }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Video Message */}
        {message.type === 'video' && (
          <View>
            {message.text && (
              <Text style={[styles.messageText, isUser && styles.userMessageText, styles.captionText]}>
                {message.text}
              </Text>
            )}
            <Video
              source={{ uri: message.uri }}
              style={styles.messageVideo}
              useNativeControls
              resizeMode="contain"
              shouldPlay={false}
            />
          </View>
        )}

        {/* Audio Message */}
        {message.type === 'audio' && (
          <TouchableOpacity
            style={styles.audioContainer}
            onPress={() => handlePlayAudio(message.uri, index)}
          >
            <Ionicons
              name={playingAudio ? 'pause-circle' : 'play-circle'}
              size={32}
              color={isUser ? COLORS.secondary : COLORS.accent}
            />
            <View style={styles.audioWaveform}>
              <View style={styles.audioWave} />
              <View style={styles.audioWave} />
              <View style={styles.audioWave} />
              <View style={styles.audioWave} />
              <View style={styles.audioWave} />
            </View>
            <Text style={[styles.audioDuration, isUser && styles.userMessageText]}>
              0:{message.duration || '15'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Timestamp */}
        <Text style={[styles.timestamp, isUser && styles.userTimestamp]}>
          {message.time || new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>

        {/* Read status for user messages */}
        {isUser && (
          <Ionicons
            name={message.read ? 'checkmark-done' : 'checkmark'}
            size={16}
            color={message.read ? '#4FC3F7' : '#FFFFFF'}
            style={styles.readStatus}
          />
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={scrollToBottom}
      >
        {messages.map((message, index) => renderMessage(message, index))}
        
        {isLoading && (
          <View style={[styles.messageBubble, styles.botBubble]}>
            <ActivityIndicator color={COLORS.accent} />
            <Text style={[styles.messageText, styles.typingText]}>Typing...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        {/* Media Buttons */}
        <View style={styles.mediaButtonsRow}>
          <TouchableOpacity style={styles.mediaButton} onPress={handleTakePhoto}>
            <Ionicons name="camera" size={24} color={COLORS.accent} />
            <Text style={styles.mediaButtonText}>Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mediaButton} onPress={handleRecordVideo}>
            <Ionicons name="videocam" size={24} color={COLORS.accent} />
            <Text style={styles.mediaButtonText}>Video</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mediaButton, isRecording && styles.recordingButton]}
            onPressIn={startRecording}
            onPressOut={stopRecording}
          >
            <Ionicons
              name={isRecording ? 'stop-circle' : 'mic'}
              size={24}
              color={isRecording ? COLORS.error : COLORS.accent}
            />
            <Text style={styles.mediaButtonText}>
              {isRecording ? 'Recording...' : 'Audio'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Text Input */}
        <View style={styles.textInputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.textLight}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSendText}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color={COLORS.secondary} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECE5DD',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    maxWidth: width * 0.75,
    marginVertical: 4,
    padding: 12,
    borderRadius: 12,
    position: 'relative',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
    borderTopRightRadius: 4,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.secondary,
    borderTopLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#000000',
  },
  captionText: {
    marginBottom: 8,
  },
  messageImage: {
    width: width * 0.6,
    height: 200,
    borderRadius: 8,
    marginTop: 4,
  },
  messageVideo: {
    width: width * 0.6,
    height: 200,
    borderRadius: 8,
    marginTop: 4,
    backgroundColor: '#000',
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  audioWaveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 24,
  },
  audioWave: {
    flex: 1,
    height: '60%',
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  audioDuration: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  timestamp: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: '#000000',
    opacity: 0.6,
  },
  readStatus: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  typingText: {
    fontStyle: 'italic',
    marginLeft: 8,
  },
  inputContainer: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mediaButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    paddingVertical: 8,
  },
  mediaButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    minWidth: 80,
  },
  recordingButton: {
    backgroundColor: COLORS.error + '20',
  },
  mediaButtonText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  textInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.secondary,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendButton: {
    backgroundColor: COLORS.accent,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.textLight,
    opacity: 0.5,
  },
});

export default EnhancedChatBox;
