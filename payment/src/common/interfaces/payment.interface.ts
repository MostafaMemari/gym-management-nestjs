import { TransactionStatus } from '@prisma/client';

export interface IVerifyPayment {
  authority: string;
  status: string;
  frontendUrl: string;
}

export interface IRefund {
  sessionId: string;
  amount: number;
  description?: string;
  reason?: 'CUSTOMER_REQUEST' | 'DUPLICATE_TRANSACTION' | 'SUSPICIOUS_TRANSACTION' | 'OTHER';
}

export interface IPaymentRefund extends Omit<IRefund, 'sessionId' | 'amount'> {
  transactionId: number;
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
