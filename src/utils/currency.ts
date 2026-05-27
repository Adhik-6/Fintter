/**
 * Currency Formatting Utilities
 */
import { currencies, defaultCurrencyCode } from '@src/constants/currencies';

/**
 * Format an amount from smallest unit (paise/cents) to display string.
 */
export function formatAmount(
  amount: number,
  currencyCode: string = defaultCurrencyCode,
  showSign: boolean = false
): string {
  const currency = currencies[currencyCode] ?? currencies[defaultCurrencyCode];
  const mainAmount = amount / currency.smallestUnitMultiplier;
  const absFormatted = Math.abs(mainAmount).toLocaleString('en-IN', {
    minimumFractionDigits: currency.decimalDigits,
    maximumFractionDigits: currency.decimalDigits,
  });

  const sign = showSign ? (amount >= 0 ? '+' : '-') : (amount < 0 ? '-' : '');
  const formatted = currency.symbolPosition === 'prefix'
    ? `${currency.symbol}${absFormatted}`
    : `${absFormatted}${currency.symbol}`;

  return `${sign}${formatted}`;
}

/**
 * Format amount compactly for INR: K (thousand), L (lakh), Cr (crore).
 * Always prefixed with ₹. Falls back to full amount for small numbers.
 */
export function formatAmountCompact(
  amount: number,
  currencyCode: string = defaultCurrencyCode
): string {
  const currency = currencies[currencyCode] ?? currencies[defaultCurrencyCode];
  const rupees = Math.abs(amount / currency.smallestUnitMultiplier);
  const sign = amount < 0 ? '-' : '';

  let compact: string;
  if (rupees >= 1_00_00_000) { // 1 Crore
    compact = `${(rupees / 1_00_00_000).toFixed(1)}Cr`;
  } else if (rupees >= 1_00_000) { // 1 Lakh
    compact = `${(rupees / 1_00_000).toFixed(1)}L`;
  } else if (rupees >= 1_000) { // 1 Thousand
    compact = `${(rupees / 1_000).toFixed(1)}K`;
  } else {
    compact = rupees.toFixed(2);
  }

  return `${sign}₹${compact}`;
}

/**
 * Parse a display amount string to smallest unit integer.
 * Returns 0 for invalid/negative values and clamps to MAX_SAFE_INTEGER.
 */
export function parseAmountToSmallestUnit(
  displayAmount: string,
  currencyCode: string = defaultCurrencyCode
): number {
  const currency = currencies[currencyCode] ?? currencies[defaultCurrencyCode];
  const cleaned = displayAmount.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed) || parsed < 0) return 0;
  const result = Math.round(parsed * currency.smallestUnitMultiplier);
  return Math.min(result, Number.MAX_SAFE_INTEGER);
}
