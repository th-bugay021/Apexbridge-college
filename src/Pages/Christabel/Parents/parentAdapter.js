export function parentFromApi(parent) {
  const fullName = (parent.user?.fullName || '').trim();
  const firstSpace = fullName.indexOf(' ');
  return {
    id: parent.id,
    firstName: firstSpace === -1 ? fullName : fullName.slice(0, firstSpace),
    lastName: firstSpace === -1 ? '' : fullName.slice(firstSpace + 1).trim(),
    fullName,
    email: parent.user?.email || '',
    phone: parent.user?.phone || '',
    relationship: parent.relationship || '',
    occupation: parent.occupation || '',
    address: parent.address || '',
    students: (parent.students || []).map((student) => ({
      id: student.id,
      studentId: student.admissionNumber,
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      className: student.class ? [student.class.name, student.class.level].filter(Boolean).join(' · ') : 'No class assigned',
    })),
  };
}

export function parentToApi(values, { creating = false } = {}) {
  const result = {
    fullName: `${values.firstName.trim()} ${values.lastName.trim()}`.trim(),
    email: values.email.trim(),
    phone: values.phone.trim() || null,
    relationship: values.relationship.trim() || null,
    occupation: values.occupation.trim() || null,
    address: values.address.trim() || null,
  };
  if (creating) result.password = values.password;
  return result;
}

export function parentApiErrorMessage(error) {
  const apiError = error.response?.data?.error;
  if (apiError?.code === 'EMAIL_EXISTS') return 'That email address is already in use. Enter a different email.';
  return apiError?.message || error.message || 'The parent request could not be completed.';
}

export function parentStudentFromApi(student) {
  return {
    id: student.id,
    studentId: student.admissionNumber || '',
    firstName: student.firstName || '',
    lastName: student.lastName || '',
    className: student.class ? [student.class.name, student.class.level].filter(Boolean).join(' · ') : 'No class assigned',
  };
}
