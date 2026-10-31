import { describe, it, expect } from 'vitest';
import {
  validateBudgetSum,
  checkOverBudget,
  recalculateBudget,
  calcVendorCompletion,
  calcTimelineCompletion,
  formatCurrency,
} from '../utils/budgetCalc.js';

// ─── Budget Math Tests ────────────────────────────────────────────────────────

describe('validateBudgetSum', () => {
  it('returns valid=true when items sum exactly to total', () => {
    const items = [
      { id: '1', amount: 250000 },
      { id: '2', amount: 300000 },
      { id: '3', amount: 450000 },
    ];
    const { valid, sum } = validateBudgetSum(items, 1000000);
    expect(valid).toBe(true);
    expect(sum).toBe(1000000);
  });

  it('returns valid=false when items exceed total', () => {
    const items = [{ id: '1', amount: 1200000 }];
    const { valid } = validateBudgetSum(items, 1000000);
    expect(valid).toBe(false);
  });

  it('returns valid=false when items are under total (more than 1 unit)', () => {
    const items = [{ id: '1', amount: 500000 }];
    const { valid, difference } = validateBudgetSum(items, 1000000);
    expect(valid).toBe(false);
    expect(difference).toBeGreaterThan(1);
  });

  it('handles empty items array', () => {
    const { valid, sum } = validateBudgetSum([], 100000);
    expect(sum).toBe(0);
    expect(valid).toBe(false);
  });
});

describe('checkOverBudget', () => {
  it('flags over-budget correctly', () => {
    const { overBudget, excess } = checkOverBudget([{ id: '1', amount: 1200000 }], 1000000);
    expect(overBudget).toBe(true);
    expect(excess).toBe(200000);
  });

  it('does not flag under-budget as over-budget', () => {
    const { overBudget } = checkOverBudget([{ id: '1', amount: 500000 }], 1000000);
    expect(overBudget).toBe(false);
  });

  it('does not flag exact-budget as over-budget', () => {
    const { overBudget } = checkOverBudget([{ id: '1', amount: 1000000 }], 1000000);
    expect(overBudget).toBe(false);
  });
});

describe('recalculateBudget', () => {
  it('scales other items proportionally when one item changes', () => {
    const items = [
      { id: '1', amount: 500000 },
      { id: '2', amount: 300000 },
      { id: '3', amount: 200000 },
    ];
    const updated = recalculateBudget(items, '1', 600000, 1000000);
    const changed = updated.find((i) => i.id === '1');
    const sum = updated.reduce((s, i) => s + i.amount, 0);
    expect(changed.amount).toBe(600000);
    // Others should sum to 400000
    expect(Math.abs(sum - 1000000)).toBeLessThanOrEqual(1);
  });

  it('clamps amount to totalBudget if exceeds', () => {
    const items = [{ id: '1', amount: 500000 }, { id: '2', amount: 500000 }];
    const updated = recalculateBudget(items, '1', 2000000, 1000000);
    const changed = updated.find((i) => i.id === '1');
    expect(changed.amount).toBeLessThanOrEqual(1000000);
  });
});

describe('calcVendorCompletion', () => {
  it('returns 0 for empty list', () => {
    expect(calcVendorCompletion([])).toBe(0);
  });

  it('returns 100 when all vendors booked', () => {
    const vendors = [
      { status: 'Booked' },
      { status: 'Booked' },
    ];
    expect(calcVendorCompletion(vendors)).toBe(100);
  });

  it('returns correct percentage', () => {
    const vendors = [
      { status: 'Booked' },
      { status: 'Pending' },
      { status: 'Booked' },
      { status: 'Contacted' },
    ];
    expect(calcVendorCompletion(vendors)).toBe(50);
  });
});

describe('calcTimelineCompletion', () => {
  it('returns 0 for no completed milestones', () => {
    const milestones = [{ completed: false }, { completed: false }];
    expect(calcTimelineCompletion(milestones)).toBe(0);
  });

  it('returns 100 for all completed', () => {
    const milestones = [{ completed: true }, { completed: true }];
    expect(calcTimelineCompletion(milestones)).toBe(100);
  });
});

describe('formatCurrency', () => {
  it('formats INR correctly', () => {
    const result = formatCurrency(100000, 'INR');
    expect(result).toContain('1,00,000');
  });

  it('falls back gracefully for unknown currency codes', () => {
    // Should not throw
    expect(() => formatCurrency(50000, 'XYZ')).not.toThrow();
  });
});
