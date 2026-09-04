"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Plus, 
  List, 
  Target, 
  BarChart2, 
  QrCode, 
  Settings, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from "lucide-react";

interface SidebarProps {
  user: any;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === "/form" || href === "/portal/log-stop") {
      return pathname === "/form" || pathname === "/portal/log-stop";
    }
    if (href === "/feed" || href === "/portal/feed") {
      return pathname === "/feed" || pathname === "/portal/feed";
    }
    if (href === "/focus" || href === "/portal/focus") {
      return pathname === "/focus" || pathname === "/portal/focus";
    }
    if (href === "/analytics" || href === "/portal/analytics") {
      return pathname === "/analytics" || pathname === "/portal/analytics";
    }
    if (href === "/qr" || href === "/portal/qr") {
      return pathname === "/qr" || pathname === "/portal/qr";
    }
    if (href === "/settings" || href === "/portal/settings") {
      return pathname === "/settings" || pathname === "/portal/settings";
    }
    if (href === "/portal/log-issue") {
      return pathname === "/portal/log-issue";
    }
    if (href === "/portal/issues" || href === "/issues") {
      return pathname === "/portal/issues" || pathname === "/issues";
    }
    return pathname === href;
  };

  const navItemClass = (href: string) => {
    const active = isActive(href);
    return `flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
      active
        ? "bg-slate-100 text-slate-900 font-semibold"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    }`;
  };

  // The left bar is second level: only shown for the "issue list" top bar section
  // When clicking "task overview" or "current status" (or admin), it will not show the left bar
  const isIssueListSection = !pathname.startsWith("/current-status") &&
                             !pathname.startsWith("/portfolio") &&
                             !pathname.startsWith("/projects") &&
                             !pathname.startsWith("/admin") &&
                             !pathname.startsWith("/my-role");

  if (!isIssueListSection) {
    return null;
  }

  return (
    <>
      {/* Mobile Sub-Navigation Pill Bar for Issue List (< md) */}
      <div className="md:hidden w-full bg-white border-b border-slate-200 px-2.5 py-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap shadow-[0_1px_2px_rgba(0,0,0,0.03)] shrink-0 select-none">
        <Link
          href="/form"
          className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition ${
            isActive("/form") ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Plus className="w-3 h-3" />
          <span>Log Stop</span>
        </Link>
        <Link
          href="/feed"
          className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition ${
            isActive("/feed") ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <List className="w-3 h-3" />
          <span>Feed</span>
        </Link>
        <Link
          href="/focus"
          className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition ${
            isActive("/focus") ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Target className="w-3 h-3" />
          <span>Focus Board</span>
        </Link>
        <Link
          href="/analytics"
          className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition ${
            isActive("/analytics") ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <BarChart2 className="w-3 h-3" />
          <span>Analytics</span>
        </Link>
        <Link
          href="/qr"
          className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition ${
            isActive("/qr") ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <QrCode className="w-3 h-3" />
          <span>QR Codes</span>
        </Link>
        <Link
          href="/portal/log-issue"
          className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition ${
            isActive("/portal/log-issue") ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Plus className="w-3 h-3" />
          <span>Log Issue</span>
        </Link>
        <Link
          href="/portal/issues"
          className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition ${
            isActive("/portal/issues") ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <AlertTriangle className="w-3 h-3" />
          <span>Issues</span>
        </Link>
        <Link
          href="/settings"
          className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition ${
            isActive("/settings") ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Settings className="w-3 h-3" />
          <span>Settings</span>
        </Link>
      </div>

      {/* Desktop Left Sidebar (md and up) */}
      <aside
        className={`hidden md:flex ${
          collapsed ? "w-16" : "w-52"
        } bg-white border-r border-slate-200 flex-col justify-between shrink-0 min-h-[calc(100vh-3.5rem)] select-none transition-all duration-200`}
      >
      <div className="p-3 space-y-6">
        {/* SHORT STOPS Group */}
        <div>
          {!collapsed && (
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Short Stops
            </div>
          )}
          <div className="space-y-0.5">
            <Link
              href="/form"
              className={navItemClass("/form")}
              title="Log Stop"
            >
              <Plus className="w-4 h-4 shrink-0 text-slate-700" />
              {!collapsed && <span>Log Stop</span>}
            </Link>

            <Link
              href="/feed"
              className={navItemClass("/feed")}
              title="Feed"
            >
              <List className="w-4 h-4 shrink-0 text-slate-700" />
              {!collapsed && <span>Feed</span>}
            </Link>

            <Link
              href="/focus"
              className={navItemClass("/focus")}
              title="Focus Board"
            >
              <Target className="w-4 h-4 shrink-0 text-slate-700" />
              {!collapsed && <span>Focus Board</span>}
            </Link>

            <Link
              href="/analytics"
              className={navItemClass("/analytics")}
              title="Analytics"
            >
              <BarChart2 className="w-4 h-4 shrink-0 text-slate-700" />
              {!collapsed && <span>Analytics</span>}
            </Link>

            <Link
              href="/qr"
              className={navItemClass("/qr")}
              title="QR Codes"
            >
              <QrCode className="w-4 h-4 shrink-0 text-slate-700" />
              {!collapsed && <span>QR Codes</span>}
            </Link>

            <Link
              href="/settings"
              className={navItemClass("/settings")}
              title="Settings"
            >
              <Settings className="w-4 h-4 shrink-0 text-slate-700" />
              {!collapsed && <span>Settings</span>}
            </Link>
          </div>
        </div>

        {/* ISSUE TRACKER Group */}
        <div>
          {!collapsed && (
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Issue Tracker
            </div>
          )}
          <div className="space-y-0.5">
            <Link
              href="/portal/log-issue"
              className={navItemClass("/portal/log-issue")}
              title="Log Issue"
            >
              <Plus className="w-4 h-4 shrink-0 text-slate-700" />
              {!collapsed && <span>Log Issue</span>}
            </Link>

            <Link
              href="/portal/issues"
              className={navItemClass("/portal/issues")}
              title="Issues"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-slate-700" />
              {!collapsed && <span>Issues</span>}
            </Link>

            <Link
              href="/focus?mode=issues"
              className={navItemClass("/focus?mode=issues")}
              title="Focus Board"
            >
              <Target className="w-4 h-4 shrink-0 text-slate-700" />
              {!collapsed && <span>Focus Board</span>}
            </Link>

            <Link
              href="/analytics?mode=issues"
              className={navItemClass("/analytics?mode=issues")}
              title="Analytics"
            >
              <BarChart2 className="w-4 h-4 shrink-0 text-slate-700" />
              {!collapsed && <span>Analytics</span>}
            </Link>

            <Link
              href="/qr?mode=issues"
              className={navItemClass("/qr?mode=issues")}
              title="QR Codes"
            >
              <QrCode className="w-4 h-4 shrink-0 text-slate-700" />
              {!collapsed && <span>QR Codes</span>}
            </Link>

            <Link
              href="/settings?mode=issues"
              className={navItemClass("/settings?mode=issues")}
              title="Settings"
            >
              <Settings className="w-4 h-4 shrink-0 text-slate-700" />
              {!collapsed && <span>Settings</span>}
            </Link>
          </div>
        </div>
      </div>

      {/* Collapse button matching screenshot: << Collapse */}
      <div className="p-3 border-t border-slate-100">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition w-full py-1.5 px-2 rounded-lg hover:bg-slate-50"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 mx-auto" />
          ) : (
            <>
              <span className="text-slate-400 font-bold">&laquo;</span>
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
    </>
  );
}
