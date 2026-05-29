/**
 * Global application constants.
 *
 * This file stores reusable static values used across the app.
 * Keeping constants here helps avoid duplicated strings and magic numbers.
 */

/**
 * Default user ID for academic/demo purposes.
 *
 * In a real app, this value should come from Firebase Authentication.
 */
/**
 * Vehicle categories available in the ride request flow.
 */
export const VEHICLE_CATEGORIES = [
  {
    id: 'economy',
    label: 'Economy',
    description: 'Affordable rides for everyday trips.',
    baseFare: 3500,
    pricePerKilometer: 1200,
    pricePerMinute: 180,
    multiplier: 1,
  },
  {
    id: 'xl',
    label: 'XL',
    description: 'Larger vehicles for groups or extra space.',
    baseFare: 5000,
    pricePerKilometer: 1600,
    pricePerMinute: 220,
    multiplier: 1.35,
  },
  {
    id: 'premium',
    label: 'Premium',
    description: 'High-comfort rides with premium vehicles.',
    baseFare: 8000,
    pricePerKilometer: 2300,
    pricePerMinute: 320,
    multiplier: 1.8,
  },
];

/**
 * Gender dropdown options.
 */
export const GENDER_OPTIONS = [
  {
    label: 'Male',
    value: 'male',
  },
  {
    label: 'Female',
    value: 'female',
  },
  {
    label: 'Other',
    value: 'other',
  },
  {
    label: 'Prefer not to say',
    value: 'prefer_not_to_say',
  },
];

/**
 * Language dropdown options.
 */
export const LANGUAGE_OPTIONS = [
  {
    label: 'Español',
    value: 'es',
  },
  {
    label: 'English',
    value: 'en',
  },
];

/**
 * Payment provider options.
 */
export const PAYMENT_PROVIDERS = [
  {
    id: 'mercado_pago',
    label: 'Mercado Pago',
    description: 'Pay using Mercado Pago checkout.',
  },
];

/**
 * Default map region.
 *
 * Medellín is used as a practical default location for development.
 */
export const DEFAULT_MAP_REGION = {
  latitude: 6.2442,
  longitude: -75.5812,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

/**
 * Default driver location used for real-time tracking simulation.
 */
export const DEFAULT_DRIVER_LOCATION = {
  latitude: 6.2518,
  longitude: -75.5636,
};

/**
 * Basic app colors.
 *
 * These values are used by screens and reusable components.
 */
export const COLORS = {
  primary: '#111111',
  secondary: '#2F80ED',
  background: '#F5F6FA',
  surface: '#FFFFFF',
  text: '#1F2933',
  mutedText: '#6B7280',
  border: '#D1D5DB',
  error: '#D32F2F',
  success: '#2E7D32',
  warning: '#F59E0B',
};

/**
 * Shared spacing values.
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

/**
 * Shared border radius values.
 */
export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
};

/**
 * Maximum number of characters allowed for the user's full name.
 */
export const MAX_FULL_NAME_LENGTH = 50;

/**
 * Supported ride statuses.
 */
export const RIDE_STATUS = {
  idle: 'idle',
  searching: 'searching',
  accepted: 'accepted',
  inProgress: 'in_progress',
  completed: 'completed',
  cancelled: 'cancelled',
};