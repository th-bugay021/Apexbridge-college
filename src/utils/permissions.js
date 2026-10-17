const permissions = {
  SUPER_ADMIN: ["*"],

  ADMIN: [
    "users.view",
    "users.create",
    "users.update",
    "students.view",
    "students.create",
    "students.update",
    "teachers.view",
    "teachers.create",
    "teachers.update",
  ],

  TEACHER: [
    "students.view",
    "attendance.view",
    "attendance.manage",
    "results.view",
  ],

  STUDENT: [
    "results.view",
    "attendance.view",
  ],

  PARENT: [
    "results.view",
    "attendance.view",
  ],

  ACCOUNTANT: [
    "fees.view",
    "payments.view",
    "payments.create",
  ],
};

export default permissions;