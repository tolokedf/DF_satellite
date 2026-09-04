"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useSite } from "@/context/SiteContext";

export default function GlobalIssuesPage() {
  const { currentSiteId, currentCustomerId } = useSite();
  const [issues, setIssues] = useState<any[]>([]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (currentSiteId && currentSiteId !== "ALL") {
      params.append("siteId", currentSiteId);
    } else if (currentCustomerId && currentCustomerId !== "ALL") {
      params.append("companyId", currentCustomerId);
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    fetch(`/api/issues${query}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setIssues(data);
      });
  }, [currentSiteId, currentCustomerId]);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Global Issue Tracker</h1>
        <p className="text-xs text-slate-500 mt-1">Multi-site breakdown tickets, root cause analysis and resolution status.</p>
      </div>

      <div className="space-y-3">
        {issues.map((iss) => (
          <div key={iss.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-400">{iss.issueNo}</span>
                  <span className="text-[11px] font-semibold text-slate-700">
                    {iss.site?.company?.name} - {iss.site?.name}
                  </span>
                  {iss.robot && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {iss.robot.code}
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      iss.severity === "CRITICAL"
                        ? "bg-rose-100 text-rose-800"
                        : iss.severity === "MAJOR"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {iss.severity}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{iss.title}</h3>
                <p className="text-xs text-slate-600 mt-1">{iss.description}</p>
              </div>

              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                  iss.status === "CLOSED"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : iss.status === "VALIDATING"
                    ? "bg-purple-50 text-purple-800 border-purple-300"
                    : "bg-rose-50 text-rose-800 border-rose-300"
                }`}
              >
                {iss.status}
              </span>
            </div>

            {(iss.fiveWhyAnalysis || iss.permanentCountermeasure) && (
              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {iss.fiveWhyAnalysis && (
                  <div className="bg-sky-50/70 p-2.5 rounded-lg border border-sky-100">
                    <span className="font-bold text-sky-900 block text-[10px] uppercase">
                      5-Why Root Cause Analysis
                    </span>
                    <p className="text-slate-700 mt-0.5">{iss.fiveWhyAnalysis}</p>
                  </div>
                )}
                {iss.permanentCountermeasure && (
                  <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100">
                    <span className="font-bold text-emerald-900 block text-[10px] uppercase">
                      Permanent Countermeasure
                    </span>
                    <p className="text-slate-700 mt-0.5">{iss.permanentCountermeasure}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
