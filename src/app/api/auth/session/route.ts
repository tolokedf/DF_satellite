import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const user = await getSessionUser();
  
  // Also provide list of all demo user accounts for easy switching
  const sampleUsers = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      company: { select: { name: true } },
    },
    orderBy: { role: "asc" },
  });

  return NextResponse.json({
    user,
    availableAccounts: sampleUsers.map((u) => ({
      username: u.username,
      name: u.name,
      role: u.role,
      company: u.company?.name || "DF Robotics Internal",
    })),
  });
}
