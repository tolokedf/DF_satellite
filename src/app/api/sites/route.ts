import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser, getSiteFilterForUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    const siteFilter = getSiteFilterForUser(user);

    const where: any = {};
    if (siteFilter) where.id = siteFilter;

    const sites = await prisma.site.findMany({
      where,
      include: {
        company: true,
        robots: true,
        _count: {
          select: {
            robots: true,
            shortStops: true,
            issues: true,
          },
        },
      },
      orderBy: [{ company: { name: "asc" } }, { name: "asc" }],
    });

    return NextResponse.json(sites);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only administrator can create sites" }, { status: 403 });
    }

    const body = await request.json();
    const { name, code, companyId, newCompanyName, location } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Site name is required" }, { status: 400 });
    }

    let targetCompanyId = companyId;

    // Support creating a new company on the fly if requested
    if (newCompanyName?.trim()) {
      const compName = newCompanyName.trim();
      const compCode = compName.toUpperCase().replace(/[^A-Z0-9]/g, "_").slice(0, 10);

      let company = await prisma.company.findFirst({
        where: {
          OR: [{ name: compName }, { code: compCode }],
        },
      });

      if (!company) {
        company = await prisma.company.create({
          data: {
            name: compName,
            code: compCode || `COMP_${Date.now()}`,
          },
        });
      }
      targetCompanyId = company.id;
    }

    if (!targetCompanyId) {
      return NextResponse.json({ error: "Company is required" }, { status: 400 });
    }

    const siteCode = (
      code?.trim() ||
      name.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_").slice(0, 12)
    ).toUpperCase();

    const existing = await prisma.site.findFirst({
      where: {
        companyId: targetCompanyId,
        code: siteCode,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Site with code '${siteCode}' already exists for this company` },
        { status: 400 }
      );
    }

    const newSite = await prisma.site.create({
      data: {
        name: name.trim(),
        code: siteCode,
        companyId: targetCompanyId,
        location: location?.trim() || null,
      },
      include: {
        company: true,
        robots: true,
      },
    });

    return NextResponse.json(newSite, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only administrator can delete sites" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("id");
    if (!siteId) {
      return NextResponse.json({ error: "Site ID is required" }, { status: 400 });
    }

    await prisma.site.delete({
      where: { id: siteId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
