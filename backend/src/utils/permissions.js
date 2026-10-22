// Keep this role map aligned with src/utils/permissions.js in the frontend.
export const permissions = {
  SUPER_ADMIN: ['*'],
  ADMIN: [
    'users.view', 'users.create', 'users.update',
    'students.view', 'students.create', 'students.update',
    'teachers.view', 'teachers.create', 'teachers.update',
    'classes.view', 'classes.manage',
    'subjects.view', 'subjects.manage', 'attendance.view', 'attendance.manage',
    'timetable.view', 'timetable.manage', 'results.manage', 'invites.create',
  ],
  TEACHER: ['students.view', 'attendance.view', 'attendance.manage', 'results.view', 'results.manage', 'classes.view', 'classes.view.own', 'subjects.view', 'teachers.view.own', 'teachers.update.own', 'timetable.view', 'timetable.view.own'],
  STUDENT: ['results.view', 'classes.view.own', 'timetable.view.own'],
  PARENT: ['results.view', 'attendance.view'],
  ACCOUNTANT: ['fees.view', 'payments.view', 'payments.create'],
};

export const permissionsForRole = (role) => permissions[role] ?? [];
export const hasPermission = (role, permission) => {
  const rolePermissions = permissionsForRole(role);
  return rolePermissions.includes('*') || rolePermissions.includes(permission);
};
