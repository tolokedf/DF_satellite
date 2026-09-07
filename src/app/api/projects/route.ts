import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, getSiteFilterForUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    const siteFilter = getSiteFilterForUser(user);

    const whereClause: any = {};
    if (siteFilter) {
      whereClause.siteId = siteFilter;
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        company: true,
        site: {
          include: {
            robots: true,
          },
        },
        actionItems: true,
        issues: true,
        tasks: {
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: {
            actionItems: true,
            issues: true,
            tasks: true,
            meetingMinutes: true,
            dailyReports: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(projects);
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
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    let companyId = body.companyId || null;
    let siteId = body.siteId || null;
    if (siteId && !companyId) {
      const site = await prisma.site.findUnique({ where: { id: siteId } });
      if (site) {
        companyId = site.companyId;
      }
    }

    const code = (body.code && body.code.trim()) || `PRJ-${Date.now().toString(36).toUpperCase()}`;

    const project = await prisma.project.create({
      data: {
        name: body.name.trim(),
        code,
        companyId,
        siteId,
        leadEngineer: body.leadEngineer || user.name,
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        targetGoLive: body.targetGoLive ? new Date(body.targetGoLive) : null,
        description: body.description,
        gdriveFolderUrl: body.gdriveFolderUrl,
        health: body.health || "ON_TRACK",
      },
      include: {
        company: true,
        site: true,
        tasks: true,
      },
    });

    return NextResponse.json(project);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
