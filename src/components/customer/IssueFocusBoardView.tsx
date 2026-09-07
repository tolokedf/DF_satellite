"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, Plus, CheckCircle2, Clock, ShieldAlert, Wrench, Cpu, Users } from "lucide-react";
import { useSite } from "@/context/SiteContext";
import { format } from "date-fns";

export default function IssueFocusBoardView() {
  const { currentSiteId, currentCustomerId, currentSiteName, currentCustomerName } = useSite();
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "FIELD" | "RND" | "CUSTOMER">("ALL");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (currentSiteId && currentSiteId !== "ALL") params.append("siteId", currentSiteId);
    else if (currentCustomerId && currentCustomerId !== "ALL") params.append("companyId", currentCustomerId);

    fetch(`/api/issues?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setIssues(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentSiteId, currentCustomerId]);

  const filteredIssues = useMemo(() => {
    if (activeTab === "ALL") return issues;
    if (activeTab === "FIELD") {
      return issues.filter((i) => i.severity === "MODERATE" || i.assignedTo?.toLowerCase().includes("field"));
    }
    if (activeTab === "RND") {
      return issues.filter((i) => i.severity === "CRITICAL" || i.rootCauseCategory?.includes("SOFTWARE") || i.fiveWhyAnalysis);
    }
    if (activeTab === "CUSTOMER") {
      return issues.filter((i) => i.severity === "MAJOR" || !i.robotId);
    }
    return issues;
  }, [issues, activeTab]);

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-600" />
            <span>Issue Tracker Focus Board</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Breakdown ticket triage, 5-Why root cause investigations, and countermeasure resolution.
          </p>
        </div>

        <Link
          href="/portal/log-issue"
          className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Report Breakdown</span>
        </Link>
      </div>

      {/* Team Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none whitespace-nowrap text-xs font-bold border-b border-slate-200">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`pb-2 px-1 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === "ALL" ? "border-rose-600 text-rose-700" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>All Issues ({issues.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("FIELD")}
          className={`pb-2 px-1 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === "FIELD" ? "border-amber-600 text-amber-700" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Wrench className="w-4 h-4 text-amber-600" />
          <span>Field Team (Onsite)</span>
        </button>

        <button
          onClick={() => setActiveTab("RND")}
          className={`pb-2 px-1 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === "RND" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Cpu className="w-4 h-4 text-blue-600" />
          <span>R&D Engineering (Permanent Fix)</span>
        </button>

        <button
          onClick={() => setActiveTab("CUSTOMER")}
          className={`pb-2 px-1 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === "CUSTOMER" ? "border-purple-600 text-purple-700" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-purple-600" />
          <span>Customer Operations</span>
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIssues.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400">
            No issues found matching the selected focus filter.
          </div>
        ) : (
          filteredIssues.map((iss) => (
            <div
              key={iss.id}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold text-slate-400">{iss.issueNo}</span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                      iss.severity === "CRITICAL"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : iss.severity === "MAJOR"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    {iss.severity}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug">{iss.title}</h3>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">{iss.description || "No description provided."}</p>

                {iss.fiveWhyAnalysis && (
                  <div className="mt-2.5 p-2 bg-sky-50/70 border border-sky-100 rounded-lg text-[11px] text-sky-900">
                    <span className="font-bold block uppercase text-[9px]">5-Why Root Cause:</span>
                    <span className="line-clamp-2">{iss.fiveWhyAnalysis}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>{iss.robot ? `${iss.robot.code} (${iss.robot.type})` : "General Site"}</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded ${
                    iss.status === "CLOSED"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {iss.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
