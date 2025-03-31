export enum PaymentMessages {
  NotFoundTransaction = 'Transaction not found.',
  FailedOrVerified = 'Failed or already verified payment.',
  VerifiedSuccess = 'Payment verified successfully.',
  RequiredUserId = 'userId is required.',
  SessionIdNotFound = 'Session id for this transaction not found.',
  RefundedSuccess = 'Payment refunded successfully.',
}
