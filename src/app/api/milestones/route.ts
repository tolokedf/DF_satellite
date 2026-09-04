import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Auto-seed initial milestones if table is empty
    const count = await prisma.milestone.count();
    if (count === 0) {
      const projects = await prisma.project.findMany({ take: 4 });
      const p1 = projects[0]?.id || null;
      const p2 = projects[1]?.id || null;
      const p3 = projects[2]?.id || null;
      const p4 = projects[3]?.id || null;

      await prisma.milestone.createMany({
        data: [
          {
            name: "Factory Acceptance Test (FAT)",
            assignee: user.name || "engineer 1",
            dueDate: new Date("2026-08-20T00:00:00.000Z"),
            actualCompletionDate: new Date("2026-08-20T00:00:00.000Z"),
            status: "COMPLETED",
            projectId: p1,
            notes: "FAT completed and approved with customer QA.",
          },
          {
            name: "Site Delivery & Mechanical Rigging",
            assignee: "Ir. Razak",
            dueDate: new Date("2026-08-25T00:00:00.000Z"),
            actualCompletionDate: new Date("2026-08-27T00:00:00.000Z"),
            status: "COMPLETED",
            projectId: p1,
            notes: "Dock crane availability delayed delivery by 2 days.",
          },
          {
            name: "AGV Magnetic & Laser SLAM Mapping",
            assignee: user.name || "engineer 1",
            dueDate: new Date("2026-08-30T00:00:00.000Z"),
            actualCompletionDate: new Date("2026-09-02T00:00:00.000Z"),
            status: "COMPLETED",
            projectId: p1,
            notes: "SLAM grid re-calibrated after plant layout update.",
          },
          {
            name: "PLC & Conveyor Handshake Interlock",
            assignee: "Chong W.K.",
            dueDate: new Date("2026-09-02T00:00:00.000Z"),
            actualCompletionDate: null,
            status: "DELAYED",
            projectId: p3,
            notes: "Waiting for Siemens PLC IO card replacement from customer.",
          },
          {
            name: "Fleet Manager / NavWiz Route Configuration",
            assignee: user.name || "engineer 1",
            dueDate: new Date("2026-09-08T00:00:00.000Z"),
            actualCompletionDate: null,
            status: "IN_PROGRESS",
            projectId: p4,
            notes: "Configuring multi-AGV intersection priority and deadlock prevention.",
          },
          {
            name: "Site Acceptance Test (SAT)",
            assignee: "Ir. Razak",
            dueDate: new Date("2026-09-15T00:00:00.000Z"),
            actualCompletionDate: null,
            status: "IN_PROGRESS",
            projectId: p1,
            notes: "48-hour continuous payload endurance test scheduled.",
          },
          {
            name: "SOP Training & Customer Handover",
            assignee: "Nurul Aina",
            dueDate: new Date("2026-09-22T00:00:00.000Z"),
            actualCompletionDate: null,
            status: "IN_PROGRESS",
            projectId: p2,
            notes: "Preparing training manuals and operator emergency checklists.",
          },
        ],
      });
    }

    const milestones = await prisma.milestone.findMany({
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json(milestones);
  } catch (error: any) {
    console.error("Error fetching milestones:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ENGINEER" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name, assignee, dueDate, actualCompletionDate, projectId, notes, status } = body;

    if (!name || !assignee || !dueDate) {
      return NextResponse.json(
        { error: "Name, assignee, and due date are required" },
        { status: 400 }
      );
    }

    const newMilestone = await prisma.milestone.create({
      data: {
        name,
        assignee,
        dueDate: new Date(dueDate),
        actualCompletionDate: actualCompletionDate ? new Date(actualCompletionDate) : null,
        projectId: projectId || null,
        status: status || (actualCompletionDate ? "COMPLETED" : "IN_PROGRESS"),
        notes: notes || null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json(newMilestone, { status: 201 });
  } catch (error: any) {
    console.error("Error creating milestone:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
