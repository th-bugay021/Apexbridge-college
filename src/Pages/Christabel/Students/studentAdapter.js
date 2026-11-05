const genderFromApi = { MALE: 'Male', FEMALE: 'Female', OTHER: 'Other' };
const genderToApi = { Male: 'MALE', Female: 'FEMALE', Other: 'OTHER' };
const statusFromApi = { ACTIVE: 'Active', INACTIVE: 'Inactive', GRADUATED: 'Graduated' };
const statusToApi = { Active: 'ACTIVE', Inactive: 'INACTIVE', Graduated: 'GRADUATED' };

export const genderValueToApi = (value) => genderToApi[value];
export const statusValueToApi = (value) => statusToApi[value];

export function dateInputValue(value) {
  if (!value) return '';
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
}

export function classDisplayName(classItem) {
  if (!classItem) return '';
  return [classItem.name, classItem.level].filter(Boolean).join(' · ');
}

export function studentFromApi(student, guardianIds = []) {
  const fullNameParts = (student.user?.fullName || '').trim().split(/\s+/).filter(Boolean);
  return {
    id: student.id,
    studentId: student.admissionNumber,
    firstName: student.firstName || fullNameParts[0] || '',
    lastName: student.lastName || fullNameParts.slice(1).join(' '),
    birthDate: dateInputValue(student.dateOfBirth),
    gender: genderFromApi[student.gender] || '',
    email: student.user?.email || '',
    phone: student.user?.phone || '',
    address: student.address || '',
    department: student.department || '',
    classId: student.classId || '',
    className: classDisplayName(student.class),
    admissionDate: dateInputValue(student.admissionDate),
    status: statusFromApi[student.status] || 'Active',
    photo: student.photoUrl || '',
    guardianIds,
  };
}

export function studentToApi(values, { creating = false } = {}) {
  const result = {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim(),
    phone: values.phone.trim() || null,
    admissionNumber: values.studentId.trim() || undefined,
    gender: genderToApi[values.gender],
    photoUrl: values.photo.trim() || null,
    department: values.department.trim() || null,
    admissionDate: values.admissionDate || null,
    dateOfBirth: values.birthDate || null,
    address: values.address.trim() || null,
    classId: values.classId || null,
    status: statusToApi[values.status],
  };
  if (creating) result.password = values.password;
  return result;
}

export function guardianFromApi(parent) {
  const parts = (parent.user?.fullName || '').trim().split(/\s+/).filter(Boolean);
  return {
    id: parent.id,
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
    fullName: parent.user?.fullName || '',
    relationship: parent.relationship || '',
    email: parent.user?.email || '',
    phone: parent.user?.phone || '',
    occupation: parent.occupation || '',
    address: parent.address || '',
    students: parent.students || [],
  };
}

export function studentApiErrorMessage(error) {
  const apiError = error.response?.data?.error;
  if (apiError?.code === 'EMAIL_EXISTS') return 'That email address is already in use. Enter a different email.';
  if (apiError?.code === 'ADMISSION_NUMBER_EXISTS') return 'That student ID is already in use. Enter a different student ID.';
  if (apiError?.code === 'CLASS_NOT_FOUND') return 'The selected class could not be found. Choose an existing class.';
  if (apiError?.code === 'STUDENT_HAS_LINKED_RECORDS') {
    return /inactive/i.test(apiError.message || '') ? apiError.message : `${apiError.message} Set the student’s status to Inactive instead of deleting them.`;
  }
  return apiError?.message || error.message || 'The student request could not be completed.';
}
