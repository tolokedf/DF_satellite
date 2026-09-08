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

    if (!body.siteId) {
      return NextResponse.json({ error: "Site ID is required" }, { status: 400 });
    }

    if (!body.code || !body.code.trim()) {
      return NextResponse.json({ error: "Robot code is required" }, { status: 400 });
    }

    const site = await prisma.site.findUnique({ where: { id: body.siteId } });
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const cleanCode = body.code.toUpperCase().trim();

    // Check unique constraint before DB insertion
    const existing = await prisma.robot.findUnique({
      where: {
        siteId_code: {
          siteId: body.siteId,
          code: cleanCode,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Robot with code '${cleanCode}' already exists for this site` },
        { status: 409 }
      );
    }

    const robot = await prisma.robot.create({
      data: {
        siteId: body.siteId,
        code: cleanCode,
        name: body.name?.trim() || null,
        model: body.model || "Titan",
        type: body.type || "AGV",
        status: body.status || "RUNNING",
        lineZone: body.lineZone?.trim() || null,
        ipAddress: body.ipAddress?.trim() || null,
      },
      include: {
        site: { include: { company: true } },
      },
    });

    return NextResponse.json(robot, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getSessionUser();
    if (user?.role !== "ADMIN" && user?.role !== "ENGINEER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "Robot ID is required" }, { status: 400 });

    const existing = await prisma.robot.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Robot not found" }, { status: 404 });

    if (data.code) {
      data.code = data.code.toUpperCase().trim();
      const dup = await prisma.robot.findFirst({
        where: {
          siteId: existing.siteId,
          code: data.code,
          NOT: { id },
        },
      });
      if (dup) {
        return NextResponse.json(
          { error: `Robot with code '${data.code}' already exists for this site` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.robot.update({
      where: { id },
      data,
      include: { site: { include: { company: true } } },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getSessionUser();
    if (user?.role !== "ADMIN" && user?.role !== "ENGINEER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Robot ID is required" }, { status: 400 });

    const existing = await prisma.robot.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Robot not found" }, { status: 404 });

    await prisma.robot.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
