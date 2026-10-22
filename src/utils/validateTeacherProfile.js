const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function validateTeacherProfile(values) {
  if (!values.fullName.trim()) return "Name is required.";
  if (values.fullName.trim().length > 150) return "Name must be 150 characters or fewer.";
  if (!emailPattern.test(values.email.trim())) return "Enter a valid email address.";
  if (values.phone.length > 30) return "Phone must be 30 characters or fewer.";
  if (values.address.length > 500) return "Address must be 500 characters or fewer.";
  return "";
}
