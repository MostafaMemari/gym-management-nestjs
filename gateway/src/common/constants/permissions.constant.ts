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
  STUDENT = 'STUDENT',
  NONE_ROLE = 'NONE_ROLE',
}

export enum ApiRoutes {
  CLUB = 'CLUB',
  STUDENT = 'STUDENT',
  COACH = 'COACH',
  USER = 'USER',
  ROLE = 'ROLE',
}

export enum AllowHttpMethods {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

const PERMISSION_GROUP: PermissionGroup[] = [
  {
    name: ApiRoutes.CLUB,
    permissions: [
      { endpoint: '/clubs', method: AllowHttpMethods.GET, roles: [DefaultRole.ADMIN_CLUB, DefaultRole.SUPER_ADMIN] },
      { endpoint: '/clubs/:id', method: AllowHttpMethods.PUT, roles: [DefaultRole.ADMIN_CLUB, DefaultRole.SUPER_ADMIN] },
    ],
  },
  {
    name: ApiRoutes.STUDENT,
    permissions: [{ endpoint: '/students', method: AllowHttpMethods.GET, roles: [DefaultRole.STUDENT, DefaultRole.SUPER_ADMIN] }],
  },
  {
    name: ApiRoutes.COACH,
    permissions: [{ endpoint: '/coaches', method: AllowHttpMethods.GET, roles: [DefaultRole.COACH, DefaultRole.SUPER_ADMIN] }],
  },
  {
    name: ApiRoutes.USER,
    permissions: [
      {
        endpoint: '/user',
        method: AllowHttpMethods.GET,
        roles: [DefaultRole.SUPER_ADMIN],
      },
      {
        endpoint: '/user:id',
        method: AllowHttpMethods.GET,
        roles: [DefaultRole.SUPER_ADMIN],
      },
      {
        endpoint: '/user/profile',
        method: AllowHttpMethods.GET,
        roles: [DefaultRole.NONE_ROLE],
      },
      {
        endpoint: '/user/profile',
        method: AllowHttpMethods.PUT,
        roles: [DefaultRole.NONE_ROLE],
      },
      {
        endpoint: '/user/:id',
        method: AllowHttpMethods.DELETE,
        roles: [DefaultRole.SUPER_ADMIN],
      },
    ],
  },
  {
    name: ApiRoutes.ROLE,
    permissions: [
      {
        method: AllowHttpMethods.GET,
        endpoint: '/role/sync',
        roles: [DefaultRole.NONE_ROLE],
      },
      {
        method: AllowHttpMethods.POST,
        endpoint: '/role',
        roles: [DefaultRole.SUPER_ADMIN],
      },
      {
        method: AllowHttpMethods.GET,
        endpoint: '/role',
        roles: [DefaultRole.SUPER_ADMIN],
      },
      {
        method: AllowHttpMethods.GET,
        endpoint: '/role/permissions',
        roles: [DefaultRole.SUPER_ADMIN],
      },
      {
        method: AllowHttpMethods.GET,
        endpoint: '/role/:id',
        roles: [DefaultRole.SUPER_ADMIN],
      },
      {
        method: AllowHttpMethods.PUT,
        endpoint: '/role/:id',
        roles: [DefaultRole.SUPER_ADMIN],
      },
      {
        method: AllowHttpMethods.DELETE,
        endpoint: '/role/:id',
        roles: [DefaultRole.SUPER_ADMIN],
      },
      {
        method: AllowHttpMethods.GET,
        endpoint: '/role/permission/:id',
        roles: [DefaultRole.SUPER_ADMIN],
      },
      {
        method: AllowHttpMethods.PUT,
        endpoint: '/role/assign-permission',
        roles: [DefaultRole.SUPER_ADMIN],
      },
      {
        method: AllowHttpMethods.PUT,
        endpoint: '/role/assign-role',
        roles: [DefaultRole.SUPER_ADMIN],
      },
      {
        method: AllowHttpMethods.PUT,
        endpoint: '/role/unassign-role',
        roles: [DefaultRole.SUPER_ADMIN],
      },
      {
        method: AllowHttpMethods.PUT,
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
