import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import TaskOverviewView from "@/components/task-overview/TaskOverviewView";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Task Overview | DF satellite",
  description: "Unified overview of all project actions, milestones, and issues",
};

export default async function TaskOverviewPage() {
  const user = await getSessionUser();
  if (!user || user.role === "CUSTOMER") {
    redirect("/feed");
  }
  return <TaskOverviewView />;
}
