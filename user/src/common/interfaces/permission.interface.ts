import { IPagination } from './user.interface';

export interface ICreatePermission extends IPermission {}

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
