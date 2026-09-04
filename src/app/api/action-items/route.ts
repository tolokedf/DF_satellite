import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const count = await prisma.actionItem.count({ where: { projectId: body.projectId } });
    const itemNo = `OAL-${(count + 1).toString().padStart(3, "0")}`;

    const item = await prisma.actionItem.create({
      data: {
        projectId: body.projectId,
        itemNo,
        title: body.title,
        description: body.description,
        owner: body.owner || user.name,
        priority: body.priority || "MEDIUM",
        category: body.category || "HARDWARE",
        status: body.status || "OPEN",
        targetDate: body.targetDate ? new Date(body.targetDate) : null,
        notes: body.notes,
      },
    });

    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, ...data } = body;

    if (data.targetDate) data.targetDate = new Date(data.targetDate);
    if (data.completedDate) data.completedDate = new Date(data.completedDate);
    if (data.status === "DONE" && !data.completedDate) {
      data.completedDate = new Date();
    }

    const updated = await prisma.actionItem.update({
      where: { id },
      data,
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
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    await prisma.actionItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
