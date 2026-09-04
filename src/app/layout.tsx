import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getSessionUser } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "DF satellite | DF Automation and robotics",
  description: "Unified platform for AGV/AMR/ARV field deployment management and robot issue tracking.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

import { SiteProvider } from "@/context/SiteContext";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getSessionUser();

  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col font-sans">
        <SiteProvider currentUser={currentUser}>
          {currentUser ? (
            <>
              <Navbar currentUser={currentUser} />
              <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                <Sidebar user={currentUser} />
                <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
                  {children}
                </main>
              </div>
            </>
          ) : (
            <main className="flex-1 min-h-screen flex items-center justify-center p-4">
              {children}
            </main>
          )}
        </SiteProvider>
      </body>
    </html>
  );
}
