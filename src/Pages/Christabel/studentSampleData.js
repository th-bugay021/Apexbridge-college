import { classLabel } from "../../config/school";

// Replace with the paginated students API when its handlers are implemented.
export const studentSampleData = [
  { id: "student-1001", studentId: "STU-1001", firstName: "Tobi", lastName: "Okafor", email: "tobi@scholar.edu", phone: "+44 7700 900101", birthDate: "2010-04-12", gender: "Male", address: "12 Kensington Park Road, Notting Hill, London", department: "Science", className: classLabel(10), admissionDate: "2024-09-02", status: "Active", photo: "", guardianIds: ["guardian-1", "guardian-3"] },
  { id: "student-1002", studentId: "STU-1002", firstName: "Ada", lastName: "Okafor", email: "ada@scholar.edu", phone: "+44 7700 900102", birthDate: "2012-08-23", gender: "Female", address: "12 Kensington Park Road, Notting Hill, London", department: "Arts", className: classLabel(8), admissionDate: "2024-09-02", status: "Active", photo: "", guardianIds: ["guardian-1", "guardian-3"] },
  { id: "student-1003", studentId: "STU-1003", firstName: "Kemi", lastName: "Adeyemi", email: "kemi@scholar.edu", phone: "+44 7700 900103", birthDate: "2009-02-15", gender: "Female", address: "24 Camden High Street, Camden, London", department: "Science", className: classLabel(11), admissionDate: "2023-09-04", status: "Active", photo: "", guardianIds: ["guardian-4"] },
  { id: "student-1004", studentId: "STU-1004", firstName: "David", lastName: "Eze", email: "david@scholar.edu", phone: "+44 7700 900104", birthDate: "2011-11-30", gender: "Male", address: "8 Bermondsey Street, Southwark, London", department: "Business", className: classLabel(9), admissionDate: "2023-09-04", status: "Inactive", photo: "", guardianIds: ["guardian-2"] },
  { id: "student-1005", studentId: "STU-1005", firstName: "Grace", lastName: "Adeyemi", email: "grace@scholar.edu", phone: "+44 7700 900105", birthDate: "2008-01-07", gender: "Female", address: "24 Camden High Street, Camden, London", department: "Arts", className: classLabel(12), admissionDate: "2022-09-05", status: "Graduated", photo: "", guardianIds: ["guardian-4"] },
  { id: "student-1006", studentId: "STU-1006", firstName: "Yusuf", lastName: "Bello", email: "yusuf@scholar.edu", phone: "+44 7700 900106", birthDate: "2013-06-19", gender: "Male", address: "5 Palmers Green, Enfield, London", department: "General", className: classLabel(7), admissionDate: "2025-09-01", status: "Active", photo: "", guardianIds: [] },
];

// Replace with the paginated parents API and parent-student assignments API.
export const guardianSampleData = [
  { id: "guardian-1", firstName: "Amara", lastName: "Okafor", relationship: "Mother", email: "amara.okafor@example.com", phone: "+44 7700 900111", occupation: "Doctor", address: "12 Kensington Park Road, Notting Hill, London" },
  { id: "guardian-2", firstName: "Bola", lastName: "Eze", relationship: "Guardian", email: "bola.eze@example.com", phone: "+44 7700 900112", occupation: "Teacher", address: "8 Bermondsey Street, Southwark, London" },
  { id: "guardian-3", firstName: "Chinedu", lastName: "Okafor", relationship: "Father", email: "chinedu.okafor@example.com", phone: "+44 7700 900113", occupation: "Engineer", address: "12 Kensington Park Road, Notting Hill, London" },
  { id: "guardian-4", firstName: "Funke", lastName: "Adeyemi", relationship: "Mother", email: "funke.adeyemi@example.com", phone: "+44 7700 900114", occupation: "Accountant", address: "24 Camden High Street, Camden, London" },
];
