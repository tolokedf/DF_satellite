import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const engineers = await prisma.user.findMany({
      where: {
        role: { in: ["ENGINEER", "ADMIN"] },
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(engineers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
