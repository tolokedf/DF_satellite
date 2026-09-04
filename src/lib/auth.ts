import { cookies } from "next/headers";
import prisma from "./prisma";
import { SessionUser, UserRole } from "./types";
import bcrypt from "bcryptjs";

export const COOKIE_NAME = "df_satellite_session";

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const raw = Buffer.from(sessionCookie.value, "base64").toString("utf-8");
    const data = JSON.parse(raw);

    // Verify user still exists in DB
    const user = await prisma.user.findUnique({
      where: { id: data.id },
      include: { company: true },
    });

    if (!user) return null;

    // Single active device session enforcement:
    // If user has an active sessionToken, verify that this device's token matches.
    // If user logged in on another device, user.sessionToken will have changed, invalidating this session.
    if (user.sessionToken && data.sessionToken && user.sessionToken !== data.sessionToken) {
      return null;
    }

    let assignedSiteIds: string[] = [];
    try {
      assignedSiteIds = JSON.parse(user.assignedSiteIds || "[]");
    } catch {
      assignedSiteIds = [];
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      companyId: user.companyId,
      companyName: user.company?.name,
      assignedSiteIds,
      googleLinked: user.googleLinked,
      sessionToken: user.sessionToken || undefined,
    };
  } catch (err) {
    return null;
  }
}

export function serializeSession(user: SessionUser): string {
  return Buffer.from(JSON.stringify(user)).toString("base64");
}

export function setSessionCookie(user: SessionUser) {
  const serialized = serializeSession(user);
  cookies().set(COOKIE_NAME, serialized, {
    httpOnly: true,
    // Must be false on HTTP LAN IP (http://192.168.x.x:3000) so browsers on other devices don't drop the cookie
    secure: process.env.SECURE_COOKIES === "true",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE_NAME);
}

// Scoping helper for database queries
export function getSiteFilterForUser(user: SessionUser | null) {
  if (!user) return { in: [] };
  // Admins and Engineers can see ALL sites
  if (user.role === "ADMIN" || user.role === "ENGINEER") {
    return undefined; // No filter: access all
  }
  // Customers and Interns are scoped to their assigned sites
  return { in: user.assignedSiteIds };
}
