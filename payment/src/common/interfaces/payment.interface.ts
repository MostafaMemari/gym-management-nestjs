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
