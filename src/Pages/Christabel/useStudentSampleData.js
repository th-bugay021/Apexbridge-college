import { useContext } from "react";
import StudentSampleContext from "./studentSampleContextStore";

export default function useStudentSampleData() {
  const context = useContext(StudentSampleContext);
  if (!context) throw new Error("useStudentSampleData must be used within StudentSampleProvider");
  return context;
}
