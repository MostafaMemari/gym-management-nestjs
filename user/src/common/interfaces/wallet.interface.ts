import { WalletStatus } from '@prisma/client';
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

export interface IWalletManualCreditFilter extends IPagination {
  walletId?: number;
  userId?: number;
  creditedBy?: number;
  minAmount?: number;
  maxAmount?: number;
  startDate?: number;
  endDate?: number;
  reason?: string;
  sortBy?: 'creditedBy' | 'amount' | 'createdAt' | 'updatedAt';
  sortDirection?: 'asc' | 'desc';
}

export interface IWalletsFilter extends IPagination {
  userId?: number;
  maxBalance?: number;
  minBalance?: number;
  startDate?: number;
  endDate?: number;
  isBlocked?: boolean;
  status?: WalletStatus;
  lastWithdrawalDate?: Date;
  sortBy?: 'balance' | 'createdAt' | 'updatedAt' | 'lastWithdrawalDate';
  sortDirection?: 'asc' | 'desc';
}
