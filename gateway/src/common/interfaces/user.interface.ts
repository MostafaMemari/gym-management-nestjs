import { Role } from '../enums/role.enum';
import { SignupDto } from '../dtos/auth-service/auth.dto';

export interface User extends Omit<SignupDto, 'password' | 'confirmPassword'> {
  id: number;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}
