import { Role } from '../enums/role.enum';

export interface IUser {
  id: number;
  role: Role;
  username?: string;
  mobile?: string;
  createdAt?: string;
  updatedAt?: string;
}
