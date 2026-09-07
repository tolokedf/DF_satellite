import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const myTasks = searchParams.get("myTasks");

    if (myTasks === "true") {
      const tasks = await prisma.projectTask.findMany({
        where: {
          OR: [
            { assignee: { contains: user.name } },
            { assignee: { contains: user.username } },
          ],
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
        orderBy: [{ isDone: "asc" }, { dueDate: "asc" }],
      });
      return NextResponse.json(tasks);
    }

    if (projectId) {
      if (user.role === "CUSTOMER") {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { siteId: true },
        });
        if (!project || !project.siteId || !user.assignedSiteIds.includes(project.siteId)) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
      }

      const tasks = await prisma.projectTask.findMany({
        where: { projectId },
        orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
      });
      return NextResponse.json(tasks);
    }

    const where: any = {};
    if (user.role === "CUSTOMER") {
      where.project = {
        siteId: { in: user.assignedSiteIds },
      };
    }

    const tasks = await prisma.projectTask.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: [{ isDone: "asc" }, { dueDate: "asc" }],
    });

    return NextResponse.json(tasks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (user?.role !== "ADMIN" && user?.role !== "ENGINEER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { projectId, section, event, assignee, dueDate, actualFinishedDate, delayNote, isDone } = body;

    if (!projectId || !section || !event) {
      return NextResponse.json(
        { error: "projectId, section, and event are required" },
        { status: 400 }
      );
    }

    const task = await prisma.projectTask.create({
      data: {
        projectId,
        section, // "OPEN_ACTION" | "MILESTONE" | "ISSUE"
        event: event.trim(),
        assignee: assignee ? assignee.trim() : (user.name || "Engineer"),
        dueDate: dueDate ? new Date(dueDate) : null,
        actualFinishedDate: actualFinishedDate ? new Date(actualFinishedDate) : null,
        isDone: Boolean(isDone),
        delayNote: delayNote || null,
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

    return NextResponse.json(task);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
