// Black & White Theme System for RaipurOne
// Simple, minimalist grayscale design matching dashboard

export const COLORS = {
  // Pure colors
  BLACK: '#000000',
  WHITE: '#FFFFFF',
  
  // Gray scale (900 = darkest, 50 = lightest)
  GRAY_900: '#1f2937',  // Text primary, headers
  GRAY_800: '#374151',  // Text secondary
  GRAY_700: '#4b5563',  // Text tertiary
  GRAY_600: '#6b7280',  // Text muted, icons
  GRAY_500: '#9ca3af',  // Borders, dividers
  GRAY_400: '#d1d5db',  // Borders light
  GRAY_300: '#e5e7eb',  // Backgrounds light
  GRAY_200: '#f3f4f6',  // Backgrounds lighter
  GRAY_100: '#f9fafb',  // Backgrounds lightest
  GRAY_50: '#fafafa',   // Almost white backgrounds
  
  // Semantic colors (still grayscale)
  PRIMARY: '#1f2937',   // Main actions (dark gray)
  SECONDARY: '#6b7280', // Secondary elements
  SUCCESS: '#4b5563',   // Success states
  ERROR: '#374151',     // Error states
  WARNING: '#4b5563',   // Warning states
  INFO: '#6b7280',      // Info states
  
  // Backgrounds
  BACKGROUND: '#FFFFFF',
  BACKGROUND_SECONDARY: '#f9fafb',
  SURFACE: '#FFFFFF',
  
  // Text
  TEXT_PRIMARY: '#1f2937',
  TEXT_SECONDARY: '#6b7280',
  TEXT_DISABLED: '#9ca3af',
  
  // Borders
  BORDER: '#e5e7eb',
  BORDER_LIGHT: '#f3f4f6',
  BORDER_DARK: '#d1d5db',
  
  // Shadows (black with opacity)
  SHADOW_LIGHT: 'rgba(0, 0, 0, 0.05)',
  SHADOW_MEDIUM: 'rgba(0, 0, 0, 0.1)',
  SHADOW_HEAVY: 'rgba(0, 0, 0, 0.15)',
};

export const FONT_WEIGHTS = {
  THIN: '100',
  EXTRA_LIGHT: '200',
  LIGHT: '300',
  REGULAR: '400',
  MEDIUM: '500',
  SEMI_BOLD: '600',
  BOLD: '700',
  EXTRA_BOLD: '800',
  BLACK: '900',
};

export const FONT_SIZES = {
  XXS: 10,
  XS: 12,
  SM: 14,
  BASE: 16,
  LG: 18,
  XL: 20,
  XXL: 24,
  XXXL: 32,
  HUGE: 48,
};

export const SPACING = {
  XXS: 2,
  XS: 4,
  SM: 8,
  MD: 12,
  BASE: 16,
  LG: 20,
  XL: 24,
  XXL: 32,
  XXXL: 48,
  HUGE: 64,
};

export const BORDER_RADIUS = {
  NONE: 0,
  SM: 4,
  BASE: 8,
  MD: 12,
  LG: 16,
  XL: 20,
  XXL: 24,
  FULL: 9999,
};

// Icon colors for different states
export const ICON_COLORS = {
  PRIMARY: COLORS.GRAY_900,
  SECONDARY: COLORS.GRAY_600,
  DISABLED: COLORS.GRAY_400,
  ACTIVE: COLORS.BLACK,
  INACTIVE: COLORS.GRAY_500,
};

// Common shadow styles
export const SHADOWS = {
  SMALL: {
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  MEDIUM: {
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  LARGE: {
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};

// Export everything as default theme
export default {
  COLORS,
  FONT_WEIGHTS,
  FONT_SIZES,
  SPACING,
  BORDER_RADIUS,
  ICON_COLORS,
  SHADOWS,
};
