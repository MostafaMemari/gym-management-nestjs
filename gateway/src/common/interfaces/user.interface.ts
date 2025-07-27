import { Role } from '../enums/auth-user-service/role.enum';
import { SignupDto } from '../dtos/auth-service/auth.dto';

export interface User extends Omit<SignupDto, 'password' | 'confirmPassword'> {
  id: number;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}
