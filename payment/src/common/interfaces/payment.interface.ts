import { TransactionStatus } from '@prisma/client';

export interface IVerifyPayment {
  authority: string;
  status: string;
  frontendUrl: string;
}
export interface IPagination {
  take?: number;
  page?: number;
}

export interface IGetUserTransactions extends IPagination {
  userId: number;
}

export interface ITransactionsFilters extends IPagination {
  userId?: number;
  minAmount?: number;
  maxAmount?: number;
  status?: TransactionStatus;
  authority?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  sortBy?: 'createdAt' | 'updatedAt' | 'amount';
  sortDirection?: 'asc' | 'desc';
}

export interface IMyTransactionsFilers extends Omit<ITransactionsFilters, 'userId'> {}
