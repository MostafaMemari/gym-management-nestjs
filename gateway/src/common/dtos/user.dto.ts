import { Role } from '../enums/role.enum';
import { SignupDto } from './auth.dto';

export interface User extends Omit<SignupDto, 'password' | 'confirmPassword'> {
  id: number;
  role: Role
  createdAt: Date;
  updatedAt: Date;
}
