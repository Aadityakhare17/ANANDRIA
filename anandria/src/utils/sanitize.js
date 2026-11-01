import DOMPurify from 'dompurify';
import { VALIDATION } from './constants.js';

/**
 * Sanitize a plain text string – strips HTML/script injection, trims whitespace.
 * Uses DOMPurify with FORBID_TAGS to fully strip all markup.
 */
export function sanitizeText(input) {
  if (typeof input !== 'string') return '';
  // Strip all HTML tags, returning only plain text
  const clean = DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return clean.trim();
}

/**
 * Sanitize AI-generated HTML content (for Ideas tab where we may render richer content).
 * Only allows safe inline tags.
 */
export function sanitizeHTML(input) {
  if (typeof input !== 'string') return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span', 'br', 'ul', 'li', 'ol', 'p'],
    ALLOWED_ATTR: ['class'],
  });
}

/**
 * Validate and parse event form inputs.
 * Returns { valid: boolean, errors: Record<string, string>, sanitized: object }
 */
export function validateEventForm(formData) {
  const errors = {};
  const sanitized = {};

  // Event Name
  const name = sanitizeText(formData.eventName || '');
  if (!name) {
    errors.eventName = 'Event name is required.';
  } else if (name.length > VALIDATION.MAX_NAME_LENGTH) {
    errors.eventName = `Event name must be under ${VALIDATION.MAX_NAME_LENGTH} characters.`;
  } else {
    sanitized.eventName = name;
  }

  // Event Type
  const validTypes = ['Wedding', 'Birthday', 'Community Event'];
  if (!validTypes.includes(formData.eventType)) {
    errors.eventType = 'Please select a valid event type.';
  } else {
    sanitized.eventType = formData.eventType;
  }

  // Target Date — must be a future date
  const targetDate = formData.targetDate;
  if (!targetDate) {
    errors.targetDate = 'Target date is required.';
  } else {
    const parsed = new Date(targetDate);
    if (isNaN(parsed.getTime())) {
      errors.targetDate = 'Please enter a valid date.';
    } else {
      // Compare date strings directly (YYYY-MM-DD) to avoid timezone issues
      const todayStr = new Date().toISOString().split('T')[0];
      const inputStr = targetDate; // already in YYYY-MM-DD format
      if (inputStr <= todayStr) {
        errors.targetDate = 'Target date must be in the future.';
      } else {
        sanitized.targetDate = targetDate;
      }
    }
  }

  // Guest Count
  const guests = parseInt(formData.guestCount, 10);
  if (isNaN(guests) || guests < VALIDATION.MIN_GUESTS) {
    errors.guestCount = `Guest count must be at least ${VALIDATION.MIN_GUESTS}.`;
  } else if (guests > VALIDATION.MAX_GUESTS) {
    errors.guestCount = `Guest count cannot exceed ${VALIDATION.MAX_GUESTS.toLocaleString()}.`;
  } else {
    sanitized.guestCount = guests;
  }

  // Total Budget
  const budget = parseFloat(formData.totalBudget);
  if (isNaN(budget) || budget < VALIDATION.MIN_BUDGET) {
    errors.totalBudget = 'Budget must be a positive number.';
  } else if (budget > VALIDATION.MAX_BUDGET) {
    errors.totalBudget = 'Budget value is unrealistically large.';
  } else {
    sanitized.totalBudget = budget;
  }

  // Currency
  const validCurrencies = ['INR', 'USD', 'EUR', 'GBP'];
  sanitized.currency = validCurrencies.includes(formData.currency) ? formData.currency : 'INR';

  // Theme / Vibe keywords (optional, sanitize)
  const theme = sanitizeText(formData.themeKeywords || '');
  if (theme.length > VALIDATION.MAX_THEME_LENGTH) {
    errors.themeKeywords = `Theme keywords must be under ${VALIDATION.MAX_THEME_LENGTH} characters.`;
  } else {
    sanitized.themeKeywords = theme;
  }

  // Dietary / Special requirements (optional, sanitize)
  const notes = sanitizeText(formData.specialRequirements || '');
  if (notes.length > VALIDATION.MAX_NOTES_LENGTH) {
    errors.specialRequirements = `Notes must be under ${VALIDATION.MAX_NOTES_LENGTH} characters.`;
  } else {
    sanitized.specialRequirements = notes;
  }

  // Location / Cultural style (optional)
  sanitized.location = sanitizeText(formData.location || '');

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    sanitized,
  };
}

/**
 * Validate a co-pilot refinement prompt.
 */
export function validateRefinementPrompt(prompt) {
  const clean = sanitizeText(prompt);
  if (!clean) return { valid: false, error: 'Prompt cannot be empty.', sanitized: '' };
  if (clean.length > 300) return { valid: false, error: 'Prompt must be under 300 characters.', sanitized: '' };
  return { valid: true, error: null, sanitized: clean };
}

/**
 * Detect potential prompt injection patterns.
 * Returns true if suspicious content is detected.
 */
export function detectPromptInjection(text) {
  const patterns = [
    /ignore\s+(previous|all|above)\s+instructions/i,
    /forget\s+(your|all|the)\s+(instructions|persona|role)/i,
    /you\s+are\s+now\s+a/i,
    /act\s+as\s+(?!an?\s+event)/i,
    /system\s*:\s*you/i,
    /\[INST\]/i,
    /<\|system\|>/i,
    /###\s*instruction/i,
  ];
  return patterns.some((p) => p.test(text));
}
