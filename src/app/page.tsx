import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getSessionUser();

  if (user?.role === "CUSTOMER") {
    redirect("/portal/log-stop");
  }

  // Default to portfolio overview
  redirect("/portfolio");
}
