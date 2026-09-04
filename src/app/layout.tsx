import type { Metadata } from "next";
import "./globals.css";
import { getSessionUser } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "DF Satellite | Field Deployment Management & Robot Issue Tracker",
  description: "Unified platform for AGV/AMR/ARV field deployment management and robot issue tracking.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  // If no user is logged in, default to a simulated Engineer or null (so user can login or demo)
  let currentUser = user;
  if (!currentUser) {
    // For seamless first run, provide default demo engineer session
    const defaultEng = await prisma.user.findFirst({
      where: { role: "ENGINEER" },
      include: { company: true },
    });
    if (defaultEng) {
      currentUser = {
        id: defaultEng.id,
        username: defaultEng.username,
        email: defaultEng.email,
        name: defaultEng.name,
        role: defaultEng.role as any,
        companyId: defaultEng.companyId,
        companyName: defaultEng.company?.name,
        assignedSiteIds: JSON.parse(defaultEng.assignedSiteIds || "[]"),
        googleLinked: defaultEng.googleLinked,
      };
    }
  }

  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col">
        <Navbar currentUser={currentUser} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar user={currentUser} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
