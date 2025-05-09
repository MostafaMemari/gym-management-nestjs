import { DefaultRole } from '../constants/permissions.constant';
import { SignupDto } from '../dtos/auth.dto';

interface IRole {
  name: DefaultRole;
  permissions: IPermission[];
}

interface IPermission {
  method: string;
  endpoint: string;
}

export interface User extends Omit<SignupDto, 'password' | 'confirmPassword'> {
  id: number;
  roles: IRole[];
  username: string;
  mobile: string;
  isVerifiedMobile: boolean;
  createdAt: Date;
  updatedAt: Date;
}
