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
}

export enum ApiRoutes {
  CLUB = 'CLUB',
  STUDENT = 'STUDENT',
  COACH = 'COACH',
}

const PERMISSION_GROUP: PermissionGroup[] = [
  {
    name: ApiRoutes.CLUB,
    permissions: [
      { endpoint: '/clubs', method: `GET`, roles: [DefaultRole.ADMIN_CLUB, DefaultRole.SUPER_ADMIN] },
      { endpoint: '/clubs/:id', method: `PUT`, roles: [DefaultRole.ADMIN_CLUB, DefaultRole.SUPER_ADMIN] },
    ],
  },
  {
    name: ApiRoutes.STUDENT,
    permissions: [{ endpoint: '/students', method: `GET`, roles: [DefaultRole.STUDENT, DefaultRole.SUPER_ADMIN] }],
  },
  {
    name: ApiRoutes.COACH,
    permissions: [{ endpoint: '/coaches', method: `GET`, roles: [DefaultRole.COACH, DefaultRole.SUPER_ADMIN] }],
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
