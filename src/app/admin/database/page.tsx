import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import AdminConsole from "@/components/admin/AdminConsole";

export default async function AdminDatabasePage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/feed");
  }
  return <AdminConsole />;
}
