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
        _count: {
          select: {
            actionItems: true,
            issues: true,
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
    const project = await prisma.project.create({
      data: {
        name: body.name,
        code: body.code,
        companyId: body.companyId,
        siteId: body.siteId,
        leadEngineer: body.leadEngineer || user.name,
        targetGoLive: body.targetGoLive ? new Date(body.targetGoLive) : null,
        description: body.description,
        gdriveFolderUrl: body.gdriveFolderUrl,
        health: body.health || "ON_TRACK",
      },
    });

    return NextResponse.json(project);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
