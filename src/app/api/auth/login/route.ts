import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { setSessionCookie, serializeSession, COOKIE_NAME } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { username, password, googleAuth } = await req.json();

    if (googleAuth) {
      return NextResponse.json(
        { error: "Google sign-in has been disabled. Please use username and password." },
        { status: 400 }
      );
    }

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
      include: { company: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    // Verify password strictly
    const match = bcrypt.compareSync(password, user.passwordHash);
    if (!match) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    // Single device login enforcement: generate unique device session token
    const sessionToken = crypto.randomUUID();
    await prisma.user.update({
      where: { id: user.id },
      data: { sessionToken },
    });

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
      sessionToken,
    };

    setSessionCookie(sessionUser);

    const res = NextResponse.json({ success: true, user: sessionUser });
    res.cookies.set(COOKIE_NAME, serializeSession(sessionUser), {
      httpOnly: true,
      secure: process.env.SECURE_COOKIES === "true",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}
