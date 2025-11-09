import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';

const WhatsAppChatBox = ({ onSendMessage, messages, onClose }) => {
  const [inputText, setInputText] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      quality: 0.8,
      maxResults: 5,
      base64: true,
    });

    if (!result.canceled) {
      setSelectedImages([...selectedImages, ...result.assets]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
      base64: true,
    });

    if (!result.canceled) {
      setSelectedImages([...selectedImages, result.assets[0]]);
    }
  };

  const handleSend = () => {
    if (inputText.trim() || selectedImages.length > 0) {
      onSendMessage({
        text: inputText.trim(),
        images: selectedImages,
        timestamp: new Date().toISOString(),
        type: 'user',
      });
      setInputText('');
      setSelectedImages([]);
    }
  };

  const removeImage = (index) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const renderMessage = ({ item, index }) => {
    const isUser = item.type === 'user';
    const isBot = item.type === 'bot';

    return (
      <Animated.View
        style={[
          styles.messageBubble,
          isUser && styles.userBubble,
          isBot && styles.botBubble,
          { opacity: fadeAnim },
        ]}
      >
        {/* Message Images */}
        {item.images && item.images.length > 0 && (
          <View style={styles.imagesContainer}>
            {item.images.map((img, idx) => (
              <Image
                key={idx}
                source={{ uri: img.uri }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            ))}
          </View>
        )}

        {/* Message Text */}
        {item.text && (
          <Text style={[styles.messageText, isUser && styles.userText, isBot && styles.botText]}>
            {item.text}
          </Text>
        )}

        {/* Timestamp */}
        <View style={styles.timestampContainer}>
          <Text style={[styles.timestamp, isUser && styles.userTimestamp]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {isUser && (
            <Ionicons
              name={item.status === 'sent' ? 'checkmark' : 'checkmark-done'}
              size={16}
              color={item.status === 'read' ? '#4FC3F7' : '#FFFFFF'}
              style={styles.checkmark}
            />
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header - WhatsApp Style */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="business" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.onlineIndicator} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Raipur Municipal</Text>
            <Text style={styles.headerSubtitle}>
              {isTyping ? 'typing...' : 'Online'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="call" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => `msg-${index}`}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Selected Images Preview */}
      {selectedImages.length > 0 && (
        <View style={styles.selectedImagesContainer}>
          <FlatList
            horizontal
            data={selectedImages}
            renderItem={({ item, index }) => (
              <View style={styles.selectedImageWrapper}>
                <Image source={{ uri: item.uri }} style={styles.selectedImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#FF5252" />
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(item, index) => `img-${index}`}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      {/* Input Area - WhatsApp Style */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
          <Ionicons name="add-circle" size={28} color="#075E54" />
        </TouchableOpacity>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#999999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <View style={styles.inputActions}>
            <TouchableOpacity onPress={takePhoto} style={styles.inputActionButton}>
              <Ionicons name="camera" size={22} color="#075E54" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.sendButton, (inputText.trim() || selectedImages.length > 0) && styles.sendButtonActive]}
          onPress={handleSend}
          disabled={!inputText.trim() && selectedImages.length === 0}
        >
          <Ionicons
            name={inputText.trim() || selectedImages.length > 0 ? 'send' : 'mic'}
            size={22}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECE5DD', // WhatsApp background color
  },
  header: {
    height: 60,
    backgroundColor: '#075E54', // WhatsApp green
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  backButton: {
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#128C7E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4FC3F7',
    borderWidth: 2,
    borderColor: '#075E54',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  headerAction: {
    padding: 8,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    marginBottom: 12,
    borderRadius: 8,
    padding: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6', // WhatsApp user bubble color
    borderBottomRightRadius: 2,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 2,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  messageImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#000000',
  },
  botText: {
    color: '#000000',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#666666',
  },
  userTimestamp: {
    color: '#666666',
  },
  checkmark: {
    marginLeft: 4,
  },
  selectedImagesContainer: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  selectedImageWrapper: {
    position: 'relative',
    marginRight: 8,
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#F0F0F0',
  },
  attachButton: {
    padding: 6,
    marginRight: 4,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    maxHeight: 120,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
    maxHeight: 100,
  },
  inputActions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  inputActionButton: {
    padding: 4,
    marginLeft: 4,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#999999',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonActive: {
    backgroundColor: '#075E54', // WhatsApp green
  },
});

export default WhatsAppChatBox;
