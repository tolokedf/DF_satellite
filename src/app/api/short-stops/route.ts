import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, getSiteFilterForUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    const siteFilter = getSiteFilterForUser(user);

    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");
    const robotId = searchParams.get("robotId");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const where: any = {};
    if (siteFilter) where.siteId = siteFilter;
    if (siteId) where.siteId = siteId;
    if (robotId) where.robotId = robotId;

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

    // Verify site permission
    if (user.role === "CUSTOMER" && !user.assignedSiteIds.includes(body.siteId)) {
      return NextResponse.json({ error: "Forbidden: Not permitted for this site" }, { status: 403 });
    }

    const startTime = body.startTime ? new Date(body.startTime) : new Date();
    const durationMinutes = parseFloat(body.durationMinutes) || 1.0;
    const recoveryTime = body.recoveryTime
      ? new Date(body.recoveryTime)
      : new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    const stop = await prisma.shortStopLog.create({
      data: {
        siteId: body.siteId,
        robotId: body.robotId,
        category: body.category || "General Stop",
        zone: body.zone || null,
        specificLocation: body.specificLocation || null,
        startTime,
        recoveryTime,
        durationMinutes,
        resolvedBy: body.resolvedBy || user.name,
        recoveryAction: body.recoveryAction || "Operator Reset",
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
