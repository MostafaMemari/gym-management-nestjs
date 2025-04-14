type PermissionSeedGroup = {
  name: string;
  permissions: {
    method: string;
    endpoint: string;
  }[];
};

const ROLES = [{ name: 'SUPER_ADMIN' }, { name: 'ADMIN_CLUB' }, { name: 'COACH' }, { name: 'STUDENT' }];

const CLUB_PERMISSIONS: PermissionSeedGroup = {
  name: 'CLUB',
  permissions: [{ endpoint: '/clubs', method: 'GET' }],
};

const STUDENT_PERMISSIONS: PermissionSeedGroup = {
  name: 'STUDENT',
  permissions: [{ endpoint: '/students', method: 'GET' }],
};

const COACH_PERMISSIONS: PermissionSeedGroup = {
  name: 'COACH',
  permissions: [{ endpoint: '/coaches', method: 'GET' }],
};

const SUPER_ADMIN_PERMISSIONS: PermissionSeedGroup = {
  name: 'SUPER_ADMIN',
  permissions: [{ endpoint: '/coaches', method: 'GET' }],
};
