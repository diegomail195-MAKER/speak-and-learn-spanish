import { redirect } from "next/navigation";

// Grades are managed in Platform Admin › Settings.
export default function AdminGrades() {
  redirect("/admin/settings");
}
