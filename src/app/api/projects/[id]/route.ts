import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        company: true,
        site: {
          include: {
            robots: true,
          },
        },
        actionItems: {
          orderBy: { createdAt: "desc" },
        },
        issues: {
          include: {
            robot: true,
          },
          orderBy: { createdAt: "desc" },
        },
        meetingMinutes: {
          orderBy: { meetingDate: "desc" },
        },
        dailyReports: {
          orderBy: { reportDate: "desc" },
        },
        tasks: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Permission check for customer
    if (user && user.role === "CUSTOMER") {
      if (!project.siteId || !user.assignedSiteIds.includes(project.siteId)) {
        return NextResponse.json({ error: "Access denied to this site project" }, { status: 403 });
      }
    }

    // Also fetch recent short stops for this site if assigned to a site
    const shortStops = project.siteId
      ? await prisma.shortStopLog.findMany({
          where: { siteId: project.siteId },
          include: { robot: true },
          orderBy: { startTime: "desc" },
          take: 50,
        })
      : [];

    return NextResponse.json({ ...project, shortStops });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (user?.role !== "ADMIN" && user?.role !== "ENGINEER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.project.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
