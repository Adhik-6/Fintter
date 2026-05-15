/**
 * Currency Definitions
 * Includes symbol, code, name, and smallest unit multiplier.
 * All monetary values are stored as integers in the smallest unit.
 */

export interface CurrencyDefinition {
  code: string;
  symbol: string;
  name: string;
  /** Number of fractional digits (e.g. 2 for cents, paise) */
  decimalDigits: number;
  /** Multiplier to convert from main unit to smallest unit (e.g. 100 for INR → paise) */
  smallestUnitMultiplier: number;
  /** Symbol placement relative to amount */
  symbolPosition: 'prefix' | 'suffix';
}

export const currencies: Record<string, CurrencyDefinition> = {
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    decimalDigits: 2,
    smallestUnitMultiplier: 100,
    symbolPosition: 'prefix',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimalDigits: 2,
    smallestUnitMultiplier: 100,
    symbolPosition: 'prefix',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimalDigits: 2,
    smallestUnitMultiplier: 100,
    symbolPosition: 'prefix',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    decimalDigits: 2,
    smallestUnitMultiplier: 100,
    symbolPosition: 'prefix',
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    decimalDigits: 0,
    smallestUnitMultiplier: 1,
    symbolPosition: 'prefix',
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    decimalDigits: 2,
    smallestUnitMultiplier: 100,
    symbolPosition: 'prefix',
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    decimalDigits: 2,
    smallestUnitMultiplier: 100,
    symbolPosition: 'prefix',
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    decimalDigits: 2,
    smallestUnitMultiplier: 100,
    symbolPosition: 'prefix',
  },
  AED: {
    code: 'AED',
    symbol: 'د.إ',
    name: 'UAE Dirham',
    decimalDigits: 2,
    smallestUnitMultiplier: 100,
    symbolPosition: 'prefix',
  },
} as const;

export const defaultCurrencyCode = 'INR';

export const currencyList = Object.values(currencies);
