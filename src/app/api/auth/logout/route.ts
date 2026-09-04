import { NextResponse } from "next/server";
import { clearSessionCookie, COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  clearSessionCookie();
  const res = NextResponse.json({ success: true });
  res.cookies.delete(COOKIE_NAME);
  return res;
}
