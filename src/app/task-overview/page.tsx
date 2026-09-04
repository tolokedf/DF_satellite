import TaskOverviewView from "@/components/task-overview/TaskOverviewView";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Task Overview | DF satellite",
  description: "Unified overview of all project actions, milestones, and issues",
};

export default function TaskOverviewPage() {
  return <TaskOverviewView />;
}
