"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Bot, 
  User, 
  LogOut, 
  ChevronDown, 
  Search, 
  Shield, 
  Layers, 
  CheckCircle2, 
  Building2,
  Sparkles,
  ExternalLink
} from "lucide-react";

interface NavbarProps {
  currentUser: any;
  currentSite?: string;
  onSiteChange?: (siteId: string) => void;
  availableSites?: any[];
}

export default function Navbar({ currentUser, currentSite, onSiteChange, availableSites = [] }: NavbarProps) {
  const router = useRouter();
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.availableAccounts) {
          setAccounts(data.availableAccounts);
        }
      })
      .catch(() => {});
  }, []);

  const handleFastSwitch = async (username: string) => {
    setLoading(true);
    try {
      await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      setShowSwitchModal(false);
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSwitch = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ googleAuth: true }),
      });
      setShowSwitchModal(false);
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const roleColors: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-800 border-purple-300",
    ENGINEER: "bg-blue-100 text-blue-800 border-blue-300",
    CUSTOMER: "bg-emerald-100 text-emerald-800 border-emerald-300",
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Brand & Site selector */}
      <div className="flex items-center space-x-4">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow">
            DF
          </div>
          <span className="font-bold text-slate-800 tracking-tight flex items-center gap-1.5 text-base">
            DF Satellite
            <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              Robotics
            </span>
          </span>
        </Link>

        {/* Site Switcher Dropdown (if multiple sites available) */}
        {availableSites.length > 0 && onSiteChange && (
          <div className="relative flex items-center pl-3 border-l border-slate-200">
            <Building2 className="w-4 h-4 text-slate-400 mr-1.5" />
            <select
              value={currentSite || ""}
              onChange={(e) => onSiteChange(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-300 rounded px-2.5 py-1 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              {availableSites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.company ? `${s.company.name} - ${s.name}` : s.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Center Search bar (like Asana / screenshot) */}
      <div className="hidden md:flex items-center relative max-w-sm w-full mx-4">
        <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search robots, projects, issues... (Ctrl+K)"
          className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {/* User Actions & Role Switcher */}
      <div className="flex items-center space-x-3">
        {currentUser && (
          <div className="flex items-center gap-2">
            {/* Role Badge */}
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${roleColors[currentUser.role] || "bg-slate-100 text-slate-700"}`}>
              {currentUser.role}
              {currentUser.googleLinked && " (Gmail)"}
            </span>

            {/* Switch Persona button (for testing multi-role workflows) */}
            <button
              onClick={() => setShowSwitchModal(true)}
              className="flex items-center text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded transition"
              title="Test as different customer, engineer, or admin"
            >
              <Sparkles className="w-3 h-3 mr-1 text-blue-600" />
              Switch Persona
              <ChevronDown className="w-3 h-3 ml-1" />
            </button>

            {/* User display */}
            <div className="flex items-center pl-2 text-xs text-slate-600">
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 mr-2 border border-slate-300">
                {currentUser.name ? currentUser.name[0].toUpperCase() : "U"}
              </div>
              <div className="hidden sm:block text-left mr-2">
                <div className="font-semibold text-slate-800 leading-tight">{currentUser.name}</div>
                <div className="text-[10px] text-slate-400">{currentUser.companyName || "DF Automation"}</div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Switch Persona Modal */}
      {showSwitchModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Switch User Role / Persona</h3>
                <p className="text-xs text-slate-500">Test how DF Satellite looks for different stakeholders</p>
              </div>
              <button
                onClick={() => setShowSwitchModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Internal Engineering & Operations
              </div>

              {/* Google Sign In for Engineers */}
              <button
                onClick={handleGoogleSwitch}
                disabled={loading}
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    Field Robotics Engineer (Google Account)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    engineer.lead@gmail.com • Access to Asana Portfolio & All Sites
                  </div>
                </div>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                  ENGINEER
                </span>
              </button>

              {/* Admin */}
              <button
                onClick={() => handleFastSwitch("admin")}
                disabled={loading}
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-purple-400 hover:bg-purple-50/50 transition flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                    System Administrator
                  </div>
                  <div className="text-[11px] text-slate-500">
                    admin@dfautomation.com • Full RBAC & User Management
                  </div>
                </div>
                <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">
                  ADMIN
                </span>
              </button>

              {/* Intern (Engineer Role) */}
              <button
                onClick={() => handleFastSwitch("intern")}
                disabled={loading}
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    Field Intern (Ahmad - Engineer Role)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    id: intern • Password: intern123
                  </div>
                </div>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                  ENGINEER
                </span>
              </button>

              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pt-2 mb-1">
                Customer Site Accounts (Scoped RBAC)
              </div>

              {/* Proton */}
              <button
                onClick={() => handleFastSwitch("proton")}
                disabled={loading}
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    Proton Operations
                  </div>
                  <div className="text-[11px] text-slate-500">
                    id: proton • Only sees Johor (10 AGVs) & Penang (3 ARVs)
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                  CUSTOMER
                </span>
              </button>

              {/* Perodua */}
              <button
                onClick={() => handleFastSwitch("perodua")}
                disabled={loading}
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    Perodua Manufacturing
                  </div>
                  <div className="text-[11px] text-slate-500">
                    id: perodua • Only sees Rawang Plant (4 AMRs)
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                  CUSTOMER
                </span>
              </button>

              {/* ST Muar */}
              <button
                onClick={() => handleFastSwitch("stmuar")}
                disabled={loading}
                className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    ST Microelectronics Muar
                  </div>
                  <div className="text-[11px] text-slate-500">
                    id: stmuar • Cleanroom Facility (6 AGVs/ARVs)
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                  CUSTOMER
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
