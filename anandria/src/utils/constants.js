// ─── Application Constants ────────────────────────────────────────────────────

export const APP_NAME = 'ANANDRIA';
export const APP_TAGLINE = 'Your GenAI Event Planning Co-Pilot';

// Event categories
export const EVENT_TYPES = {
  WEDDING: 'Wedding',
  BIRTHDAY: 'Birthday',
  COMMUNITY: 'Community Event',
};

// Currency options
export const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee (₹)' },
  { code: 'USD', symbol: '$', label: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', label: 'Euro (€)' },
  { code: 'GBP', symbol: '£', label: 'British Pound (£)' },
];

// Vendor status options
export const VENDOR_STATUS = {
  PENDING: 'Pending',
  CONTACTED: 'Contacted',
  BOOKED: 'Booked',
};

// Priority levels
export const PRIORITY = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

// Timeline phases
export const TIMELINE_PHASES = [
  '6+ Months Out',
  '3-6 Months Out',
  '1-3 Months Out',
  '2-4 Weeks Out',
  '1 Week Out',
  'Day Before',
  'Event Day',
  'Post-Event',
];

// localStorage keys
export const STORAGE_KEYS = {
  EVENT_PLAN: 'anandria_event_plan',
  FORM_DATA: 'anandria_form_data',
  ACTIVE_TAB: 'anandria_active_tab',
  THEME: 'anandria_theme',
};

// API rate limiting
export const RATE_LIMIT_MS = 5000; // 5 seconds cooldown between API calls

// Input validation limits
export const VALIDATION = {
  MAX_NAME_LENGTH: 100,
  MAX_NOTES_LENGTH: 500,
  MAX_THEME_LENGTH: 200,
  MIN_GUESTS: 1,
  MAX_GUESTS: 10000,
  MIN_BUDGET: 1,
  MAX_BUDGET: 1_000_000_000,
};

// Tab identifiers
export const TABS = {
  BUDGET: 'budget',
  TIMELINE: 'timeline',
  VENDORS: 'vendors',
  IDEAS: 'ideas',
};

// Budget category colors
export const BUDGET_COLORS = [
  '#7C3AED', // violet
  '#EC4899', // pink
  '#F59E0B', // amber
  '#10B981', // emerald
  '#3B82F6', // blue
  '#EF4444', // red
  '#8B5CF6', // purple
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange
];
