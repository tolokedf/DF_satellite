import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (user?.role !== "ADMIN" && user?.role !== "ENGINEER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.event !== undefined) updateData.event = body.event.trim();
    if (body.assignee !== undefined) updateData.assignee = body.assignee.trim();
    if (body.section !== undefined) updateData.section = body.section;
    if (body.delayNote !== undefined) updateData.delayNote = body.delayNote;

    if (body.dueDate !== undefined) {
      updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    }

    if (body.isDone !== undefined) {
      updateData.isDone = Boolean(body.isDone);
      if (body.isDone) {
        updateData.actualFinishedDate = body.actualFinishedDate
          ? new Date(body.actualFinishedDate)
          : new Date();
      } else {
        updateData.actualFinishedDate = body.actualFinishedDate
          ? new Date(body.actualFinishedDate)
          : null;
      }
    } else if (body.actualFinishedDate !== undefined) {
      updateData.actualFinishedDate = body.actualFinishedDate
        ? new Date(body.actualFinishedDate)
        : null;
    }

    const updated = await prisma.projectTask.update({
      where: { id: params.id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (user?.role !== "ADMIN" && user?.role !== "ENGINEER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.projectTask.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
