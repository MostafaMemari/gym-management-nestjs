export interface ICreateRole {
  name: string;
  permissions?: IPermission[];
}

export interface IAssignPermission {
  roleId: number;
  permissionId: number;
}

export interface IPermission {
  method: string;
  endpoint: string;
}
