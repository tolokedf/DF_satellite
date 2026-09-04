import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, getSiteFilterForUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    const siteFilter = getSiteFilterForUser(user);

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const siteId = searchParams.get("siteId");
    const companyId = searchParams.get("companyId");

    const where: any = {};
    if (siteFilter) {
      where.siteId = siteFilter;
    } else if (siteId && siteId !== "ALL") {
      where.siteId = siteId;
    } else if (companyId && companyId !== "ALL") {
      where.site = { companyId };
    }
    if (projectId) where.projectId = projectId;

    const issues = await prisma.issue.findMany({
      where,
      include: {
        robot: true,
        site: { include: { company: true } },
        project: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(issues);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    // Verify site permission
    if (user.role === "CUSTOMER" && !user.assignedSiteIds.includes(body.siteId)) {
      return NextResponse.json({ error: "Forbidden: Not permitted for this site" }, { status: 403 });
    }

    const count = await prisma.issue.count();
    const issueNo = `ISS-${(count + 1).toString().padStart(3, "0")}`;

    const issue = await prisma.issue.create({
      data: {
        issueNo,
        projectId: body.projectId || null,
        siteId: body.siteId,
        robotId: body.robotId || null,
        title: body.title,
        description: body.description,
        severity: body.severity || "MODERATE",
        rootCauseCategory: body.rootCauseCategory || "OTHER",
        fiveWhyAnalysis: body.fiveWhyAnalysis,
        immediateAction: body.immediateAction,
        permanentCountermeasure: body.permanentCountermeasure,
        status: body.status || "OPEN",
        loggedBy: user.name + (user.companyName ? ` (${user.companyName})` : ""),
        assignedTo: body.assignedTo || null,
      },
      include: {
        robot: true,
        site: true,
      },
    });

    return NextResponse.json(issue);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, ...data } = body;

    if (data.status === "CLOSED" && !data.closedAt) {
      data.closedAt = new Date();
    }

    const updated = await prisma.issue.update({
      where: { id },
      data,
      include: { robot: true, site: true },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
