import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Svg, { Path, Circle, Polyline } from 'react-native-svg';
import { COLORS } from '../constants/colors';
import { THEME } from '../constants/theme';
import { safetyService } from '../services/safetyService';
import { weatherService } from '../services/weatherService';

const SafetyIcon = ({ safe }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"
      stroke={safe ? COLORS.safe : COLORS.unsafe}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={safe ? COLORS.safe + '20' : COLORS.unsafe + '20'}
    />
  </Svg>
);

const WeatherIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 10H19C19.7956 10 20.5587 10.3161 21.1213 10.8787C21.6839 11.4413 22 12.2044 22 13C22 13.7956 21.6839 14.5587 21.1213 15.1213C20.5587 15.6839 19.7956 16 19 16H18M18 10C18 8.4087 17.3679 6.88258 16.2426 5.75736C15.1174 4.63214 13.5913 4 12 4C10.4087 4 8.88258 4.63214 7.75736 5.75736C6.63214 6.88258 6 8.4087 6 10M18 10C18 11.5913 17.3679 13.1174 16.2426 14.2426C15.1174 15.3679 13.5913 16 12 16H6M6 10H5C4.20435 10 3.44129 10.3161 2.87868 10.8787C2.31607 11.4413 2 12.2044 2 13C2 13.7956 2.31607 14.5587 2.87868 15.1213C3.44129 15.6839 4.20435 16 5 16H6M6 10C6 8.4087 6.63214 6.88258 7.75736 5.75736M6 16V18C6 18.5304 6.21071 19.0391 6.58579 19.4142C6.96086 19.7893 7.46957 20 8 20H16"
      stroke={COLORS.info}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const BulbIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <Path d="M9 18H15" stroke={COLORS.info} strokeWidth="2" strokeLinecap="round" />
    <Path d="M10 22H14" stroke={COLORS.info} strokeWidth="2" strokeLinecap="round" />
    <Path d="M12 2C8.686 2 6 4.686 6 8C6 10.1217 7.043 12.0783 8.75 13.25C9.496 13.771 10 14.61 10 15.518V16H14V15.518C14 14.61 14.504 13.771 15.25 13.25C16.957 12.0783 18 10.1217 18 8C18 4.686 15.314 2 12 2Z" stroke={COLORS.info} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CheckIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17L4 12" stroke={COLORS.safe} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const WarnIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <Path d="M10.29 3.86L1.82 18C1.39 18.74 1.94 19.67 2.79 19.67H21.21C22.06 19.67 22.61 18.74 22.18 18L13.71 3.86C13.32 3.18 12.39 3.18 12 3.86H12C11.61 3.18 10.68 3.18 10.29 3.86Z" stroke={COLORS.warning} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 9V13" stroke={COLORS.warning} strokeWidth="2" strokeLinecap="round" />
    <Circle cx="12" cy="17" r="1" fill={COLORS.warning} />
  </Svg>
);

const TempGraph = ({ data = [] }) => {
  const width = 300;
  const height = 100;
  if (!data || data.length === 0) return null;
  const temps = data.map((d) => d.tmax);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const pad = 10;
  const stepX = (width - pad * 2) / (temps.length - 1);
  const points = temps.map((t, i) => {
    const y = height - pad - ((t - min) / Math.max(max - min || 1, 1)) * (height - pad * 2);
    const x = pad + i * stepX;
    return { x, y };
  });
  const polyPoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  return (
    <Svg width={width} height={height}>
      <Polyline points={polyPoints} fill="none" stroke={COLORS.primary} strokeWidth="2" />
      {points.map((p, idx) => (
        <Circle key={idx} cx={p.x} cy={p.y} r="2.5" fill={COLORS.primary} />
      ))}
    </Svg>
  );
};

export default function TravelSaathiScreen({ onBack }) {
  const [activeTab, setActiveTab] = useState('safety'); // 'safety' | 'weather'
  const [searchQuery, setSearchQuery] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [past7Days, setPast7Days] = useState([]);
  const [next7Days, setNext7Days] = useState([]);
  const [aqiData, setAqiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [safetyData, setSafetyData] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [allAreas, setAllAreas] = useState([]);
  
  // Chhattisgarh Safety Check
  const [safetyPlace, setSafetyPlace] = useState('');
  const [safetyLoading, setSafetyLoading] = useState(false);
  const [safetyResult, setSafetyResult] = useState(null);

  // Load all areas on mount
  useEffect(() => {
    const areas = safetyService.getAllAreas();
    setAllAreas(areas);
  }, []);

  // Search location safety
  const searchLocationSafety = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Enter Location', 'Please enter a location name to search');
      return;
    }

    setLoading(true);
    const result = await safetyService.getSafetyRating(searchQuery);
    
    if (result.success) {
      setSafetyData(result);
    } else {
      Alert.alert('Error', 'Could not fetch safety data');
    }
    
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'weather') {
      fetchWeatherData();
    }
  }, [activeTab]);

  const fetchWeatherData = async () => {
    setLoading(true);
    const weather = await weatherService.getCurrentWeather('Raipur');
    const aqi = await weatherService.getAQI();
    const past = await weatherService.getPast7Days();
    const next = await weatherService.getNext7Days();

    if (weather.success) setWeatherData(weather.data);
    if (aqi.success) setAqiData(aqi.data);
    if (past.success) setPast7Days(past.data);
    if (next.success) setNext7Days(next.data);

    setLoading(false);
  };

  const getSafetyColor = (level) => {
    switch (level) {
      case 'safe': return COLORS.safe;
      case 'moderate': return COLORS.warning;
      case 'unsafe': return COLORS.unsafe;
      default: return COLORS.textLight;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Travel Saathi</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('safety')}
          style={[styles.tab, activeTab === 'safety' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'safety' && styles.activeTabText]}>
            Safety Check
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('weather')}
          style={[styles.tab, activeTab === 'weather' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'weather' && styles.activeTabText]}>
            AQI & Weather
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'safety' ? (
          <View>

            {/* Chhattisgarh Safety Check */}
            <View style={styles.chhattisgarhSafetyContainer}>
              <Text style={styles.cgSafetyTitle}>Check Safety in Chhattisgarh</Text>
              <View style={styles.cgSafetyRow}>
                <TextInput
                  value={safetyPlace}
                  onChangeText={setSafetyPlace}
                  placeholder="Enter place name (e.g., Raipur - Nayapara)"
                  style={styles.cgSafetyInput}
                  placeholderTextColor={COLORS.textLight}
                />
                <TouchableOpacity
                  style={styles.cgSafetyButton}
                  onPress={async () => {
                    if (!safetyPlace.trim()) {
                      Alert.alert('Error', 'Please enter a place name');
                      return;
                    }
                    try {
                      setSafetyLoading(true);
                      const { complaintService } = require('../services/complaintService');
                      const res = await complaintService.checkSafety(safetyPlace.trim());
                      setSafetyLoading(false);
                      if (res.success && res.data) {
                        setSafetyResult(res.data);
                      } else {
                        Alert.alert('Info', 'Safety check unavailable at the moment');
                        setSafetyResult({
                          safe: true,
                          message: 'Safety information unavailable',
                          rating: 3
                        });
                      }
                    } catch (error) {
                      console.error('Safety check error:', error);
                      setSafetyLoading(false);
                      Alert.alert('Info', 'Safety check service is temporarily unavailable');
                      setSafetyResult({
                        safe: true,
                        message: 'Safety check unavailable',
                        rating: 3
                      });
                    }
                  }}
                  disabled={safetyLoading}
                >
                  <Text style={styles.cgSafetyButtonText}>
                    {safetyLoading ? 'Checking...' : 'Check'}
                  </Text>
                </TouchableOpacity>
              </View>

              {safetyResult && (
                <View style={styles.cgSafetyResultBox}>
                  <Text style={styles.cgSafetySummary}>
                    {safetyResult.summary || 'No summary available'}
                  </Text>
                  {Array.isArray(safetyResult.recent_incidents) && safetyResult.recent_incidents.length > 0 && (
                    <View style={styles.cgIncidentsList}>
                      <Text style={styles.cgIncidentsTitle}>Recent Incidents:</Text>
                      {safetyResult.recent_incidents.slice(0, 3).map((inc, idx) => (
                        <Text key={idx} style={styles.cgIncidentText}>
                          • {inc.title} ({inc.date || 'date unknown'}) — {inc.source}
                        </Text>
                      ))}
                    </View>
                  )}
                  {Array.isArray(safetyResult.sources) && safetyResult.sources.length > 0 && (
                    <Text style={styles.cgSourcesText}>
                      Sources: {safetyResult.sources.slice(0, 3).join(', ')}
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Safety Result */}
            {safetyData && (
              <View style={styles.safetyResultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultLocation}>{safetyData.location}</Text>
                  <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(safetyData.category) + '20' }]}>
                    <Text style={[styles.categoryText, { color: getCategoryColor(safetyData.category) }]}>
                      {safetyData.category.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Safety Score */}
                <View style={styles.scoreBox}>
                  <Text style={styles.scoreTitle}>Safety Score</Text>
                  <Text style={styles.scoreBig}>{safetyData.safetyScore.toFixed(1)}/10</Text>
                  <Text style={styles.scoreSubtext}>
                    Crime Rate: {safetyData.crimeRate} per 100k | {safetyData.incidents} incidents
                  </Text>
                </View>

                {/* Time-based Ratings */}
                <View style={styles.timeRatingsSection}>
                  <Text style={styles.sectionTitle}>Safety by Time of Day</Text>
                  {Object.entries(safetyData.timeRatings).map(([time, data]) => (
                    <View key={time} style={styles.timeRatingRow}>
                      <Text style={styles.timeRatingLabel}>{capitalizeFirst(time)}</Text>
                      <View style={styles.ratingBar}>
                        <View 
                          style={[
                            styles.ratingFill, 
                            { 
                              width: `${data.rating * 10}%`,
                              backgroundColor: data.color 
                            }
                          ]} 
                        />
                      </View>
                      <Text style={[styles.ratingValue, { color: data.color }]}>
                        {data.rating}/10 - {data.label}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Crime Types */}
                <View style={styles.crimeTypesSection}>
                  <Text style={styles.sectionTitle}>Crime Distribution</Text>
                  {safetyData.crimeTypes.map((crime, idx) => (
                    <View key={idx} style={styles.crimeTypeRow}>
                      <Text style={styles.crimeTypeName}>{crime.type}</Text>
                      <View style={styles.percentageBar}>
                        <View style={[styles.percentageFill, { width: `${crime.percentage}%` }]} />
                      </View>
                      <Text style={styles.percentageText}>{crime.percentage}%</Text>
                    </View>
                  ))}
                </View>

                {/* Recommendation */}
                <View style={styles.recommendationBox}>
                  <Text style={styles.recommendationText}>{safetyData.recommendation}</Text>
                </View>

                {/* Safety Tips */}
                <View style={styles.tipsSection}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: THEME.spacing.sm }}>
                    <BulbIcon />
                    <Text style={[styles.sectionTitle, { marginLeft: THEME.spacing.sm }]}>Safety Tips</Text>
                  </View>
                  {safetyData.safetyTips.map((tip, idx) => (
                    <Text key={idx} style={styles.tipText}>{tip}</Text>
                  ))}
                </View>
              </View>
            )}

            {/* All Areas List */}
            {!safetyData && allAreas.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>Popular Areas in Raipur</Text>
                {allAreas.map((area, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={styles.areaCard}
                    onPress={() => {
                      setSearchQuery(area.name);
                      searchLocationSafety();
                    }}
                  >
                    <View style={styles.areaHeader}>
                      <Text style={styles.areaName}>{area.name}</Text>
                      <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(area.category) + '20' }]}>
                        <Text style={[styles.categoryText, { color: getCategoryColor(area.category) }]}>
                          {area.category.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.areaStats}>
                      <Text style={styles.areaStatText}>
                        Safety Score: <Text style={styles.areaStatBold}>{area.safetyScore.toFixed(1)}/10</Text>
                      </Text>
                      <Text style={styles.areaStatText}>
                        Incidents: <Text style={styles.areaStatBold}>{area.incidents}</Text>
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Emergency Contacts */}
            <View style={styles.emergencySection}>
              <Text style={styles.sectionTitle}>Emergency Contacts</Text>
              {safetyService.getEmergencyContacts().map((contact, idx) => (
                <View key={idx} style={styles.emergencyRow}>
                  <Text style={styles.emergencyIcon}>{contact.icon}</Text>
                  <View style={styles.emergencyInfo}>
                    <Text style={styles.emergencyName}>{contact.name}</Text>
                    <Text style={styles.emergencyNumber}>{contact.number}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View>
            {loading ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
            ) : (
              <>
                {/* Weather Card */}
                <View style={styles.weatherCard}>
                  <View style={styles.weatherHeader}>
                    <WeatherIcon />
                    <Text style={styles.weatherTitle}>Current Weather - Raipur</Text>
                  </View>
                  
                  {weatherData ? (
                    <>
                      <View style={styles.tempContainer}>
                        <Text style={styles.tempValue}>{weatherData.temp}°C</Text>
                        <Text style={styles.tempDesc}>{weatherData.description}</Text>
                      </View>
                      <View style={styles.weatherStats}>
                        <View style={styles.weatherStat}>
                          <Text style={styles.statLabel}>Feels Like</Text>
                          <Text style={styles.statValue}>{weatherData.feelsLike}°C</Text>
                        </View>
                        <View style={styles.weatherStat}>
                          <Text style={styles.statLabel}>Humidity</Text>
                          <Text style={styles.statValue}>{weatherData.humidity}%</Text>
                        </View>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.noData}>Weather data unavailable</Text>
                  )}
                </View>

                {/* Past 7 Days */}
                <View style={styles.sectionBlock}>
                  <Text style={styles.cardTitle}>Past 7 Days</Text>
                  {past7Days.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {past7Days.map((d) => (
                        <View key={d.date} style={styles.dayCard}>
                          <Text style={styles.dayLabel}>{formatDay(d.date)}</Text>
                          <Text style={styles.dayTemp}>{Math.round(d.tmax)}° / {Math.round(d.tmin)}°</Text>
                          <View style={styles.precipBarBg}>
                            <View style={[styles.precipBarFill, { width: `${Math.min(d.precipitation * 10, 100)}%` }]} />
                          </View>
                          <Text style={styles.precipLabel}>{d.precipitation?.toFixed(1)} mm</Text>
                        </View>
                      ))}
                    </ScrollView>
                  ) : (
                    <Text style={styles.noData}>No historical data</Text>
                  )}
                </View>

                {/* Next 7 days */}
                <View style={styles.sectionBlock}>
                  <Text style={styles.cardTitle}>Next 7 Days</Text>
                  {next7Days.length > 0 ? (
                    <View style={{ alignItems: 'center', marginBottom: THEME.spacing.md }}>
                      <TempGraph data={next7Days} />
                    </View>
                  ) : null}
                  {next7Days.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {next7Days.map((d) => (
                        <View key={d.date} style={styles.dayCardAlt}>
                          <Text style={styles.dayLabel}>{formatDay(d.date)}</Text>
                          <Text style={styles.dayTemp}>{Math.round(d.tmax)}° / {Math.round(d.tmin)}°</Text>
                          <View style={styles.precipBarBgAlt}>
                            <View style={[styles.precipBarFillAlt, { width: `${Math.min(d.precipitation * 10, 100)}%` }]} />
                          </View>
                          <Text style={styles.precipLabelAlt}>{d.precipitation?.toFixed(1)} mm</Text>
                        </View>
                      ))}
                    </ScrollView>
                  ) : (
                    <Text style={styles.noData}>No forecast data</Text>
                  )}
                </View>

                {/* AQI Card */}
                <View style={styles.aqiCard}>
                  <Text style={styles.cardTitle}>Air Quality Index</Text>
                  
                  {aqiData ? (
                    <>
                      <View style={styles.aqiValueContainer}>
                        <Text style={styles.aqiValue}>{aqiData.value}</Text>
                        <Text style={[styles.aqiLabel, { color: getSafetyColor(aqiData.value <= 2 ? 'safe' : 'moderate') }]}>
                          {aqiData.label}
                        </Text>
                      </View>
                      <Text style={styles.aqiDesc}>
                        Based on PM2.5, PM10, NO2, SO2, CO, and O3 levels
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.noData}>AQI data unavailable</Text>
                  )}
                </View>

                {/* Travel Recommendation */}
                <View style={styles.recommendationCard}>
                  <Text style={styles.recommendationTitle}>Travel Recommendation</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {aqiData && weatherData ? (
                      aqiData.value <= 2 && weatherData.temp < 35 ? (
                        <CheckIcon />
                      ) : (
                        <WarnIcon />
                      )
                    ) : null}
                    <Text style={[styles.recommendationText, { marginLeft: THEME.spacing.sm }]}>
                      {aqiData && weatherData 
                        ? aqiData.value <= 2 && weatherData.temp < 35
                          ? 'Great conditions for outdoor activities!'
                          : aqiData.value > 3
                          ? 'Air quality moderate. Limit outdoor exposure.'
                          : 'Hot weather. Stay hydrated and avoid peak hours.'
                        : 'Weather data loading...'}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// Helper functions
const formatDay = (isoDate) => {
  const d = new Date(isoDate);
  return d.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit' });
};
const getCategoryColor = (category) => {
  switch (category) {
    case 'safe': return COLORS.safe;
    case 'moderate': return COLORS.warning;
    case 'risky': return COLORS.unsafe;
    default: return COLORS.textSecondary;
  }
};

const getSafetyColor = (safety) => {
  if (safety === 'safe') return COLORS.safe;
  if (safety === 'moderate') return COLORS.warning;
  return COLORS.unsafe;
};

const capitalizeFirst = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    paddingTop: THEME.spacing.xl,
  },
  backButton: {
    padding: THEME.spacing.sm,
  },
  backText: {
    color: COLORS.surface,
    fontSize: THEME.fontSize.md,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: '700',
    color: COLORS.surface,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: THEME.spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: THEME.fontSize.md,
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: THEME.spacing.md,
  },
  searchContainer: {
    marginBottom: THEME.spacing.md,
  },
  searchInput: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    fontSize: THEME.fontSize.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  placeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    ...THEME.shadow.sm,
  },
  placeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.md,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: THEME.fontSize.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: THEME.spacing.xs,
  },
  safetyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  safetyText: {
    fontSize: THEME.fontSize.sm,
    fontWeight: '600',
    marginLeft: THEME.spacing.xs,
  },
  scoreContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.md,
  },
  scoreValue: {
    fontSize: THEME.fontSize.xl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  scoreLabel: {
    fontSize: THEME.fontSize.xs,
    color: COLORS.textSecondary,
  },
  timeRatings: {
    marginBottom: THEME.spacing.md,
  },
  sectionLabel: {
    fontSize: THEME.fontSize.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: THEME.spacing.sm,
  },
  timeSlots: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  timeSlot: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: THEME.fontSize.xs,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  timeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statText: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.textSecondary,
  },
  weatherCard: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    ...THEME.shadow.sm,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  weatherTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginLeft: THEME.spacing.sm,
  },
  tempContainer: {
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  tempValue: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.primary,
  },
  tempDesc: {
    fontSize: THEME.fontSize.md,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  weatherStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weatherStat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.textLight,
  },
  statValue: {
    fontSize: THEME.fontSize.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  aqiCard: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    ...THEME.shadow.sm,
  },
  sectionBlock: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    ...THEME.shadow.sm,
  },
  cardTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: THEME.spacing.md,
  },
  dayCard: {
    width: 120,
    backgroundColor: COLORS.background,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginRight: THEME.spacing.md,
  },
  dayCardAlt: {
    width: 120,
    backgroundColor: COLORS.background,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginRight: THEME.spacing.md,
  },
  dayLabel: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  dayTemp: {
    fontSize: THEME.fontSize.lg,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginBottom: 8,
  },
  precipBarBg: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  precipBarFill: {
    height: '100%',
    backgroundColor: COLORS.textSecondary,
  },
  precipLabel: {
    fontSize: THEME.fontSize.xs,
    color: COLORS.textLight,
  },
  precipBarBgAlt: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  precipBarFillAlt: {
    height: '100%',
    backgroundColor: COLORS.textSecondary,
  },
  precipLabelAlt: {
    fontSize: THEME.fontSize.xs,
    color: COLORS.textLight,
  },
  aqiValueContainer: {
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  aqiValue: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  aqiLabel: {
    fontSize: THEME.fontSize.lg,
    fontWeight: '600',
  },
  aqiDesc: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  recommendationCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    ...THEME.shadow.sm,
  },
  recommendationTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: '600',
    color: COLORS.surface,
    marginBottom: THEME.spacing.sm,
  },
  recommendationText: {
    fontSize: THEME.fontSize.md,
    color: COLORS.surface,
    lineHeight: 20,
  },
  noData: {
    fontSize: THEME.fontSize.md,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: THEME.spacing.lg,
  },
  // New Safety Checker Styles
  searchButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    marginLeft: THEME.spacing.sm,
  },
  searchButtonText: {
    color: COLORS.surface,
    fontWeight: '600',
    fontSize: THEME.fontSize.md,
  },
  safetyResultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    ...THEME.shadow.md,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  resultLocation: {
    fontSize: THEME.fontSize.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.round,
  },
  categoryText: {
    fontSize: THEME.fontSize.sm,
    fontWeight: '700',
  },
  scoreBox: {
    backgroundColor: COLORS.primaryLight + '20',
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.lg,
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  scoreTitle: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: THEME.spacing.xs,
  },
  scoreBig: {
    fontSize: 56,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: THEME.spacing.xs,
  },
  scoreSubtext: {
    fontSize: THEME.fontSize.xs,
    color: COLORS.textLight,
  },
  timeRatingsSection: {
    marginBottom: THEME.spacing.lg,
  },
  sectionTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: THEME.spacing.md,
    marginTop: THEME.spacing.md,
  },
  timeRatingRow: {
    marginBottom: THEME.spacing.md,
  },
  timeRatingLabel: {
    fontSize: THEME.fontSize.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: THEME.spacing.xs,
  },
  ratingBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: THEME.borderRadius.sm,
    overflow: 'hidden',
    marginBottom: THEME.spacing.xs,
  },
  ratingFill: {
    height: '100%',
  },
  ratingValue: {
    fontSize: THEME.fontSize.sm,
    fontWeight: '600',
  },
  crimeTypesSection: {
    marginBottom: THEME.spacing.lg,
  },
  crimeTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  crimeTypeName: {
    flex: 1,
    fontSize: THEME.fontSize.sm,
    color: COLORS.textSecondary,
  },
  percentageBar: {
    flex: 2,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: THEME.borderRadius.sm,
    overflow: 'hidden',
    marginHorizontal: THEME.spacing.sm,
  },
  percentageFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  percentageText: {
    width: 45,
    fontSize: THEME.fontSize.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'right',
  },
  recommendationBox: {
    backgroundColor: COLORS.info + '10',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.sm,
    marginBottom: THEME.spacing.lg,
  },
  tipsSection: {
    marginTop: THEME.spacing.md,
  },
  tipText: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: THEME.spacing.sm,
    paddingLeft: THEME.spacing.sm,
  },
  areaCard: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    ...THEME.shadow.sm,
  },
  areaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  areaName: {
    fontSize: THEME.fontSize.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  areaStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  areaStatText: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.textLight,
  },
  areaStatBold: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emergencySection: {
    backgroundColor: COLORS.error + '10',
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.xl,
  },
  emergencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
  },
  emergencyIcon: {
    fontSize: 32,
    marginRight: THEME.spacing.md,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyName: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.textSecondary,
  },
  emergencyNumber: {
    fontSize: THEME.fontSize.lg,
    fontWeight: '700',
    color: COLORS.error,
  },
  // Chhattisgarh Safety Check Styles
  chhattisgarhSafetyContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    ...THEME.shadow.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  cgSafetyTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: THEME.spacing.md,
  },
  cgSafetyRow: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
  },
  cgSafetyInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    fontSize: THEME.fontSize.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.textPrimary,
  },
  cgSafetyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.sm,
    justifyContent: 'center',
  },
  cgSafetyButtonText: {
    color: COLORS.surface,
    fontSize: THEME.fontSize.md,
    fontWeight: '600',
  },
  cgSafetyResultBox: {
    backgroundColor: COLORS.background,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cgSafetySummary: {
    fontSize: THEME.fontSize.md,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginBottom: THEME.spacing.md,
  },
  cgIncidentsList: {
    marginVertical: THEME.spacing.md,
  },
  cgIncidentsTitle: {
    fontSize: THEME.fontSize.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: THEME.spacing.sm,
  },
  cgIncidentText: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: THEME.spacing.xs,
    lineHeight: 20,
  },
  cgSourcesText: {
    fontSize: THEME.fontSize.xs,
    color: COLORS.textLight,
    fontStyle: 'italic',
    marginTop: THEME.spacing.sm,
  },
});