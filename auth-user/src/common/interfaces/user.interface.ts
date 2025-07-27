import { Role } from '@prisma/client';

export interface ICreateUser {
  username: string;

  password?: string;

  mobile?: string;
}

export interface ICreateUserStudent {
  username: string;
  role?: Role;
}
export interface ICreateUserCoach {
  username: string;
  role?: Role;
}

export interface IPagination {
  take?: number;
  page?: number;
}

export interface ISearchUser extends IPagination {
  query: string;
}

export interface IChangeRole {
  userId: number;
  role: Role;
}

export interface IUpdateUser {
  userId: number;
  username?: string;
  mobile?: string;
  lastPasswordChange?: Date;
  password?: string;
}

export interface IGetUserByArgs {
  mobile?: string;
  username?: string;
}

export interface IUsersFilter extends IPagination {
  username?: string;
  role?: Role;
  mobile?: string;
  lastPasswordChange?: Date;
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'username' | 'createdAt' | 'mobile' | 'updateAt';
  sortDirection?: 'asc' | 'desc';
}
