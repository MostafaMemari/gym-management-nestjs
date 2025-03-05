export interface ISendRequest {
  amount: number;
  description: string;
  callbackUrl?: string
  user?: {
    email?: string;
    mobile?: string;
  };
}

export interface IVerifyRequest {
  authority: string;
  merchant_id: string;
}
