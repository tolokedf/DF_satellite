"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Activity, 
  FolderKanban, 
  ShieldCheck, 
  ChevronDown, 
  LogOut,
  ClipboardList,
  Award,
  Menu,
  X,
  Plus,
  List,
  Target,
  BarChart2,
  QrCode,
  Settings,
  AlertTriangle
} from "lucide-react";
import { useSite } from "@/context/SiteContext";

interface NavbarProps {
  currentUser: any;
}

export default function Navbar({ currentUser }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isCustomer, isEngineer, isAdmin } = useSite();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    if (typeof window !== "undefined") {
      localStorage.removeItem("df_selected_site");
      window.location.href = "/login";
    }
  };

  const isIssueListActive = !pathname.startsWith("/current-status") &&
                            !pathname.startsWith("/portfolio") &&
                            !pathname.startsWith("/projects") &&
                            !pathname.startsWith("/admin") &&
                            !pathname.startsWith("/my-role");

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)] select-none">
        {/* Main Header Row */}
        <div className="h-14 px-3 sm:px-4 flex items-center justify-between">
          {/* Top Left: DF Logo Section & Site Filter */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            {/* Brand / Logo & Title */}
            <Link href="/feed" className="flex items-center space-x-2 shrink-0 group">
              <img
                src="/images/df-icon-192.png"
                alt="DF Automation and robotics"
                className="w-7 h-7 sm:w-8 sm:h-8 object-contain shrink-0 group-hover:scale-105 transition drop-shadow-sm"
              />
              <div className="flex flex-col">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-tight leading-none hidden sm:block">
                  DF Automation and robotics
                </span>
                <span className="font-extrabold text-slate-900 text-xs sm:text-sm tracking-tight leading-tight">
                  DF satellite
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Buttons (md and up) */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Issue list button */}
            <Link
              href="/feed"
              className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 transition ${
                isIssueListActive
                  ? "bg-slate-900 text-white shadow-sm border border-slate-900"
                  : "text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200"
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>issue list</span>
            </Link>

            {/* Task Overview button (Engineer & Admin) */}
            {(isEngineer || isAdmin) && (
              <Link
                href="/task-overview"
                className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 transition ${
                  pathname.startsWith("/task-overview") || pathname.startsWith("/current-status")
                    ? "bg-teal-600 text-white shadow-sm border border-teal-600"
                    : "text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200"
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>task Overview</span>
              </Link>
            )}

            {/* Project button (Engineer & Admin) */}
            {(isEngineer || isAdmin) && (
              <Link
                href="/project"
                className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 transition ${
                  pathname.startsWith("/project") || pathname.startsWith("/portfolio") || pathname.startsWith("/projects")
                    ? "bg-blue-600 text-white shadow-sm border border-blue-600"
                    : "text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200"
                }`}
              >
                <FolderKanban className="w-3.5 h-3.5" />
                <span>project</span>
              </Link>
            )}

            {/* Administration button for Admin only */}
            {isAdmin && (
              <Link
                href="/admin"
                className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 transition ${
                  pathname.startsWith("/admin")
                    ? "bg-purple-600 text-white shadow-sm border border-purple-600"
                    : "text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>Administration</span>
              </Link>
            )}

            {/* Desktop User Profile */}
            {currentUser && (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <div className="flex items-center text-xs text-slate-700">
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 mr-2 border border-slate-300">
                    {currentUser.name ? currentUser.name[0].toUpperCase() : "A"}
                  </div>
                  <span className="font-semibold text-slate-800 max-w-[120px] truncate">
                    {currentUser.username}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Right Compartment: User Avatar & Hamburger Toggle (< md) */}
          <div className="flex md:hidden items-center space-x-2">
            {currentUser && (
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs border border-slate-300">
                {currentUser.name ? currentUser.name[0].toUpperCase() : "A"}
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-900" />
              ) : (
                <Menu className="w-5 h-5 text-slate-900" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Quick-Tab Bar (< md): 1-tap access to high-level sections */}
        <div className="md:hidden flex items-center gap-1.5 overflow-x-auto px-3 py-1.5 bg-slate-50 border-t border-slate-200 scrollbar-none whitespace-nowrap">
          <Link
            href="/feed"
            onClick={closeMobileMenu}
            className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition ${
              isIssueListActive
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 bg-white border border-slate-200"
            }`}
          >
            <ClipboardList className="w-3 h-3" />
            <span>issue list</span>
          </Link>

          {(isEngineer || isAdmin) && (
            <Link
              href="/task-overview"
              onClick={closeMobileMenu}
              className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition ${
                pathname.startsWith("/task-overview") || pathname.startsWith("/current-status")
                  ? "bg-teal-600 text-white shadow-xs"
                  : "text-slate-600 bg-white border border-slate-200"
              }`}
            >
              <Activity className="w-3 h-3" />
              <span>task Overview</span>
            </Link>
          )}

          {(isEngineer || isAdmin) && (
            <Link
              href="/project"
              onClick={closeMobileMenu}
              className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition ${
                pathname.startsWith("/project") || pathname.startsWith("/portfolio") || pathname.startsWith("/projects")
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 bg-white border border-slate-200"
              }`}
            >
              <FolderKanban className="w-3 h-3" />
              <span>project</span>
            </Link>
          )}

          {isAdmin && (
            <Link
              href="/admin"
              onClick={closeMobileMenu}
              className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition ${
                pathname.startsWith("/admin")
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-600 bg-white border border-slate-200"
              }`}
            >
              <ShieldCheck className="w-3 h-3 text-purple-600" />
              <span>Administration</span>
            </Link>
          )}
        </div>
      </header>

      {/* Mobile Slide-Over Drawer (< md) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={closeMobileMenu}
          />

          {/* Drawer Content */}
          <div className="relative ml-auto w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between p-5 z-10 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <img
                    src="/images/df-icon-192.png"
                    alt="DF Logo"
                    className="w-6 h-6 object-contain"
                  />
                  <span className="font-extrabold text-slate-900 text-sm">Navigation</span>
                </div>
                <button
                  onClick={closeMobileMenu}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Profile Info Card */}
              {currentUser && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm border border-slate-300">
                    {currentUser.name ? currentUser.name[0].toUpperCase() : "A"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-slate-900 truncate">
                      {currentUser.name || currentUser.username}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 uppercase">
                        {currentUser.role}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">@{currentUser.username}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* High-Level Sections */}
              <div className="space-y-1">
                <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Main Sections
                </div>

                <Link
                  href="/feed"
                  onClick={closeMobileMenu}
                  className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    isIssueListActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>issue list</span>
                </Link>

                {(isEngineer || isAdmin) && (
                  <Link
                    href="/task-overview"
                    onClick={closeMobileMenu}
                    className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      pathname.startsWith("/task-overview") || pathname.startsWith("/current-status")
                        ? "bg-teal-600 text-white shadow-xs"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    <span>task Overview</span>
                  </Link>
                )}

                {(isEngineer || isAdmin) && (
                  <Link
                    href="/project"
                    onClick={closeMobileMenu}
                    className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      pathname.startsWith("/project") || pathname.startsWith("/portfolio") || pathname.startsWith("/projects")
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <FolderKanban className="w-4 h-4" />
                    <span>project</span>
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={closeMobileMenu}
                    className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      pathname.startsWith("/admin")
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-purple-800 bg-purple-50 hover:bg-purple-100"
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>Administration</span>
                  </Link>
                )}
              </div>

              {/* Sub-Navigation Links when on issue list */}
              {isIssueListActive && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div>
                    <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Short Stops
                    </div>
                    <div className="space-y-0.5">
                      <Link
                        href="/form"
                        onClick={closeMobileMenu}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          pathname === "/form" ? "bg-slate-100 text-slate-900 font-bold" : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Log Stop</span>
                      </Link>

                      <Link
                        href="/feed"
                        onClick={closeMobileMenu}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          pathname === "/feed" ? "bg-slate-100 text-slate-900 font-bold" : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <List className="w-3.5 h-3.5" />
                        <span>Feed</span>
                      </Link>

                      <Link
                        href="/focus"
                        onClick={closeMobileMenu}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          pathname === "/focus" ? "bg-slate-100 text-slate-900 font-bold" : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Target className="w-3.5 h-3.5" />
                        <span>Focus Board</span>
                      </Link>

                      <Link
                        href="/analytics"
                        onClick={closeMobileMenu}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          pathname === "/analytics" ? "bg-slate-100 text-slate-900 font-bold" : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        <span>Analytics</span>
                      </Link>

                      <Link
                        href="/qr"
                        onClick={closeMobileMenu}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          pathname === "/qr" ? "bg-slate-100 text-slate-900 font-bold" : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>QR Codes</span>
                      </Link>

                      <Link
                        href="/settings"
                        onClick={closeMobileMenu}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          pathname === "/settings" ? "bg-slate-100 text-slate-900 font-bold" : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Settings</span>
                      </Link>
                    </div>
                  </div>

                  <div>
                    <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Issue Tracker
                    </div>
                    <div className="space-y-0.5">
                      <Link
                        href="/portal/log-issue"
                        onClick={closeMobileMenu}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          pathname === "/portal/log-issue" ? "bg-slate-100 text-slate-900 font-bold" : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Log Issue</span>
                      </Link>

                      <Link
                        href="/portal/issues"
                        onClick={closeMobileMenu}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          pathname === "/portal/issues" ? "bg-slate-100 text-slate-900 font-bold" : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Issues</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer: Sign Out */}
            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
