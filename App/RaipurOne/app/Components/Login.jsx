import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/colors';
import { CREDENTIALS } from '../constants/userRoles';

export default function Login({ onLogin = () => {}, onModeSwitch = () => {}, currentMode = 'user' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
   
    const userCred = CREDENTIALS.user;
    const workerCred = CREDENTIALS.worker;
    if (email === userCred.email && password === userCred.password) {
      onLogin({ email, role: userCred.role, name: 'Citizen User' });
      return;
    }
    if (email === workerCred.email && password === workerCred.password) {
      onLogin({ email, role: workerCred.role, name: 'Municipal Worker' });
      return;
    }
    Alert.alert('Login Failed', 'Invalid credentials. Try:\nUser: user@raipurone.in / user123\nWorker: worker@raipurone.in / worker123');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        <Image source={require('../../assets/images/Splash_Img/R1.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>RaipurOne</Text>
        <Text style={styles.subtitle}>नगर पालिका सेवा</Text>

        {/* Mode Switcher */}
        <View style={styles.modeSwitch}>
          <TouchableOpacity
            style={[styles.modeButton, currentMode === 'user' && styles.modeButtonActive]}
            onPress={() => onModeSwitch('user')}
          >
            <Text style={[styles.modeButtonText, currentMode === 'user' && styles.modeButtonTextActive]}>
              Citizen
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, currentMode === 'worker' && styles.modeButtonActive]}
            onPress={() => onModeSwitch('worker')}
          >
            <Text style={[styles.modeButtonText, currentMode === 'worker' && styles.modeButtonTextActive]}>
              Worker
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign in</Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#6B7280"
            style={styles.input}
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            placeholderTextColor="#6B7280"
            style={styles.input}
          />

          <TouchableOpacity onPress={handleSubmit} style={styles.button} activeOpacity={0.85}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>

          
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  logo: { width: 84, height: 84, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary },
  subtitle: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 18 },
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
    width: '100%',
    maxWidth: 300,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modeButtonTextActive: {
    color: COLORS.secondary,
  },
  card: { width: '100%', maxWidth: 420, backgroundColor: COLORS.surface, padding: 18, borderRadius: 12, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12, textAlign: 'center' },
  input: { height: 44, borderColor: '#E5E7EB', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 12, backgroundColor: '#FFFFFF', color: COLORS.textPrimary },
  button: { height: 44, backgroundColor: COLORS.primary, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  buttonText: { color: COLORS.surface, fontWeight: '700' },
  testBox: { marginTop: 12, padding: 10, backgroundColor: '#F3F4F6', borderRadius: 8 },
  testTitle: { fontWeight: '700', fontSize: 12, color: COLORS.textPrimary, marginBottom: 4 },
  testText: { fontSize: 12, color: COLORS.textSecondary },
});

