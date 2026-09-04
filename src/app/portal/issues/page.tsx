"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Plus, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export default function CustomerIssuesPage() {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/issues")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setIssues(data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Site Robot Issues</h1>
          <p className="text-xs text-slate-500 mt-1">Status of ongoing breakdown tickets and countermeasures.</p>
        </div>
        <Link
          href="/portal/log-issue"
          className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Report New Issue</span>
        </Link>
      </div>

      <div className="space-y-3">
        {issues.map((iss) => (
          <div key={iss.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-400">{iss.issueNo}</span>
                  {iss.robot && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {iss.robot.code} ({iss.robot.model})
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

            {iss.permanentCountermeasure && (
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                <span className="font-bold text-emerald-900 block text-[10px] uppercase">
                  Permanent Countermeasure from DF Engineering
                </span>
                <p className="text-slate-700 mt-0.5">{iss.permanentCountermeasure}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
