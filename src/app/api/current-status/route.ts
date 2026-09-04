import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const team = searchParams.get("team") || "dfa";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`http://192.168.0.148:8090/api/field?team=${encodeURIComponent(team)}`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ ...data, source: "live_fa" });
    }
  } catch (err: any) {
    console.warn("Could not reach 192.168.0.148:8090, falling back to local database:", err.message);
  }

  // Fallback: synthesize FA structure from local Prisma database
  try {
    const localProjects = await prisma.project.findMany({
      include: {
        company: true,
        site: { include: { robots: true } },
        actionItems: true,
        issues: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const tasks: any[] = [];
    localProjects.forEach((p) => {
      p.actionItems.forEach((a) => {
        tasks.push({
          gid: a.id,
          name: a.title,
          completed: a.status === "DONE",
          due_on: a.targetDate ? a.targetDate.toISOString().split("T")[0] : null,
          assignee: a.owner ? { name: a.owner, email: `${a.owner.toLowerCase().replace(/\s+/g, ".")}@dfautomation.com` } : null,
          project: { gid: p.id, name: p.name },
          custom_fields: [
            { name: "Priority", display_value: a.priority },
            { name: "Task Progress", display_value: a.status },
            { name: "Weightage (Hour)", number_value: 8 },
          ],
        });
      });
      p.issues.forEach((i) => {
        tasks.push({
          gid: i.id,
          name: `[Issue] ${i.title}`,
          completed: i.status === "CLOSED",
          due_on: i.createdAt.toISOString().split("T")[0],
          assignee: { name: p.leadEngineer, email: "lead@dfautomation.com" },
          project: { gid: p.id, name: p.name },
          custom_fields: [
            { name: "Priority", display_value: i.severity },
            { name: "Task Progress", display_value: i.status },
            { name: "Weightage (Hour)", number_value: 4 },
          ],
        });
      });
    });

    const fallbackData = {
      team: team.toLowerCase(),
      label: team.toUpperCase(),
      sublabel: team === "dfa" ? "Malaysia Team" : "India Team",
      source: "local_satellite_db",
      generatedAt: new Date().toISOString(),
      projects: localProjects.map((p) => ({
        gid: p.id,
        name: p.name,
        code: p.code,
        due_on: p.targetGoLive ? p.targetGoLive.toISOString().split("T")[0] : null,
        company: p.company.name,
        site: p.site.name,
        robotsCount: p.site.robots.length,
      })),
      tasks,
      leave: { roster: [], entries: [] },
    };

    return NextResponse.json(fallbackData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
