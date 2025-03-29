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
