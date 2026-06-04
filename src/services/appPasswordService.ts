/**
 * App Password Service
 *
 * Manages a local app-level password with 3 recovery Q&A pairs.
 * Passwords and answers are stored as SHA-256 hashes in SQLite settings.
 *
 * No native crypto module required — uses a pure-JS SHA-256 implementation.
 *
 * Settings keys:
 *   app_password_hash  — hashed PIN
 *   app_rq1 / app_ra1_hash
 *   app_rq2 / app_ra2_hash
 *   app_rq3 / app_ra3_hash
 *   app_lock_balance   — '1' | '0'
 */

import { settingsRepository } from '@src/db/repositories/settingsRepository';

// ─── Pure-JS SHA-256 ──────────────────────────────────────────────────────────
// Adapted from a well-known public-domain implementation.
function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i: number;
  let j: number;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, boolean> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += '\x80';
  while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return ''; // Non-ASCII not supported; caller must encode first
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);

    for (i = 0; i < 64; i++) {
      const wi = w[i];
      const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (wi !== undefined ? wi : w[i - 16] + s0 + w[i - 7] + s1);

      const S1 = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = hash[7] + S1 + ch + k[i] + w[i];
      const S0 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = S0 + maj;

      hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

/**
 * Hash a string value. Normalizes to lowercase and trims whitespace
 * so that answer comparisons are case/space insensitive.
 */
function hashValue(value: string): string {
  return sha256(value.trim().toLowerCase());
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface RecoveryQuestion {
  question: string;
  answerHash: string;
}

/**
 * Returns true if an app password is currently configured.
 */
export async function isPasswordSet(): Promise<boolean> {
  const hash = await settingsRepository.get('app_password_hash');
  return !!hash;
}

/**
 * Set a new app password together with 3 recovery questions.
 * Overwrites any existing password.
 */
export async function setPassword(
  pin: string,
  q1: string, a1: string,
  q2: string, a2: string,
  q3: string, a3: string,
): Promise<void> {
  await settingsRepository.set('app_password_hash', hashValue(pin));
  await settingsRepository.set('app_rq1', q1.trim());
  await settingsRepository.set('app_ra1_hash', hashValue(a1));
  await settingsRepository.set('app_rq2', q2.trim());
  await settingsRepository.set('app_ra2_hash', hashValue(a2));
  await settingsRepository.set('app_rq3', q3.trim());
  await settingsRepository.set('app_ra3_hash', hashValue(a3));
}

/**
 * Verify a PIN against the stored hash.
 */
export async function verifyPassword(pin: string): Promise<boolean> {
  const stored = await settingsRepository.get('app_password_hash');
  if (!stored) return false;
  return hashValue(pin) === stored;
}

/**
 * Get the three recovery questions (not the hashed answers).
 * Returns null if no password is set.
 */
export async function getRecoveryQuestions(): Promise<[string, string, string] | null> {
  const q1 = await settingsRepository.get('app_rq1');
  const q2 = await settingsRepository.get('app_rq2');
  const q3 = await settingsRepository.get('app_rq3');
  if (!q1 || !q2 || !q3) return null;
  return [q1, q2, q3];
}

/**
 * Verify all three recovery answers. All must be correct.
 */
export async function verifyRecoveryAnswers(a1: string, a2: string, a3: string): Promise<boolean> {
  const h1 = await settingsRepository.get('app_ra1_hash');
  const h2 = await settingsRepository.get('app_ra2_hash');
  const h3 = await settingsRepository.get('app_ra3_hash');
  if (!h1 || !h2 || !h3) return false;
  return (
    hashValue(a1) === h1 &&
    hashValue(a2) === h2 &&
    hashValue(a3) === h3
  );
}

/**
 * Remove the app password and all recovery data.
 */
export async function removePassword(): Promise<void> {
  await settingsRepository.delete('app_password_hash');
  await settingsRepository.delete('app_rq1');
  await settingsRepository.delete('app_ra1_hash');
  await settingsRepository.delete('app_rq2');
  await settingsRepository.delete('app_ra2_hash');
  await settingsRepository.delete('app_rq3');
  await settingsRepository.delete('app_ra3_hash');
  // Also clear the balance lock
  await settingsRepository.set('app_lock_balance', '0');
}
