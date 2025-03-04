export interface ISendRequest {
  amount: number;
  description: string;
  user?: {
    email?: string;
    mobile?: string;
  };
}
