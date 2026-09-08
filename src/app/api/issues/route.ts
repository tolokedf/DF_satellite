import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, getSiteFilterForUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const siteFilter = getSiteFilterForUser(user);

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const siteId = searchParams.get("siteId");
    const companyId = searchParams.get("companyId");

    const where: any = {};
    if (siteFilter) {
      if (siteId && siteId !== "ALL") {
        if (user?.assignedSiteIds?.includes(siteId)) {
          where.siteId = siteId;
        } else {
          where.siteId = "__UNAUTHORIZED__";
        }
      } else if (companyId && companyId !== "ALL") {
        where.site = { companyId };
        where.siteId = siteFilter;
      } else {
        where.siteId = siteFilter;
      }
    } else {
      if (siteId && siteId !== "ALL") {
        where.siteId = siteId;
      } else if (companyId && companyId !== "ALL") {
        where.site = { companyId };
      }
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

    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: "Issue title is required" }, { status: 400 });
    }

    if (!body.siteId) {
      return NextResponse.json({ error: "Site ID is required" }, { status: 400 });
    }

    // Verify site permission
    if (user.role === "CUSTOMER" && !user.assignedSiteIds.includes(body.siteId)) {
      return NextResponse.json({ error: "Forbidden: Not permitted for this site" }, { status: 403 });
    }

    // Verify robot belongs to site if specified
    if (body.robotId) {
      const robot = await prisma.robot.findUnique({ where: { id: body.robotId } });
      if (!robot) {
        return NextResponse.json({ error: "Robot not found" }, { status: 400 });
      }
      if (robot.siteId !== body.siteId) {
        return NextResponse.json({ error: "Robot does not belong to the specified site" }, { status: 400 });
      }
    }

    const latestIssue = await prisma.issue.findFirst({
      orderBy: { createdAt: "desc" },
      select: { issueNo: true },
    });
    let nextNum = 1;
    if (latestIssue?.issueNo?.startsWith("ISS-")) {
      const parsed = parseInt(latestIssue.issueNo.replace("ISS-", ""), 10);
      if (!isNaN(parsed)) nextNum = parsed + 1;
    } else {
      const total = await prisma.issue.count();
      nextNum = total + 1;
    }
    const issueNo = `ISS-${nextNum.toString().padStart(3, "0")}`;

    const issue = await prisma.issue.create({
      data: {
        issueNo,
        projectId: body.projectId || null,
        siteId: body.siteId,
        robotId: body.robotId || null,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        severity: body.severity || "MODERATE",
        rootCauseCategory: body.rootCauseCategory || "OTHER",
        fiveWhyAnalysis: body.fiveWhyAnalysis?.trim() || null,
        immediateAction: body.immediateAction?.trim() || null,
        permanentCountermeasure: body.permanentCountermeasure?.trim() || null,
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

    if (!id) {
      return NextResponse.json({ error: "Issue ID is required" }, { status: 400 });
    }

    const existing = await prisma.issue.findUnique({
      where: { id },
      include: { site: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // IDOR Protection: Customers can ONLY update issues for their assigned sites
    if (user.role === "CUSTOMER" && !user.assignedSiteIds.includes(existing.siteId)) {
      return NextResponse.json({ error: "Forbidden: Access denied to this issue" }, { status: 403 });
    }

    // Closed timestamp management
    if (data.status === "CLOSED" && !data.closedAt) {
      data.closedAt = new Date();
    } else if (data.status && data.status !== "CLOSED") {
      data.closedAt = null;
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

export async function DELETE(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Issue ID is required" }, { status: 400 });
    }

    const existing = await prisma.issue.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // Role check: Customers can only delete if assigned to site, engineers/admins can delete any
    if (user.role === "CUSTOMER" && !user.assignedSiteIds.includes(existing.siteId)) {
      return NextResponse.json({ error: "Forbidden: Access denied to this issue" }, { status: 403 });
    }

    await prisma.issue.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
