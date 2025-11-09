import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Polygon } from 'react-native-svg';

const SafetyRating = ({ onRatingChange, initialRating = 5 }) => {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);

  const handleRating = (value) => {
    setRating(value);
    if (onRatingChange) {
      onRatingChange(value);
    }
  };

  const getRatingColor = (value) => {
    if (value <= 3) return '#ef4444'; // Red - Dangerous
    if (value <= 5) return '#f59e0b'; // Orange - Unsafe
    if (value <= 7) return '#eab308'; // Yellow - Moderate
    if (value <= 9) return '#84cc16'; // Light green - Safe
    return '#10b981'; // Green - Very Safe
  };

  const getRatingText = (value) => {
    if (value <= 2) return 'Very Unsafe';
    if (value <= 4) return 'Unsafe';
    if (value <= 6) return 'Moderate';
    if (value <= 8) return 'Safe';
    return 'Very Safe';
  };

  const getRatingIcon = (value) => {
    if (value <= 3) {
      // Danger Icon
      return (
        <Svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            stroke={getRatingColor(value)}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    } else if (value <= 6) {
      // Warning Icon
      return (
        <Svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <Circle
            cx="12"
            cy="12"
            r="10"
            stroke={getRatingColor(value)}
            strokeWidth="2"
          />
          <Path
            d="M12 8v4m0 4h.01"
            stroke={getRatingColor(value)}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    } else {
      // Shield Icon
      return (
        <Svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
            stroke={getRatingColor(value)}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M9 12l2 2 4-4"
            stroke={getRatingColor(value)}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Safety Rating</Text>
      
      {/* Rating Icon & Score */}
      <View style={styles.ratingDisplay}>
        <View style={styles.iconContainer}>
          {getRatingIcon(rating)}
        </View>
        <View style={styles.scoreContainer}>
          <Text style={[styles.score, { color: getRatingColor(rating) }]}>
            {rating}/10
          </Text>
          <Text style={[styles.ratingText, { color: getRatingColor(rating) }]}>
            {getRatingText(rating)}
          </Text>
        </View>
      </View>

      {/* Rating Bar */}
      <View style={styles.ratingBar}>
        <View style={styles.barBackground}>
          <View
            style={[
              styles.barFill,
              {
                width: `${rating * 10}%`,
                backgroundColor: getRatingColor(rating),
              },
            ]}
          />
        </View>
      </View>

      {/* Rating Buttons */}
      <View style={styles.buttonsContainer}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.ratingButton,
              value <= rating && {
                backgroundColor: getRatingColor(value),
                borderColor: getRatingColor(value),
              },
            ]}
            onPress={() => handleRating(value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.buttonText,
                value <= rating && styles.buttonTextActive,
              ]}
            >
              {value}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Safety Description */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.descriptionTitle}>What does this mean?</Text>
        <Text style={styles.description}>
          {rating <= 3 && '⚠️ This area is very unsafe. Immediate attention required.'}
          {rating > 3 && rating <= 5 && '⚡ This area has safety concerns. Caution advised.'}
          {rating > 5 && rating <= 7 && '📍 This area is moderately safe but needs monitoring.'}
          {rating > 7 && rating <= 9 && '✅ This area is generally safe with minor issues.'}
          {rating > 9 && '🛡️ This area is very safe and well-maintained.'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    marginRight: 16,
  },
  scoreContainer: {
    flex: 1,
  },
  score: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  ratingBar: {
    marginBottom: 20,
  },
  barBackground: {
    height: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
    transition: 'width 0.3s ease',
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  ratingButton: {
    width: '18%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6b7280',
  },
  buttonTextActive: {
    color: '#ffffff',
  },
  descriptionContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});

export default SafetyRating;
