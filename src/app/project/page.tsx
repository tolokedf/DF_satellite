import ProjectWorkspace from "@/components/project/ProjectWorkspace";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Project | DF satellite",
  description: "Project management, Open Actions, Milestones, and Issues",
};

export default function ProjectPage() {
  return <ProjectWorkspace />;
}
