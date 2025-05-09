import { DefaultRole } from '../enums/shared.enum';
import { IPagination } from './user.interface';

export interface ICreateRole {
  name: string;
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

export interface IPermissionFilter extends IPagination {
  method?: string;
  endpoint?: string;
  includeRoles?: boolean;
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'endpoint' | 'method' | 'createdAt' | 'updateAt';
  sortDirection?: 'asc' | 'desc';
}

export interface IUpdateRole {
  roleId: number;
  name: string;
}

export interface IRemovePermissionFromRole extends IAssignPermission {}

export interface IRemoveRoleFromUser extends IAssignRoleToUser {}

export interface IStaticRoles {
  staticRoles: {
    role: DefaultRole;
    permissions: { method: string; endpoint: string }[];
  }[];
}
