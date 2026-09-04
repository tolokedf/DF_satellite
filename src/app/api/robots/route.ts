import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, getSiteFilterForUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    const siteFilter = getSiteFilterForUser(user);

    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");

    const where: any = {};
    if (siteFilter) where.siteId = siteFilter;
    if (siteId && siteId !== "ALL") where.siteId = siteId;

    const robots = await prisma.robot.findMany({
      where,
      include: {
        site: { include: { company: true } },
        _count: {
          select: {
            shortStops: true,
            issues: true,
          },
        },
      },
      orderBy: [{ site: { name: "asc" } }, { code: "asc" }],
    });

    return NextResponse.json(robots);
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
    const robot = await prisma.robot.create({
      data: {
        siteId: body.siteId,
        code: body.code.toUpperCase().trim(),
        name: body.name,
        model: body.model || "Titan",
        type: body.type || "AGV",
        status: body.status || "RUNNING",
        lineZone: body.lineZone,
        ipAddress: body.ipAddress,
      },
    });

    return NextResponse.json(robot);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
