export default function apiErrorMessage(error, resource = "this information") {
  const status = error?.response?.status;
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have permission to view or change this information.";
  if (status === 404) return "This record could not be found. It may have been removed.";
  return error?.response?.data?.error?.message || `Could not load ${resource}. Please try again.`;
}
