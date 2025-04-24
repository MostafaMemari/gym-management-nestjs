import { RequestHttpMethod } from '../enums/shared.enum';

type PermissionGroup = {
  name: ApiRoutes;
  permissions: {
    method: string;
    endpoint: string;
    roles: DefaultRole[];
  }[];
};

export enum DefaultRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN_CLUB = 'ADMIN_CLUB',
  COACH = 'COACH',
  GUEST = 'GUEST',
  STUDENT = 'STUDENT',
}

export enum ApiRoutes {
  CLUB = 'CLUB',
  STUDENT = 'STUDENT',
  COACH = 'COACH',
  USER = 'USER',
  ROLE = 'ROLE',
}

const getAllDefaultRoles = (): DefaultRole[] => {
  const roles = [];
  for (const role in DefaultRole) {
    roles.push(DefaultRole[role]);
  }

  return roles;
};

const PERMISSION_GROUP: PermissionGroup[] = [
  {
    name: ApiRoutes.CLUB,
    permissions: [
      { endpoint: '/clubs', method: RequestHttpMethod.GET, roles: [DefaultRole.ADMIN_CLUB, DefaultRole.SUPER_ADMIN] },
      { endpoint: '/clubs/:id', method: RequestHttpMethod.PUT, roles: [DefaultRole.ADMIN_CLUB, DefaultRole.SUPER_ADMIN] },
    ],
  },
  {
    name: ApiRoutes.STUDENT,
    permissions: [{ endpoint: '/students', method: RequestHttpMethod.GET, roles: [DefaultRole.STUDENT, DefaultRole.SUPER_ADMIN] }],
  },
  {
    name: ApiRoutes.COACH,
    permissions: [{ endpoint: '/coaches', method: RequestHttpMethod.GET, roles: [DefaultRole.COACH, DefaultRole.SUPER_ADMIN] }],
  },
  {
    name: ApiRoutes.USER,
    permissions: [
      {
        endpoint: '/user',
        method: RequestHttpMethod.GET,
        roles: [DefaultRole.SUPER_ADMIN],
      },
      {
        endpoint: '/user:id',
        method: RequestHttpMethod.GET,
        roles: [DefaultRole.SUPER_ADMIN],
      },
      {
        endpoint: '/user/profile',
        method: RequestHttpMethod.GET,
        roles: getAllDefaultRoles(),
      },
      {
        endpoint: '/user/profile',
        method: RequestHttpMethod.PUT,
        roles: getAllDefaultRoles(),
      },
      {
        endpoint: '/user/:id',
        method: RequestHttpMethod.DELETE,
        roles: [DefaultRole.SUPER_ADMIN],
      },
    ],
  },
  {
    name: ApiRoutes.ROLE,
    permissions: [
      {
        method: RequestHttpMethod.GET,
        endpoint: '/role/sync',
        roles: getAllDefaultRoles(),
      },
      {
        method: RequestHttpMethod.POST,
        endpoint: '/role',
        roles: [DefaultRole.SUPER_ADMIN],
      },
      {
        method: RequestHttpMethod.GET,
        endpoint: '/role',
        roles: [DefaultRole.SUPER_ADMIN],
      },
      {
        method: RequestHttpMethod.GET,
        endpoint: '/role/permissions',
        roles: [DefaultRole.SUPER_ADMIN],
      },
      {
        method: RequestHttpMethod.GET,
        endpoint: '/role/:id',
        roles: [DefaultRole.SUPER_ADMIN],
      },
      {
        method: RequestHttpMethod.PUT,
        endpoint: '/role/:id',
        roles: [DefaultRole.SUPER_ADMIN],
      },
      {
        method: RequestHttpMethod.DELETE,
        endpoint: '/role/:id',
        roles: [DefaultRole.SUPER_ADMIN],
      },
      {
        method: RequestHttpMethod.GET,
        endpoint: '/role/permission/:id',
        roles: [DefaultRole.SUPER_ADMIN],
      },
      {
        method: RequestHttpMethod.PUT,
        endpoint: '/role/assign-permission',
        roles: [DefaultRole.SUPER_ADMIN],
      },
      {
        method: RequestHttpMethod.PUT,
        endpoint: '/role/assign-role',
        roles: [DefaultRole.SUPER_ADMIN],
      },
      {
        method: RequestHttpMethod.PUT,
        endpoint: '/role/unassign-role',
        roles: [DefaultRole.SUPER_ADMIN],
      },
      {
        method: RequestHttpMethod.PUT,
        endpoint: '/role/unassign-permission',
        roles: [DefaultRole.SUPER_ADMIN],
      },
    ],
  },
];

type RolePermissionMap = {
  role: DefaultRole;
  permissions: { method: string; endpoint: string }[];
};

const roleMap = new Map<DefaultRole, { method: string; endpoint: string }[]>();

for (const group of PERMISSION_GROUP) {
  for (const permission of group.permissions) {
    for (const role of permission.roles) {
      const currentPermissions = roleMap.get(role) || [];
      currentPermissions.push({
        method: permission.method,
        endpoint: permission.endpoint,
      });
      roleMap.set(role, currentPermissions);
    }
  }
}

export const staticRoles: RolePermissionMap[] = Array.from(roleMap.entries()).map(([role, permissions]) => {
  return {
    role,
    permissions,
  };
});
