import { IPagination } from './user.interface';

export interface IChargeWallet {
  userId: number;
  amount: number;
}

export interface IGetAllDeductions extends IPagination {
  userId?: number;
  walletId?: number;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string | Date;
  endDate?: string | Date;
  sortBy?: 'createdAt' | 'deductionAmount' | 'remainingBalance';
  sortDirection?: 'asc' | 'desc';
}
