import { IPagination } from './user.interface';

export interface ICreateRole {
  name: string;
  permissions?: IPermission[];
}

export interface IAssignPermission {
  roleId: number;
  permissionId: number;
}

export interface IAssignRoleToUser {
  userId: number;
  roleId: number;
}

export interface IRolesFilter extends IPagination {
  name?: string;
  includePermissions?: boolean;
  includeUsers?: boolean;
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'name' | 'createdAt' | 'updateAt';
  sortDirection?: 'asc' | 'desc';
}

export interface IPermission {
  method: string;
  endpoint: string;
}

export interface IUpdateRole {
  roleId: number;
  name: string;
}
