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
  userId: number
  role: Role
}