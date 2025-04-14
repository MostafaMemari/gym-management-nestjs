export interface ICreatePermission extends IPermission {}

export interface IPermission {
  method: string;
  endpoint: string;
}
