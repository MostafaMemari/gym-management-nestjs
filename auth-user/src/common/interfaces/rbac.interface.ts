import { Role } from '@prisma/client';

export interface IAssignRole {
  userId: number;
  role: Role;
}
