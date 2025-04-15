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
  UpdatedAt = 'updatedAt',
}

export enum NotificationSortBy {
  CreatedAt = 'createdAt',
  UpdatedAt = 'updatedAt',
  IsEdited = 'isEdited',
}

export enum RoleSortBy {
  CreatedAt = 'createdAt',
  UpdatedAt = 'updatedAt',
  Name = 'name',
}

export enum PermissionSortBy {
  CreatedAt = 'createdAt',
  UpdatedAt = 'updatedAt',
  Endpoint = 'endpoint',
  Method = 'method',
}

export enum NotificationType {
  PUSH = 'PUSH',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
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

export enum BackupPatterns {
  CreateBackup = 'create_backup',
  RestoreBackup = 'restore_backup',
}
