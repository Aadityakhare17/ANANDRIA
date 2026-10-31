import { CURRENCIES } from './constants.js';

/**
 * Format a number as a currency string.
 */
export function formatCurrency(amount, currencyCode = 'INR') {
  const currency = CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency.symbol}${amount.toLocaleString()}`;
  }
}

/**
 * Get currency symbol for a currency code.
 */
export function getCurrencySymbol(code) {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? '₹';
}

/**
 * Validate that budget breakdown items sum to exactly the total budget (within floating point tolerance).
 * @param {Array<{amount: number}>} items
 * @param {number} totalBudget
 * @returns {{ valid: boolean, sum: number, difference: number }}
 */
export function validateBudgetSum(items, totalBudget) {
  const sum = items.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
  const difference = Math.abs(sum - totalBudget);
  const valid = difference < 1; // within 1 currency unit
  return { valid, sum, difference };
}

/**
 * Check if any single budget item exceeds the total budget.
 */
export function checkOverBudget(items, totalBudget) {
  const sum = items.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
  return {
    overBudget: sum > totalBudget,
    excess: Math.max(0, sum - totalBudget),
    sum,
  };
}

/**
 * Recalculate budget items when one item is manually adjusted.
 * Keeps adjusted item fixed, scales remaining items proportionally.
 * @param {Array} items - budget breakdown items
 * @param {string} changedId - id of changed item
 * @param {number} newAmount - new amount for changed item
 * @param {number} totalBudget - total budget
 * @returns {Array} updated items
 */
export function recalculateBudget(items, changedId, newAmount, totalBudget) {
  const clampedAmount = Math.max(0, Math.min(newAmount, totalBudget));
  const remaining = totalBudget - clampedAmount;
  const otherItems = items.filter((i) => i.id !== changedId);
  const otherTotal = otherItems.reduce((acc, i) => acc + i.amount, 0);

  return items.map((item) => {
    if (item.id === changedId) {
      return { ...item, amount: clampedAmount, percentage: (clampedAmount / totalBudget) * 100 };
    }
    if (otherTotal === 0) {
      // Distribute remaining equally
      const equal = remaining / otherItems.length;
      return { ...item, amount: equal, percentage: (equal / totalBudget) * 100 };
    }
    const scaled = (item.amount / otherTotal) * remaining;
    return { ...item, amount: Math.round(scaled), percentage: (Math.round(scaled) / totalBudget) * 100 };
  });
}

/**
 * Calculate days remaining until the event date.
 */
export function daysUntilEvent(targetDate) {
  const now = new Date();
  const target = new Date(targetDate);
  const diff = target - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Format a date string to a human-readable format.
 */
export function formatDate(dateStr) {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

/**
 * Calculate vendor checklist completion percentage.
 */
export function calcVendorCompletion(vendors) {
  if (!vendors || vendors.length === 0) return 0;
  const booked = vendors.filter((v) => v.status === 'Booked').length;
  return Math.round((booked / vendors.length) * 100);
}

/**
 * Calculate timeline completion percentage.
 */
export function calcTimelineCompletion(milestones) {
  if (!milestones || milestones.length === 0) return 0;
  const done = milestones.filter((m) => m.completed).length;
  return Math.round((done / milestones.length) * 100);
}
