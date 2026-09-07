import { NextResponse } from "next/server";
import { clearSessionCookie, COOKIE_NAME, getSessionUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    const user = await getSessionUser();
    if (user?.id) {
      await prisma.user.update({
        where: { id: user.id },
        data: { sessionToken: null },
      });
    }
  } catch {
    // ignore
  }

  clearSessionCookie();
  const res = NextResponse.json({ success: true });
  res.cookies.delete(COOKIE_NAME);
  return res;
}
