export interface IChargeWallet {
  userId: number;
  amount: number;
}

export interface IWithdrawWallet extends IChargeWallet {}
