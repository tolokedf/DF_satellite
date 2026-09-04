import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user });
}
