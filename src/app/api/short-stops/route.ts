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
    const siteId = searchParams.get("siteId");
    const companyId = searchParams.get("companyId");
    const robotId = searchParams.get("robotId");
    const category = searchParams.get("category");
    const zone = searchParams.get("zone");
    const source = searchParams.get("source");
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");
    const limit = parseInt(searchParams.get("limit") || "200", 10);

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
    if (robotId && robotId !== "ALL") where.robotId = robotId;
    if (category && category !== "ALL" && category !== "All") where.category = category;
    if (zone && zone !== "ALL" && zone !== "All") where.zone = zone;
    if (source && source !== "ALL" && source !== "All" && source !== "Both") where.source = source;

    if (fromDate || toDate) {
      where.startTime = {};
      if (fromDate) where.startTime.gte = new Date(fromDate);
      if (toDate) where.startTime.lte = new Date(toDate);
    }

    const shortStops = await prisma.shortStopLog.findMany({
      where,
      include: {
        robot: true,
        site: { include: { company: true } },
      },
      orderBy: { startTime: "desc" },
      take: limit,
    });

    return NextResponse.json(shortStops);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    if (!body.siteId) {
      return NextResponse.json({ error: "Site ID is required" }, { status: 400 });
    }

    if (!body.robotId) {
      return NextResponse.json({ error: "Robot ID is required" }, { status: 400 });
    }

    if (!body.category || !body.category.trim()) {
      return NextResponse.json({ error: "Stoppage category is required" }, { status: 400 });
    }

    // Verify site permission
    if (user.role === "CUSTOMER" && !user.assignedSiteIds.includes(body.siteId)) {
      return NextResponse.json({ error: "Forbidden: Not permitted for this site" }, { status: 403 });
    }

    // Verify robot exists and belongs to the site
    const robot = await prisma.robot.findUnique({ where: { id: body.robotId } });
    if (!robot) {
      return NextResponse.json({ error: "Robot not found" }, { status: 400 });
    }
    if (robot.siteId !== body.siteId) {
      return NextResponse.json({ error: "Robot does not belong to the specified site" }, { status: 400 });
    }

    const startTime = body.startTime ? new Date(body.startTime) : new Date();
    if (isNaN(startTime.getTime())) {
      return NextResponse.json({ error: "Invalid startTime format" }, { status: 400 });
    }

    const durationMinutes = Math.max(0.1, parseFloat(body.durationMinutes) || 1.0);
    let recoveryTime: Date;
    if (body.recoveryTime) {
      recoveryTime = new Date(body.recoveryTime);
      if (isNaN(recoveryTime.getTime())) {
        return NextResponse.json({ error: "Invalid recoveryTime format" }, { status: 400 });
      }
      if (recoveryTime.getTime() < startTime.getTime()) {
        // Automatically rollover to next day if recovery clock time was smaller than start clock time
        recoveryTime = new Date(recoveryTime.getTime() + 24 * 60 * 60 * 1000);
      }
    } else {
      recoveryTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
    }

    const stop = await prisma.shortStopLog.create({
      data: {
        siteId: body.siteId,
        robotId: body.robotId,
        category: body.category.trim(),
        zone: body.zone || robot.lineZone || null,
        specificLocation: body.specificLocation || null,
        problemSummary: body.problemSummary || null,
        description: body.description || null,
        actionTaken: body.actionTaken || null,
        photoUrl: body.photoUrl || null,
        source: body.source || "Manual",
        startTime,
        recoveryTime,
        durationMinutes,
        resolvedBy: body.resolvedBy || user.name,
        recoveryAction: body.recoveryAction || body.actionTaken || "Operator Reset",
        notes: body.notes || null,
      },
      include: {
        robot: true,
        site: true,
      },
    });

    return NextResponse.json(stop);
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
    if (!id) return NextResponse.json({ error: "Stop log ID is required" }, { status: 400 });

    const existing = await prisma.shortStopLog.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Short stop log not found" }, { status: 404 });

    if (user.role === "CUSTOMER" && !user.assignedSiteIds.includes(existing.siteId)) {
      return NextResponse.json({ error: "Forbidden: Access denied to this log" }, { status: 403 });
    }

    if (data.startTime) {
      data.startTime = new Date(data.startTime);
      if (isNaN(data.startTime.getTime())) return NextResponse.json({ error: "Invalid startTime" }, { status: 400 });
    }
    if (data.recoveryTime) {
      data.recoveryTime = new Date(data.recoveryTime);
      if (isNaN(data.recoveryTime.getTime())) return NextResponse.json({ error: "Invalid recoveryTime" }, { status: 400 });
    }

    const updated = await prisma.shortStopLog.update({
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
    if (!id) return NextResponse.json({ error: "Stop log ID is required" }, { status: 400 });

    const existing = await prisma.shortStopLog.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Short stop log not found" }, { status: 404 });

    if (user.role === "CUSTOMER" && !user.assignedSiteIds.includes(existing.siteId)) {
      return NextResponse.json({ error: "Forbidden: Access denied to this log" }, { status: 403 });
    }

    await prisma.shortStopLog.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
