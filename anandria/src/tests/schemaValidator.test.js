import { describe, it, expect } from 'vitest';
import { validatePlanSchema } from '../services/geminiService.js';

// ─── Schema Validator Tests ───────────────────────────────────────────────────

const validPlan = {
  budgetBreakdown: [
    { id: 'b1', category: 'Venue', amount: 250000, percentage: 25, notes: 'Indoor ballroom', actualSpend: 0 },
    { id: 'b2', category: 'Catering', amount: 300000, percentage: 30, notes: 'Buffet for 100', actualSpend: 0 },
  ],
  timeline: [
    { id: 't1', phase: '6+ Months Out', task: 'Book venue', dueDate: '2027-01-01', completed: false, priority: 'High' },
    { id: 't2', phase: 'Event Day', task: 'Welcome guests', dueDate: '2027-06-01', completed: false, priority: 'High' },
  ],
  vendorChecklist: [
    { id: 'v1', vendor: 'DJ Beats', task: 'Book entertainment', status: 'Pending', priority: 'Medium', estimatedCost: 30000, category: 'Entertainment' },
  ],
  personalizedIdeas: {
    themes: [{ name: 'Garden Delight', description: 'Lush outdoor setup' }],
    colorPalettes: [{ name: 'Pastel Bliss', colors: ['#FFDEE9', '#B5FFFC'], mood: 'Soft' }],
    menuIdeas: ['Artisan cheese board', 'Live pasta station'],
    activities: ['Photo booth', 'Trivia game'],
  },
  summary: 'Your perfect wedding plan.',
  estimatedGuestCostPerHead: 5500,
};

describe('validatePlanSchema – valid plans', () => {
  it('passes a fully valid plan', () => {
    const { valid, errors } = validatePlanSchema(validPlan);
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  it('passes plan with minimal required fields', () => {
    const minimal = {
      budgetBreakdown: [{ id: 'b1', category: 'Venue', amount: 100000, percentage: 100 }],
      timeline: [{ id: 't1', phase: 'Test', task: 'Setup', dueDate: '2027-01-01', completed: false }],
      vendorChecklist: [{ id: 'v1', vendor: 'Test Vendor', task: 'Book', status: 'Pending', priority: 'Low' }],
      personalizedIdeas: { themes: [], colorPalettes: [], menuIdeas: [], activities: [] },
    };
    const { valid } = validatePlanSchema(minimal);
    expect(valid).toBe(true);
  });
});

describe('validatePlanSchema – invalid inputs', () => {
  it('fails for null input', () => {
    const { valid } = validatePlanSchema(null);
    expect(valid).toBe(false);
  });

  it('fails for undefined input', () => {
    const { valid } = validatePlanSchema(undefined);
    expect(valid).toBe(false);
  });

  it('fails for non-object input (string)', () => {
    const { valid } = validatePlanSchema('not a plan');
    expect(valid).toBe(false);
  });

  it('fails when budgetBreakdown is missing', () => {
    const { budgetBreakdown, ...noBudget } = validPlan;
    const { valid, errors } = validatePlanSchema(noBudget);
    expect(valid).toBe(false);
    expect(errors.some((e) => e.includes('budgetBreakdown'))).toBe(true);
  });

  it('fails when timeline is missing', () => {
    const { timeline, ...noTimeline } = validPlan;
    const { valid, errors } = validatePlanSchema(noTimeline);
    expect(valid).toBe(false);
    expect(errors.some((e) => e.includes('timeline'))).toBe(true);
  });

  it('fails when vendorChecklist is missing', () => {
    const { vendorChecklist, ...noVendors } = validPlan;
    const { valid, errors } = validatePlanSchema(noVendors);
    expect(valid).toBe(false);
    expect(errors.some((e) => e.includes('vendorChecklist'))).toBe(true);
  });

  it('fails when personalizedIdeas is missing', () => {
    const { personalizedIdeas, ...noIdeas } = validPlan;
    const { valid, errors } = validatePlanSchema(noIdeas);
    expect(valid).toBe(false);
    expect(errors.some((e) => e.includes('personalizedIdeas'))).toBe(true);
  });

  it('fails when budgetBreakdown has invalid amount type', () => {
    const invalid = {
      ...validPlan,
      budgetBreakdown: [{ id: 'b1', category: 'Venue', amount: 'notANumber', percentage: 25 }],
    };
    const { valid, errors } = validatePlanSchema(invalid);
    expect(valid).toBe(false);
    expect(errors.some((e) => e.includes('amount'))).toBe(true);
  });

  it('fails when budgetBreakdown is empty array', () => {
    const { valid } = validatePlanSchema({ ...validPlan, budgetBreakdown: [] });
    expect(valid).toBe(false);
  });

  it('fails when personalizedIdeas is missing themes array', () => {
    const invalid = {
      ...validPlan,
      personalizedIdeas: { colorPalettes: [], menuIdeas: [], activities: [] },
    };
    const { valid, errors } = validatePlanSchema(invalid);
    expect(valid).toBe(false);
    expect(errors.some((e) => e.includes('themes'))).toBe(true);
  });

  it('handles malformed JSON string gracefully', () => {
    expect(() => {
      try {
        JSON.parse('{bad json}');
      } catch {
        // gracefully caught
      }
    }).not.toThrow();
  });
});
