export interface ICreateRole {
  name: string;
  permissions?: IPermission[];
}

export interface IPermission {
  method: string;
  endpoint: string;
}
