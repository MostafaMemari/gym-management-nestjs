import { IPagination } from './user.interface';

export interface IChargeWallet {
  userId: number;
  amount: number;
}

export interface IWalletDeductionFilter extends IPagination {
  userId?: number;
  walletId?: number;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string | Date;
  endDate?: string | Date;
  sortBy?: 'createdAt' | 'deductionAmount' | 'remainingBalance';
  sortDirection?: 'asc' | 'desc';
}

export interface IManualCredit {
  walletId: number;
  amount: number;
  creditedBy: number;
  reason: string;
}
