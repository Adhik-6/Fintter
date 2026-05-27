/**
 * SMS Parser Service
 *
 * Regex-based transaction extractor that matches banking SMS/UPI text
 * against rules stored in the `parser_rules` DB table.
 *
 * Usage: user pastes an SMS → parser extracts amount, merchant, type
 * → pre-fills a transaction for quick confirmation.
 *
 * No AI needed — Indian banks follow predictable message templates.
 */

import { parserRuleRepository, type ParserRule } from '@src/db/repositories/parserRuleRepository';
import { parseAmountToSmallestUnit } from '@src/utils/currency';

export interface ParsedTransaction {
  /** Extracted amount in smallest currency unit */
  amount: number;
  /** Display amount (e.g. "1500.00") */
  displayAmount: string;
  /** Detected type */
  type: 'expense' | 'income';
  /** Extracted merchant/payee (if any) */
  merchant: string | null;
  /** Suggested category ID from the matching rule */
  suggestedCategoryId: number | null;
  /** Name of the rule that matched */
  matchedRule: string;
  /** Original SMS text */
  originalText: string;
  /** Confidence: 'high' if amount+type match, 'medium' if only amount */
  confidence: 'high' | 'medium' | 'low';
}

/** Fallback patterns for when no DB rules match */
const FALLBACK_PATTERNS = [
  // Indian bank debit patterns
  {
    regex: /(?:debited|spent|paid|sent|purchase|withdrawn|txn|transaction)[^\d]*(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    type: 'expense' as const,
    merchantRegex: /(?:to|at|for|@)\s+([A-Za-z0-9\s@_.-]+?)(?:\s+(?:on|ref|upi|a\/c|ac|via)|\.|$)/i,
  },
  // Indian bank credit patterns
  {
    regex: /(?:credited|received|refund|cashback|credit)[^\d]*(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    type: 'income' as const,
    merchantRegex: /(?:from|by)\s+([A-Za-z0-9\s@_.-]+?)(?:\s+(?:on|ref|upi|a\/c|ac)|\.|$)/i,
  },
  // Amount-first patterns (Rs.500 debited)
  {
    regex: /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)[^\d]*(?:debited|spent|deducted|withdrawn)/i,
    type: 'expense' as const,
    merchantRegex: /(?:to|at|for|@)\s+([A-Za-z0-9\s@_.-]+?)(?:\s+(?:on|ref|upi)|\.|$)/i,
  },
  {
    regex: /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)[^\d]*(?:credited|received|deposited)/i,
    type: 'income' as const,
    merchantRegex: /(?:from|by)\s+([A-Za-z0-9\s@_.-]+?)(?:\s+(?:on|ref|upi)|\.|$)/i,
  },
  // UPI-specific
  {
    regex: /upi[^\d]*(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    type: 'expense' as const,
    merchantRegex: /(?:to|payee:?)\s+([A-Za-z0-9\s@_.-]+?)(?:\s+(?:on|ref|upi)|\.|$)/i,
  },
];

/** Quick check — does this text look like a financial SMS? */
export function isFinancialMessage(text: string): boolean {
  const keywords = [
    'debited', 'credited', 'spent', 'received', 'paid', 'withdrawn',
    'refund', 'cashback', 'transferred', 'txn', 'transaction',
    'a/c', 'acct', 'account', 'upi', 'neft', 'imps', 'balance',
  ];
  const hasAmount = /(?:rs\.?|inr|₹)\s*[\d,]+/i.test(text);
  const hasKeyword = keywords.some((kw) => text.toLowerCase().includes(kw));
  return hasAmount && hasKeyword;
}

/**
 * Parse a single SMS text into a structured transaction suggestion.
 * First tries DB-stored rules, then fallback patterns.
 */
export async function parseSmsText(text: string): Promise<ParsedTransaction | null> {
  const cleanText = text.replace(/\n/g, ' ').trim();

  // 1. Try DB rules first
  const rules = await parserRuleRepository.getActive('sms');
  for (const rule of rules) {
    const result = tryRule(rule, cleanText);
    if (result) return result;
  }

  // 2. Fall back to built-in patterns
  return tryFallbackPatterns(cleanText);
}

/**
 * Batch-parse multiple messages and return only the ones
 * that look like financial transactions.
 */
export async function parseMultipleMessages(
  messages: { text: string; date?: string; sender?: string }[]
): Promise<(ParsedTransaction & { date?: string; sender?: string })[]> {
  const results: (ParsedTransaction & { date?: string; sender?: string })[] = [];
  for (const msg of messages) {
    if (isFinancialMessage(msg.text)) {
      const parsed = await parseSmsText(msg.text);
      if (parsed) {
        results.push({ ...parsed, date: msg.date, sender: msg.sender });
      }
    }
  }
  return results;
}

/** Try matching against a DB-stored parser rule */
function tryRule(rule: ParserRule, text: string): ParsedTransaction | null {
  try {
    const regex = new RegExp(rule.pattern, 'i');
    const match = text.match(regex);
    if (!match) return null;

    const amountStr = match.groups?.amount;
    if (!amountStr) return null;

    const displayAmount = amountStr.replace(/,/g, '');
    const amount = parseAmountToSmallestUnit(displayAmount);
    if (amount <= 0) return null;

    const merchant = match.groups?.merchant ? match.groups.merchant.trim() : null;

    return {
      amount,
      displayAmount,
      type: rule.type,
      merchant: cleanMerchantName(merchant),
      suggestedCategoryId: rule.defaultCategoryId,
      matchedRule: rule.name,
      originalText: text,
      confidence: 'high',
    };
  } catch {
    return null;
  }
}

/** Try built-in fallback patterns */
function tryFallbackPatterns(text: string): ParsedTransaction | null {
  for (const pattern of FALLBACK_PATTERNS) {
    const match = text.match(pattern.regex);
    if (!match || !match[1]) continue;

    const displayAmount = match[1].replace(/,/g, '');
    const amount = parseAmountToSmallestUnit(displayAmount);
    if (amount <= 0) continue;

    let merchant: string | null = null;
    if (pattern.merchantRegex) {
      const merchantMatch = text.match(pattern.merchantRegex);
      if (merchantMatch?.[1]) {
        merchant = cleanMerchantName(merchantMatch[1].trim());
      }
    }

    return {
      amount,
      displayAmount,
      type: pattern.type,
      merchant,
      suggestedCategoryId: null,
      matchedRule: 'Built-in pattern',
      originalText: text,
      confidence: merchant ? 'high' : 'medium',
    };
  }

  return null;
}

/** Clean up extracted merchant names */
function cleanMerchantName(name: string | null): string | null {
  if (!name) return null;
  return name
    .replace(/\s+/g, ' ')           // collapse spaces
    .replace(/[^\w\s@.-]/g, '')     // remove special chars
    .replace(/\s+(on|ref|upi|via|ac|a\/c)$/i, '') // trim trailing keywords
    .trim() || null;
}
