import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    SafeAreaView,
    Platform,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { COLORS } from '../constants/colors';
import { THEME } from '../constants/theme';

const { width } = Dimensions.get('window');

// SVG Icons
const ComplaintIcon = () => (
  <Svg width="40" height="40" viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
      stroke={COLORS.accent}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const TravelIcon = () => (
  <Svg width="40" height="40" viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
      stroke={COLORS.info}
      strokeWidth="2"
    />
    <Path
      d="M2 12H22M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z"
      stroke={COLORS.info}
      strokeWidth="2"
    />
  </Svg>
);

const ProfileIcon = () => (
  <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke={COLORS.primary} strokeWidth="2" />
    <Path
      d="M6 21C6 17.134 8.686 14 12 14C15.314 14 18 17.134 18 21"
      stroke={COLORS.primary}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

const TruckIcon = () => (
  <Svg width="40" height="40" viewBox="0 0 24 24" fill="none">
    <Path
      d="M16 3H1V16H16V3Z"
      stroke={COLORS.success}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 8H20L23 11V16H16V8Z"
      stroke={COLORS.success}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="5.5" cy="19.5" r="2.5" stroke={COLORS.success} strokeWidth="2" />
    <Circle cx="18.5" cy="19.5" r="2.5" stroke={COLORS.success} strokeWidth="2" />
  </Svg>
);

export default function HomeScreen({ user, onLogout, onNavigate }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    { id: 1, title: 'Smart City Services', subtitle: 'Municipal services at your fingertips', bgColor: '#D1FAE5' },
    { id: 2, title: 'Kachra Gadi Tracking', subtitle: 'Track garbage trucks in real-time', bgColor: '#FEF3C7' },
    { id: 3, title: 'Report Issues', subtitle: 'Help keep Raipur clean & safe', bgColor: '#DBEAFE' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      id: 'complaint',
      title: 'Complaint Box',
      description: 'Report civic issues & track status',
      icon: <ComplaintIcon />,
      bgColor: '#FFF5F0',
      borderColor: COLORS.accent,
    },
    {
      id: 'kachragadi',
      title: 'Kachra Gadi',
      description: 'Track garbage trucks & schedule pickup',
      icon: <TruckIcon />,
      bgColor: '#D1FAE5',
      borderColor: COLORS.success,
    },
    {
      id: 'travel',
      title: 'Travel Saathi',
      description: 'Safety, Weather & AQI insights',
      icon: <TravelIcon />,
      bgColor: '#F0F7FF',
      borderColor: COLORS.info,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../../assets/images/Splash_Img/Logo_white.png')} style={styles.logoImage} resizeMode="contain" />
          <Text style={styles.headerTitle}>RaipurOne</Text>
        </View>
        
        <TouchableOpacity 
          onPress={() => onNavigate('profile')}
          style={styles.profileButton}
          activeOpacity={0.7}
        >
          <ProfileIcon />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Slideshow Banner */}
        <View style={{ backgroundColor: slides[currentSlide].bgColor, padding: 20, alignItems: 'center', justifyContent: 'center', height: 120, marginBottom: 12, borderRadius: 12, marginHorizontal: 16, marginTop: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 }}>{slides[currentSlide].title}</Text>
          <Text style={{ fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' }}>{slides[currentSlide].subtitle}</Text>
          <View style={{ flexDirection: 'row', marginTop: 10 }}>
            {slides.map((_, idx) => (
              <View key={idx} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: idx === currentSlide ? COLORS.primary : COLORS.border, marginHorizontal: 3 }} />
            ))}
          </View>
        </View>

        {/* Greeting */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>नमस्ते</Text>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Feature Cards */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Services</Text>
          
          {features.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={[
                styles.featureCard,
                { 
                  backgroundColor: feature.bgColor,
                  borderLeftColor: feature.borderColor,
                },
              ]}
              onPress={() => onNavigate(feature.id)}
              activeOpacity={0.8}
            >
              <View style={styles.featureIcon}>{feature.icon}</View>
              
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>

              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M9 18L15 12L9 6"
                  stroke={COLORS.textLight}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Smart City Initiative</Text>
          <Text style={styles.infoText}>
            RaipurOne brings municipal services to your fingertips. Report issues, stay safe while traveling, and engage with your city like never before.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    ...THEME.shadow.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 42,
    height: 42,
    marginRight: THEME.spacing.sm,
  },
  headerTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: '700',
    color: COLORS.surface,
  },
  profileButton: {
    padding: THEME.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: THEME.borderRadius.round,
  },
  content: {
    flex: 1,
  },
  greetingContainer: {
    padding: THEME.spacing.lg,
    backgroundColor: COLORS.surface,
    marginBottom: THEME.spacing.md,
  },
  greetingText: {
    fontSize: THEME.fontSize.xl,
    marginBottom: THEME.spacing.xs,
  },
  userName: {
    fontSize: THEME.fontSize.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: THEME.spacing.xs,
  },
  userEmail: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.textSecondary,
  },
  featuresSection: {
    padding: THEME.spacing.lg,
  },
  sectionTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: THEME.spacing.md,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.lg,
    marginBottom: THEME.spacing.md,
    borderLeftWidth: 4,
    ...THEME.shadow.sm,
  },
  featureIcon: {
    marginRight: THEME.spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: THEME.spacing.xs,
  },
  featureDescription: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.textSecondary,
  },
  infoCard: {
    margin: THEME.spacing.lg,
    padding: THEME.spacing.lg,
    backgroundColor: COLORS.primaryLight,
    borderRadius: THEME.borderRadius.lg,
  },
  infoTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: '600',
    color: COLORS.surface,
    marginBottom: THEME.spacing.sm,
  },
  infoText: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.surface,
    opacity: 0.9,
    lineHeight: 20,
  },
});