/**
 * Wallet Types
 */

export type WalletType = 'cash' | 'bank' | 'credit' | 'upi' | 'crypto' | 'other';

export interface Wallet {
  id: number;
  name: string;
  type: WalletType;
  currency: string;
  /** Balance in smallest currency unit (paise/cents) */
  balance: number;
  icon: string | null;
  color: string | null;
  isDefault: number; // SQLite boolean (0 or 1)
  createdAt: string;
  updatedAt: string;
}

export interface CreateWalletInput {
  name: string;
  type: WalletType;
  currency: string;
  balance?: number;
  icon?: string;
  color?: string;
  isDefault?: number;
}

export interface UpdateWalletInput {
  name?: string;
  type?: WalletType;
  currency?: string;
  balance?: number;
  icon?: string;
  color?: string;
  isDefault?: number;
}
