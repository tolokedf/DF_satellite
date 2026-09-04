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
      },
      orderBy: [{ company: { name: "asc" } }, { name: "asc" }],
    });

    return NextResponse.json(sites);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
