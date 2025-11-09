# Black & White UI Theme Implementation Guide

## Overview
Simple, minimalist black and white design matching the dashboard aesthetic for RaipurOne mobile app.

---

## Color Palette

### Grayscale Scale
```javascript
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
```

---

## Typography

### Font Weights
```javascript
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
```

### Font Sizes
```javascript
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
```

---

## Spacing System

```javascript
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
```

---

## Border Radius

```javascript
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
```

---

## Component Styles

### Button Styles
```javascript
const buttonStyles = StyleSheet.create({
  // Primary button (solid dark)
  primaryButton: {
    backgroundColor: COLORS.GRAY_900,
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.BASE,
    borderRadius: BORDER_RADIUS.MD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.BASE,
    fontWeight: FONT_WEIGHTS.SEMI_BOLD,
  },
  
  // Secondary button (outlined)
  secondaryButton: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.BASE,
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: COLORS.GRAY_900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: COLORS.GRAY_900,
    fontSize: FONT_SIZES.BASE,
    fontWeight: FONT_WEIGHTS.SEMI_BOLD,
  },
  
  // Ghost button (text only)
  ghostButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: SPACING.BASE,
    paddingVertical: SPACING.SM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButtonText: {
    color: COLORS.GRAY_700,
    fontSize: FONT_SIZES.BASE,
    fontWeight: FONT_WEIGHTS.MEDIUM,
  },
});
```

### Card Styles
```javascript
const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    padding: SPACING.BASE,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: SPACING.MD,
    paddingBottom: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  cardTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: FONT_WEIGHTS.BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  cardSubtitle: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.XS,
  },
});
```

### Input Styles
```javascript
const inputStyles = StyleSheet.create({
  inputContainer: {
    marginBottom: SPACING.BASE,
  },
  inputLabel: {
    fontSize: FONT_SIZES.SM,
    fontWeight: FONT_WEIGHTS.SEMI_BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  input: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: BORDER_RADIUS.MD,
    paddingHorizontal: SPACING.BASE,
    paddingVertical: SPACING.MD,
    fontSize: FONT_SIZES.BASE,
    color: COLORS.TEXT_PRIMARY,
  },
  inputFocused: {
    borderColor: COLORS.GRAY_900,
    borderWidth: 2,
  },
  inputError: {
    borderColor: COLORS.ERROR,
  },
  inputHelperText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.XS,
  },
  inputErrorText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.ERROR,
    marginTop: SPACING.XS,
  },
});
```

---

## Status Indicators

### Using Opacity for Status
```javascript
const statusStyles = StyleSheet.create({
  // Pending/Inactive
  statusInactive: {
    backgroundColor: COLORS.GRAY_300,
    color: COLORS.GRAY_700,
  },
  
  // In Progress/Active
  statusActive: {
    backgroundColor: COLORS.GRAY_900,
    color: COLORS.WHITE,
  },
  
  // Completed/Success
  statusSuccess: {
    backgroundColor: COLORS.GRAY_700,
    color: COLORS.WHITE,
  },
  
  // Error/Failed
  statusError: {
    backgroundColor: COLORS.GRAY_400,
    color: COLORS.GRAY_900,
    borderWidth: 1,
    borderColor: COLORS.GRAY_900,
  },
});
```

---

## Icons

### Icon Colors
```javascript
const iconColors = {
  primary: COLORS.GRAY_900,
  secondary: COLORS.GRAY_600,
  disabled: COLORS.GRAY_400,
  active: COLORS.BLACK,
  inactive: COLORS.GRAY_500,
};
```

---

## Layout Patterns

### Header
```javascript
const headerStyle = {
  backgroundColor: COLORS.WHITE,
  borderBottomWidth: 1,
  borderBottomColor: COLORS.BORDER,
  paddingHorizontal: SPACING.BASE,
  paddingVertical: SPACING.BASE,
  shadowColor: COLORS.BLACK,
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 1,
};
```

### List Item
```javascript
const listItemStyle = {
  backgroundColor: COLORS.WHITE,
  borderBottomWidth: 1,
  borderBottomColor: COLORS.BORDER_LIGHT,
  paddingHorizontal: SPACING.BASE,
  paddingVertical: SPACING.MD,
  flexDirection: 'row',
  alignItems: 'center',
};
```

### Section Header
```javascript
const sectionHeaderStyle = {
  backgroundColor: COLORS.BACKGROUND_SECONDARY,
  paddingHorizontal: SPACING.BASE,
  paddingVertical: SPACING.SM,
  borderBottomWidth: 1,
  borderBottomColor: COLORS.BORDER,
};
```

---

## Usage Examples

### Screen Template
```javascript
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../theme/theme';

const ExampleScreen = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Screen Title</Text>
      </View>
      
      {/* Content */}
      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Card Title</Text>
          <Text style={styles.cardText}>Card content goes here</Text>
        </View>
      </ScrollView>
      
      {/* Bottom Action */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Action</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    padding: SPACING.BASE,
  },
  headerTitle: {
    fontSize: FONT_SIZES.XL,
    fontWeight: FONT_WEIGHTS.BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
  },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    padding: SPACING.BASE,
    margin: SPACING.BASE,
  },
  cardTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: FONT_WEIGHTS.BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  cardText: {
    fontSize: FONT_SIZES.BASE,
    color: COLORS.TEXT_SECONDARY,
  },
  footer: {
    backgroundColor: COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    padding: SPACING.BASE,
  },
  button: {
    backgroundColor: COLORS.GRAY_900,
    padding: SPACING.BASE,
    borderRadius: BORDER_RADIUS.MD,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.BASE,
    fontWeight: FONT_WEIGHTS.SEMI_BOLD,
  },
});
```

---

## Best Practices

1. **Consistency**: Always use theme constants, never hardcode colors
2. **Hierarchy**: Use different gray shades to establish visual hierarchy
3. **Contrast**: Ensure sufficient contrast for accessibility (aim for WCAG AA)
4. **Whitespace**: Use generous spacing to create breathing room
5. **Typography**: Use font weights and sizes to create hierarchy without color
6. **Borders**: Use subtle borders (1px) to separate elements
7. **Shadows**: Use minimal shadows with low opacity for depth
8. **Icons**: Keep icons simple and use consistent sizing

---

## Migration Checklist

- [ ] Replace all color values with theme constants
- [ ] Update button styles to grayscale variants
- [ ] Convert colored status indicators to opacity-based system
- [ ] Update icon colors to grayscale
- [ ] Adjust text hierarchy using weights and sizes
- [ ] Test contrast ratios for accessibility
- [ ] Update screenshots and documentation
