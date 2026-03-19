/**
 * Application-wide constants.
 */

// INR currency formatting
export const INR_LOCALE = 'en-IN';
export const INR_CURRENCY = 'INR';

/**
 * Format a number/string as INR with Indian numbering.
 * e.g., 1250000 → "₹12,50,000.00"
 */
export function formatINR(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '₹0.00';
  return new Intl.NumberFormat(INR_LOCALE, {
    style: 'currency',
    currency: INR_CURRENCY,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format a number/string as INR without decimals (compact).
 * e.g., 1250000 → "₹12,50,000"
 */
export function formatINRCompact(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '₹0';
  return new Intl.NumberFormat(INR_LOCALE, {
    style: 'currency',
    currency: INR_CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}
