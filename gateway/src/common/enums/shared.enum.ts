export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export enum WalletDeductionSortBy {
  CreatedAt = 'createdAt',
  DeductionAmount = 'deductionAmount',
  RemainingBalance = 'remainingBalance',
}

export enum WalletCreditSortBy {
  CreatedAt = 'createdAt',
  UpdatedAt = 'updatedAt',
  Amount = 'amount',
  CreditedBy = 'creditedBy',
}

export enum WalletSortBy {
  Balance = 'balance',
  CreatedAt = 'createdAt',
  UpdatedAt = 'updatedAt',
  LastWithdrawalDate = 'lastWithdrawalDate',
}

export enum UserSortBy {
  UpdatedAt = 'updatedAt',
  CreatedAt = 'createdAt',
  Username = 'username',
  Mobile = 'mobile',
}

export enum WalletStatus {
  NONE = 'NONE',
  DEPLETED = 'DEPLETED',
  CRITICAL_BALANCE = 'CRITICAL_BALANCE',
  LOW_BALANCE = 'LOW_BALANCE',
}

export enum TransactionsSortBy {
  Amount = 'amount',
  CreatedAt = 'createdAt',
  updatedAt = 'updatedAt',
}

export enum TransactionStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
  REFUNDED = 'REFUNDED',
}

export enum RefundPaymentReason {
  CUSTOMER_REQUEST = 'CUSTOMER_REQUEST',
  DUPLICATE_TRANSACTION = 'DUPLICATE_TRANSACTION',
  SUSPICIOUS_TRANSACTION = 'SUSPICIOUS_TRANSACTION',
  OTHER = 'OTHER',
}
