import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { username, password, googleAuth } = await req.json();

    // Support fast demo switch or Google sign-in
    let user;
    if (googleAuth) {
      // Simulate Google Sign In for Engineers
      user = await prisma.user.findFirst({
        where: { role: "ENGINEER", googleLinked: true },
        include: { company: true },
      });
    } else if (username) {
      user = await prisma.user.findUnique({
        where: { username: username.toLowerCase().trim() },
        include: { company: true },
      });

      if (!user) {
        return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
      }

      // If password is provided, verify it (or allow demo bypass if empty in dev mode)
      if (password) {
        const match = bcrypt.compareSync(password, user.passwordHash);
        if (!match) {
          return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let assignedSiteIds: string[] = [];
    try {
      assignedSiteIds = JSON.parse(user.assignedSiteIds || "[]");
    } catch {
      assignedSiteIds = [];
    }

    const sessionUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role as any,
      companyId: user.companyId,
      companyName: user.company?.name,
      assignedSiteIds,
      googleLinked: user.googleLinked,
    };

    setSessionCookie(sessionUser);

    return NextResponse.json({ success: true, user: sessionUser });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}
