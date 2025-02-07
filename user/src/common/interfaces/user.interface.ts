import { Role } from "@prisma/client";

export interface ICreateUser {
  username: string;

  email?: string;

  password?: string;

  mobile?: string;
}

export interface ICreateUserStudent {
  username: string;
  role?: Role;
}


export interface IPagination {
  count?: number
  page?: number
}