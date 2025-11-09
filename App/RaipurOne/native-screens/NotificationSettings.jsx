import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { COLORS } from '../constants/colors';

const NotificationSettings = ({ user, onBack }) => {
  const { pushToken, isRegistered, sendTestNotification, requestPermissions } = usePushNotifications(user);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    setNotificationsEnabled(isRegistered);
  }, [isRegistered]);

  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      // Request permissions
      const status = await requestPermissions();
      if (status === 'granted') {
        setNotificationsEnabled(true);
        Alert.alert('Success', 'Push notifications enabled!');
      } else {
        Alert.alert(
          'Permissions Required',
          'Please enable notifications in your device settings to receive alerts.'
        );
      }
    } else {
      setNotificationsEnabled(false);
      Alert.alert('Info', 'Push notifications disabled. You can re-enable them anytime.');
    }
  };

  const handleTestNotification = () => {
    sendTestNotification();
    Alert.alert('Test Sent', 'Check if you received the notification!');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Push Notifications Toggle */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications" size={24} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Push Notifications</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive alerts about emergency broadcasts, complaint updates, and task assignments
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: '#767577', true: COLORS.primary }}
              thumbColor={notificationsEnabled ? COLORS.surface : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Status Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={24} color={COLORS.info} />
            <Text style={styles.sectionTitle}>Status</Text>
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Registration Status:</Text>
              <View style={[styles.statusBadge, isRegistered ? styles.statusSuccess : styles.statusWarning]}>
                <Text style={styles.statusText}>
                  {isRegistered ? '✓ Registered' : '⚠ Not Registered'}
                </Text>
              </View>
            </View>

            {pushToken && (
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Push Token:</Text>
                <Text style={styles.tokenText} numberOfLines={1} ellipsizeMode="middle">
                  {pushToken}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Test Section */}
        {isRegistered && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flask" size={24} color={COLORS.warning} />
              <Text style={styles.sectionTitle}>Test Notifications</Text>
            </View>

            <TouchableOpacity style={styles.testButton} onPress={handleTestNotification}>
              <Ionicons name="send" size={20} color={COLORS.surface} />
              <Text style={styles.testButtonText}>Send Test Notification</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="help-circle" size={24} color={COLORS.textLight} />
            <Text style={styles.sectionTitle}>About Notifications</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              • 🚨 <Text style={styles.bold}>Emergency Alerts:</Text> Critical health and safety notifications
            </Text>
            <Text style={styles.infoText}>
              • 📝 <Text style={styles.bold}>Complaint Updates:</Text> Status changes on your submitted complaints
            </Text>
            <Text style={styles.infoText}>
              • 👷 <Text style={styles.bold}>Worker Tasks:</Text> New task assignments and completion reminders
            </Text>
            <Text style={styles.infoText}>
              • 💬 <Text style={styles.bold}>Chat Messages:</Text> Real-time messages from admins and workers
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.surface,
    marginLeft: 15,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 10,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 5,
  },
  settingDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  statusCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
  },
  statusRow: {
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 5,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 5,
  },
  statusSuccess: {
    backgroundColor: '#4CAF50',
  },
  statusWarning: {
    backgroundColor: '#FFC107',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.surface,
  },
  tokenText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: COLORS.textLight,
    backgroundColor: '#e0e0e0',
    padding: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warning,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 10,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
  },
  infoCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: 8,
  },
  bold: {
    fontWeight: '600',
  },
});

export default NotificationSettings;
