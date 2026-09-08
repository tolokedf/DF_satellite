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

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await prisma.project.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (user.role === "CUSTOMER") {
      if (!existing.siteId || !user.assignedSiteIds.includes(existing.siteId)) {
        return NextResponse.json({ error: "Forbidden: Access denied to this project" }, { status: 403 });
      }
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.status !== undefined) updateData.status = body.status;
    if (body.health !== undefined) updateData.health = body.health;
    if (body.leadEngineer !== undefined) updateData.leadEngineer = body.leadEngineer.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.gdriveFolderUrl !== undefined) updateData.gdriveFolderUrl = body.gdriveFolderUrl?.trim() || null;
    if (body.siteId !== undefined) updateData.siteId = body.siteId || null;
    if (body.companyId !== undefined) updateData.companyId = body.companyId || null;

    if (body.code !== undefined) {
      const cleanCode = body.code.trim();
      const dup = await prisma.project.findFirst({
        where: { code: cleanCode, NOT: { id: params.id } },
      });
      if (dup) {
        return NextResponse.json({ error: `Project code '${cleanCode}' is already in use` }, { status: 409 });
      }
      updateData.code = cleanCode;
    }

    if (body.startDate !== undefined) {
      if (body.startDate) {
        const d = new Date(body.startDate);
        if (!isNaN(d.getTime())) updateData.startDate = d;
      } else {
        updateData.startDate = null;
      }
    }

    if (body.targetGoLive !== undefined) {
      if (body.targetGoLive) {
        const d = new Date(body.targetGoLive);
        if (!isNaN(d.getTime())) updateData.targetGoLive = d;
      } else {
        updateData.targetGoLive = null;
      }
    }

    const updated = await prisma.project.update({
      where: { id: params.id },
      data: updateData,
      include: {
        company: true,
        site: true,
      },
    });

    return NextResponse.json(updated);
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
