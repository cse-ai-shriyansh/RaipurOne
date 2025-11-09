import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../app/constants/colors';
import { BACKEND_URL, API_ENDPOINTS } from '../app/services/config';

const WorkerAuth = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Login form
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Registration form
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regWorkType, setRegWorkType] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState([]);

  const departments = [
    'WATER',
    'ROAD',
    'GARBAGE',
    'ELECTRICITY',
    'PARKS',
    'HEALTH',
    'SAFETY',
    'GENERAL',
  ];

  const toggleDepartment = (dept) => {
    if (selectedDepartments.includes(dept)) {
      setSelectedDepartments(selectedDepartments.filter((d) => d !== dept));
    } else {
      setSelectedDepartments([...selectedDepartments, dept]);
    }
  };

  const handleLogin = async () => {
    if (!loginPhone || !loginPassword) {
      Alert.alert('Error', 'Please enter phone number and password');
      return;
    }

    setLoading(true);
    try {
      const url = `${BACKEND_URL}${API_ENDPOINTS.WORKER_LOGIN}`;
      console.log('🔐 Attempting login to:', url);
      console.log('📱 Phone:', loginPhone);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: loginPhone, password: loginPassword }),
      });

      console.log('📡 Response status:', response.status);
      const result = await response.json();
      console.log('📦 Response data:', result);

      if (result.success) {
        // Store worker data
        await AsyncStorage.setItem('worker', JSON.stringify(result.data));
        onLoginSuccess(result.data);
      } else {
        Alert.alert('Login Failed', result.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Failed to login. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regName || !regPhone || !regPassword || !regAddress || !regWorkType) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (selectedDepartments.length === 0) {
      Alert.alert('Error', 'Please select at least one department');
      return;
    }

    setLoading(true);
    try {
      const url = `${BACKEND_URL}${API_ENDPOINTS.WORKER_REGISTER}`;
      const data = {
        name: regName,
        phone: regPhone,
        email: regEmail,
        password: regPassword,
        address: regAddress,
        work_type: regWorkType,
        departments: selectedDepartments,
      };
      
      console.log('📝 Attempting registration to:', url);
      console.log('📋 Registration data:', data);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('📡 Response status:', response.status);
      const result = await response.json();
      console.log('📦 Response data:', result);

      if (result.success) {
        Alert.alert('Success', 'Registration successful! Please login.', [
          { text: 'OK', onPress: () => setIsLogin(true) },
        ]);
        // Clear form
        setRegName('');
        setRegPhone('');
        setRegEmail('');
        setRegPassword('');
        setRegAddress('');
        setRegWorkType('');
        setSelectedDepartments([]);
      } else {
        Alert.alert('Registration Failed', result.message);
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Failed to register. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="construct" size={60} color={COLORS.primary} />
        <Text style={styles.headerTitle}>Worker Portal</Text>
        <Text style={styles.headerSubtitle}>Raipur Municipal Services</Text>
      </View>

      {/* Toggle Login/Register */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, isLogin && styles.toggleButtonActive]}
          onPress={() => setIsLogin(true)}
        >
          <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>
            Login
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, !isLogin && styles.toggleButtonActive]}
          onPress={() => setIsLogin(false)}
        >
          <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>
            Register
          </Text>
        </TouchableOpacity>
      </View>

      {isLogin ? (
        /* Login Form */
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="+91-9876543210"
                placeholderTextColor={COLORS.textLight}
                value={loginPhone}
                onChangeText={setLoginPhone}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor={COLORS.textLight}
                value={loginPassword}
                onChangeText={setLoginPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.secondary} />
            ) : (
              <Text style={styles.submitButtonText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        /* Registration Form */
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.textLight}
                value={regName}
                onChangeText={setRegName}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="+91-9876543210"
                placeholderTextColor={COLORS.textLight}
                value={regPhone}
                onChangeText={setRegPhone}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email (Optional)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="your.email@example.com"
                placeholderTextColor={COLORS.textLight}
                value={regEmail}
                onChangeText={setRegEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor={COLORS.textLight}
                value={regPassword}
                onChangeText={setRegPassword}
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="location" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Your full address"
                placeholderTextColor={COLORS.textLight}
                value={regAddress}
                onChangeText={setRegAddress}
                multiline
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Work Type *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="briefcase" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="e.g., Plumber, Electrician, Road Worker"
                placeholderTextColor={COLORS.textLight}
                value={regWorkType}
                onChangeText={setRegWorkType}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Departments * (Select at least one)</Text>
            <View style={styles.departmentsContainer}>
              {departments.map((dept) => (
                <TouchableOpacity
                  key={dept}
                  style={[
                    styles.departmentChip,
                    selectedDepartments.includes(dept) && styles.departmentChipSelected,
                  ]}
                  onPress={() => toggleDepartment(dept)}
                >
                  <Text
                    style={[
                      styles.departmentChipText,
                      selectedDepartments.includes(dept) && styles.departmentChipTextSelected,
                    ]}
                  >
                    {dept}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.secondary} />
            ) : (
              <Text style={styles.submitButtonText}>Register</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 16,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  toggleTextActive: {
    color: COLORS.secondary,
  },
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  departmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  departmentChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  departmentChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  departmentChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  departmentChipTextSelected: {
    color: COLORS.secondary,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
});

export default WorkerAuth;
