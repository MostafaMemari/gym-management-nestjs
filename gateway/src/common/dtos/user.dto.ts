import { SignupDto } from './auth.dto';

export interface User extends Omit<SignupDto, 'password' | 'confirmPassword'> {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}
