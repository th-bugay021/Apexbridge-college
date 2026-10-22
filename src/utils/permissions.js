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
    "classes.view",
    "classes.manage",
    "subjects.view",
    "subjects.manage",
    "attendance.access",
  ],

  TEACHER: [
    "students.view",
    "attendance.view",
    "attendance.manage",
    "results.view",
    "classes.view",
    "attendance.access",
    "timetable.view.own",
  ],

  STUDENT: [
    "results.view",
    "attendance.view",
    "attendance.access",
    "classes.view",
    "timetable.view.own",
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
