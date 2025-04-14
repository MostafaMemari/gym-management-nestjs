import { RequestMethod } from '@nestjs/common';

type PermissionGroup = {
  name: ApiRoutes;
  permissions: {
    method: RequestMethod;
    endpoint: string;
    roles: DefaultRole[];
  }[];
};

export enum DefaultRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN_CLUB = 'ADMIN_CLUB',
  COACH = 'COACH',
  STUDENT = 'STUDENT',
}

export enum ApiRoutes {
  CLUB = 'CLUB',
  STUDENT = 'STUDENT',
  COACH = 'COACH',
}

export const PERMISSION_GROUP: PermissionGroup[] = [
  {
    name: ApiRoutes.CLUB,
    permissions: [{ endpoint: '/clubs', method: RequestMethod.GET, roles: [DefaultRole.ADMIN_CLUB] }],
  },
  {
    name: ApiRoutes.STUDENT,
    permissions: [{ endpoint: '/students', method: RequestMethod.GET, roles: [DefaultRole.STUDENT] }],
  },
  {
    name: ApiRoutes.COACH,
    permissions: [{ endpoint: '/coaches', method: RequestMethod.GET, roles: [DefaultRole.COACH] }],
  },
];
