import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/colors';

export default function Splash({ onSplashComplete = () => {} }) {
  useEffect(() => {
    const t = setTimeout(() => onSplashComplete(), 2500);
    return () => clearTimeout(t);
  }, [onSplashComplete]);

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/images/Splash_Img/R1.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>RaipurOne</Text>
      <Text style={styles.message}>We team VEDASTACK welcome you</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },
});
