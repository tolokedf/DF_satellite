import MyRoleView from "@/components/engineer/MyRoleView";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My role | DF satellite",
  description: "Milestones, delivery schedules, and delay tracking for Engineers",
};

export default async function MyRolePage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ENGINEER") {
    redirect("/feed");
  }

  return <MyRoleView currentUser={user} />;
}
