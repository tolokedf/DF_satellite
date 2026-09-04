import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      include: {
        company: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const sanitized = users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      name: u.name,
      role: u.role,
      companyId: u.companyId,
      companyName: u.company?.name,
      assignedSiteIds: JSON.parse(u.assignedSiteIds || "[]"),
      googleLinked: u.googleLinked,
      createdAt: u.createdAt,
    }));

    return NextResponse.json(sanitized);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { username, password, name, role, companyId, assignedSiteIds, email, googleLinked } = body;

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 });
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username: username.toLowerCase().trim(),
        email: email || null,
        passwordHash,
        name: name || username,
        role: role || "CUSTOMER",
        companyId: companyId || null,
        assignedSiteIds: JSON.stringify(assignedSiteIds || []),
        googleLinked: Boolean(googleLinked),
      },
    });

    return NextResponse.json({ success: true, user: { id: newUser.id, username: newUser.username } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getSessionUser();
    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, password, assignedSiteIds, role, companyId, name, email, googleLinked } = body;

    const data: any = {};
    if (password) data.passwordHash = bcrypt.hashSync(password, 10);
    if (assignedSiteIds !== undefined) data.assignedSiteIds = JSON.stringify(assignedSiteIds);
    if (role) data.role = role;
    if (companyId !== undefined) data.companyId = companyId || null;
    if (name) data.name = name;
    if (email !== undefined) data.email = email;
    if (googleLinked !== undefined) data.googleLinked = googleLinked;

    const updated = await prisma.user.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getSessionUser();
    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
