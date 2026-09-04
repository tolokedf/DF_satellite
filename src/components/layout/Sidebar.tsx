"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  PlusCircle, 
  List, 
  BarChart3, 
  QrCode, 
  Settings, 
  FolderKanban, 
  Bot, 
  AlertTriangle, 
  Users, 
  FileText, 
  ShieldCheck, 
  ChevronRight,
  Database,
  Calendar,
  Layers
} from "lucide-react";

interface SidebarProps {
  user: any;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const isCustomer = user?.role === "CUSTOMER";
  const isEngineer = user?.role === "ENGINEER";
  const isAdmin = user?.role === "ADMIN";

  const linkClass = (href: string) => {
    const active = pathname === href || pathname.startsWith(href + "/");
    return `flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
      active
        ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600 pl-2"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;
  };

  return (
    <aside className="w-56 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 min-h-[calc(100vh-3.5rem)] select-none">
      <div className="p-3 space-y-6">
        {/* CUSTOMER NAVIGATION (Mirrors screenshot strictly) */}
        {isCustomer && (
          <>
            {/* Short Stops Section */}
            <div>
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Short Stops
              </div>
              <div className="space-y-0.5">
                <Link href="/portal/log-stop" className={linkClass("/portal/log-stop")}>
                  <PlusCircle className="w-4 h-4 text-blue-600" />
                  <span>Log Stop</span>
                </Link>
                <Link href="/portal/feed" className={linkClass("/portal/feed")}>
                  <List className="w-4 h-4" />
                  <span>Feed</span>
                </Link>
                <Link href="/portal/analytics" className={linkClass("/portal/analytics")}>
                  <BarChart3 className="w-4 h-4" />
                  <span>Analytics</span>
                </Link>
              </div>
            </div>

            {/* Issue Tracker Section */}
            <div>
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Issue Tracker
              </div>
              <div className="space-y-0.5">
                <Link href="/portal/log-issue" className={linkClass("/portal/log-issue")}>
                  <PlusCircle className="w-4 h-4 text-rose-600" />
                  <span>Log Issue</span>
                </Link>
                <Link href="/portal/issues" className={linkClass("/portal/issues")}>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Issues</span>
                </Link>
              </div>
            </div>

            {/* Fleet Section */}
            <div>
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Site Equipment
              </div>
              <div className="space-y-0.5">
                <Link href="/portal/fleet" className={linkClass("/portal/fleet")}>
                  <Bot className="w-4 h-4" />
                  <span>My Site Fleet</span>
                </Link>
              </div>
            </div>
          </>
        )}

        {/* ENGINEER & ADMIN NAVIGATION (Asana Portfolio + Field Deployment) */}
        {(isEngineer || isAdmin) && (
          <>
            {/* Field Deployment Management */}
            <div>
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Field Deployments
              </div>
              <div className="space-y-0.5">
                <Link href="/portfolio" className={linkClass("/portfolio")}>
                  <FolderKanban className="w-4 h-4 text-blue-600" />
                  <span>Portfolio Overview</span>
                </Link>
                <Link href="/robots" className={linkClass("/robots")}>
                  <Bot className="w-4 h-4" />
                  <span>Robots & Fleet</span>
                </Link>
                <Link href="/short-stops" className={linkClass("/short-stops")}>
                  <List className="w-4 h-4" />
                  <span>Short Stop Feed</span>
                </Link>
                <Link href="/issues" className={linkClass("/issues")}>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Global Issues</span>
                </Link>
                <Link href="/analytics" className={linkClass("/analytics")}>
                  <BarChart3 className="w-4 h-4" />
                  <span>Fleet Analytics</span>
                </Link>
              </div>
            </div>

            {/* Customer Simulation / Rapid Form */}
            <div>
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Customer View
              </div>
              <div className="space-y-0.5">
                <Link href="/portal/log-stop" className={linkClass("/portal/log-stop")}>
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  <span>Customer Log Stop</span>
                </Link>
                <Link href="/portal/log-issue" className={linkClass("/portal/log-issue")}>
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span>Customer Log Issue</span>
                </Link>
              </div>
            </div>

            {/* Admin Console */}
            {isAdmin && (
              <div>
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-purple-600 font-semibold mb-1.5">
                  Administration
                </div>
                <div className="space-y-0.5">
                  <Link href="/admin" className={linkClass("/admin")}>
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>User & Site Access</span>
                  </Link>
                  <Link href="/admin/database" className={linkClass("/admin/database")}>
                    <Database className="w-4 h-4 text-purple-600" />
                    <span>DB Portability</span>
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-200 text-[11px] text-slate-400">
        <div className="flex items-center justify-between">
          <span>DF Satellite v1.0</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Local DB Connected"></span>
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5 truncate">
          DB: SQLite (Decoupled)
        </div>
      </div>
    </aside>
  );
}
