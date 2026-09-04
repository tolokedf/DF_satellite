import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ENGINEER" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.assignee !== undefined) updateData.assignee = body.assignee;
    if (body.dueDate !== undefined) updateData.dueDate = new Date(body.dueDate);
    if (body.actualCompletionDate !== undefined) {
      updateData.actualCompletionDate = body.actualCompletionDate
        ? new Date(body.actualCompletionDate)
        : null;
    }
    if (body.status !== undefined) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.projectId !== undefined) updateData.projectId = body.projectId || null;

    // Auto-update status if actualCompletionDate was set and status not explicitly provided
    if (updateData.actualCompletionDate && !body.status) {
      updateData.status = "COMPLETED";
    }

    const updated = await prisma.milestone.update({
      where: { id },
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
    console.error("Error updating milestone:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ENGINEER" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = params;
    await prisma.milestone.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting milestone:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
