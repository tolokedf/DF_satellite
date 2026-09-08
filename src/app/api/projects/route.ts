import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, getSiteFilterForUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");
    const companyId = searchParams.get("companyId");

    const siteFilter = getSiteFilterForUser(user);

    const whereClause: any = {};
    if (siteFilter) {
      if (siteId && siteId !== "ALL") {
        if (user.assignedSiteIds?.includes(siteId)) {
          whereClause.siteId = siteId;
        } else {
          whereClause.siteId = "__UNAUTHORIZED__";
        }
      } else if (companyId && companyId !== "ALL") {
        whereClause.companyId = companyId;
        whereClause.siteId = siteFilter;
      } else {
        whereClause.siteId = siteFilter;
      }
    } else {
      if (siteId && siteId !== "ALL") {
        whereClause.siteId = siteId;
      } else if (companyId && companyId !== "ALL") {
        whereClause.companyId = companyId;
      }
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

    const existing = await prisma.project.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: `Project with code '${code}' already exists` }, { status: 409 });
    }

    let startDate: Date | null = new Date();
    if (body.startDate) {
      const parsedStart = new Date(body.startDate);
      if (!isNaN(parsedStart.getTime())) startDate = parsedStart;
    }

    let targetGoLive: Date | null = null;
    if (body.targetGoLive) {
      const parsedGoLive = new Date(body.targetGoLive);
      if (!isNaN(parsedGoLive.getTime())) targetGoLive = parsedGoLive;
    }

    const project = await prisma.project.create({
      data: {
        name: body.name.trim(),
        code,
        companyId,
        siteId,
        leadEngineer: body.leadEngineer || user.name,
        startDate,
        targetGoLive,
        description: body.description?.trim() || null,
        gdriveFolderUrl: body.gdriveFolderUrl?.trim() || null,
        health: body.health || "ON_TRACK",
      },
      include: {
        company: true,
        site: true,
        tasks: true,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
