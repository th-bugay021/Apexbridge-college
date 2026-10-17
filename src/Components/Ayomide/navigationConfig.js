import {
  FiHome,
  FiUsers,
  FiUser,
  FiBookOpen,
  FiGrid,
  FiBook,
  FiClipboard,
  FiFileText,
  FiDollarSign,
  FiCreditCard,
  FiSettings,
} from "react-icons/fi";

const navigationConfig = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: FiHome,
  },

  {
    label: "Students",
    path: "/students",
    icon: FiUsers,
    permission: "students.view",
  },

  {
    label: "Teachers",
    path: "/teachers",
    icon: FiUser,
    permission: "teachers.view",
  },

  {
    label: "Parents",
    path: "/parents",
    icon: FiUsers,
    permission: "parents.view",
  },

  {
    label: "Academics",
    icon: FiBookOpen,
    children: [
      {
        label: "Classes",
        path: "/classes",
        icon: FiGrid,
        permission: "classes.view",
      },
      {
        label: "Subjects",
        path: "/subjects",
        icon: FiBook,
        permission: "subjects.view",
      },
      {
        label: "Attendance",
        path: "/attendance",
        icon: FiClipboard,
        permission: "attendance.view",
      },
    ],
  },

  {
    label: "Examinations",
    path: "/examinations",
    icon: FiFileText,
    permission: "examinations.view",
  },

  {
    label: "Results",
    path: "/results",
    icon: FiFileText,
    permission: "results.view",
  },

  {
    label: "Finance",
    icon: FiDollarSign,
    children: [
      {
        label: "Fees",
        path: "/fees",
        icon: FiDollarSign,
        permission: "fees.view",
      },
      {
        label: "Payments",
        path: "/payments",
        icon: FiCreditCard,
        permission: "payments.view",
      },
    ],
  },

  {
    label: "Settings",
    path: "/settings",
    icon: FiSettings,
  },
];

export default navigationConfig;