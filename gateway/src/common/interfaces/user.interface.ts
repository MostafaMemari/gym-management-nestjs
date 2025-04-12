import { Role } from '../enums/role.enum';
import { SignupDto } from '../dtos/auth-service/auth.dto';

interface IRole {
  name: Role;
  permissions: IPermission[];
}

interface IPermission {
  method: string;
  endpoint: string;
}

export interface User extends Omit<SignupDto, 'password' | 'confirmPassword'> {
  id: number;
  roles: IRole[];
  createdAt: Date;
  updatedAt: Date;
}
