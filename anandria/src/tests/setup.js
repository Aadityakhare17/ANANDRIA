// Test setup – mock browser APIs not available in jsdom
import { vi } from 'vitest';

// Mock DOMPurify for the jsdom environment
vi.mock('dompurify', () => ({
  default: {
    sanitize: (input, options) => {
      if (!input || typeof input !== 'string') return '';
      // Simple HTML stripper for test environment
      if (options && options.ALLOWED_TAGS && options.ALLOWED_TAGS.length === 0) {
        return input
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<[^>]+>/g, '')
          .trim();
      }
      return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    },
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, val) => { store[key] = String(val); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Mock URL.createObjectURL / revokeObjectURL without overriding the URL class
if (typeof globalThis.URL.createObjectURL === 'undefined') {
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock');
}
if (typeof globalThis.URL.revokeObjectURL === 'undefined') {
  globalThis.URL.revokeObjectURL = vi.fn();
}

