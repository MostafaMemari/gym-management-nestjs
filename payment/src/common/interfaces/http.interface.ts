export interface ISendRequest {
  amount: number;
  description: string;
  user?: {
    email?: string;
    mobile?: string;
  };
}

export interface IVerifyRequest {
  authority: string;
  amount: number;
  merchant_id: string;
}
