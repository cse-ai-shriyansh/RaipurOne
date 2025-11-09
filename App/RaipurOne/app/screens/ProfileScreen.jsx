import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/colors';
import userService from '../services/userService';

export default function ProfileScreen({ user, onBack, onLogout }) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (email) loadProfile();
  }, [email]);

  const loadProfile = async () => {
    setLoading(true);
    const profile = await userService.getProfileByEmail(email);
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
    }
    setLoading(false);
  };

  const saveProfile = async () => {
    if (!email) return Alert.alert('Email required', 'Please provide email (login first)');
    setLoading(true);
    const payload = { email, name, phone, address };
    const res = await userService.upsertProfile(payload);
    setLoading(false);
    if (res.success) {
      Alert.alert('Saved ✓', 'Profile saved to Supabase');
    } else {
      const errorMessage = res.message || 'Could not save profile. See console for details';
      Alert.alert('Database Error', errorMessage);
      console.error('Save profile error:', res.error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 14, paddingTop: 40 }}>
        <TouchableOpacity onPress={onBack} style={{ padding: 8 }}>
          <Text style={{ color: COLORS.surface, fontSize: 16, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.surface, marginLeft: 12 }}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 }}>Email</Text>
        <TextInput value={email} onChangeText={setEmail} editable={!email} placeholder="Email" style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 10, marginBottom: 12, backgroundColor: '#fff' }} />

        <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 }}>Name</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Full name" style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 10, marginBottom: 12, backgroundColor: '#fff' }} />

        <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 }}>Phone</Text>
        <TextInput value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 10, marginBottom: 12, backgroundColor: '#fff' }} />

        <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 }}>Address</Text>
        <TextInput value={address} onChangeText={setAddress} placeholder="Address" multiline numberOfLines={2} style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 10, marginBottom: 16, backgroundColor: '#fff' }} />

        <TouchableOpacity onPress={saveProfile} style={{ backgroundColor: COLORS.primary, padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: COLORS.surface, fontWeight: '700' }}>Save Profile</Text>
        </TouchableOpacity>

        {onLogout && (
          <TouchableOpacity onPress={onLogout} style={{ backgroundColor: COLORS.error, padding: 12, borderRadius: 8, alignItems: 'center' }}>
            <Text style={{ color: 'white', fontWeight: '700' }}>Logout</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

