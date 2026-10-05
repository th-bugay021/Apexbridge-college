const navigationConfig = [
  {
    label: "Dashboard",
    path: "/dashboard",
  },
  {
    label: "Students",
    path: "/students",
  },
  {
    label: "Teachers",
    path: "/teachers",
  },
  {
    label: "Parents",
    path: "/parents",
  },
  {
    label: "Academics",
    children: [
      {
        label: "Classes",
        path: "/classes",
      },
      {
        label: "Subjects",
        path: "/subjects",
      },
      {
        label: "Attendance",
        path: "/attendance",
      },
    ],
  },
  {
    label: "Examinations",
    path: "/examinations",
  },
  {
    label: "Results",
    path: "/results",
  },
  {
    label: "Finance",
    children: [
      {
        label: "Fees",
        path: "/fees",
      },
      {
        label: "Payments",
        path: "/payments",
      },
    ],
  },
  {
    label: "Settings",
    path: "/settings",
  },
];

export default navigationConfig;