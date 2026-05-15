/**
 * Currency Formatting Utilities
 */
import { currencies, defaultCurrencyCode } from '@src/constants/currencies';

/**
 * Format an amount from smallest unit (paise/cents) to display string.
 * @param amount Amount in smallest currency unit
 * @param currencyCode Currency code (default: INR)
 * @param showSign Whether to show +/- sign
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
 * Parse a display amount string to smallest unit integer.
 * @param displayAmount Amount as typed by user (e.g. "150.50")
 * @param currencyCode Currency code
 */
export function parseAmountToSmallestUnit(
  displayAmount: string,
  currencyCode: string = defaultCurrencyCode
): number {
  const currency = currencies[currencyCode] ?? currencies[defaultCurrencyCode];
  const cleaned = displayAmount.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * currency.smallestUnitMultiplier);
}
