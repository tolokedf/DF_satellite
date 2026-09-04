"use client";

import React, { useState, useEffect } from "react";
import { Bot, Plus, Building2, Search } from "lucide-react";

export default function GlobalRobotsPage() {
  const [robots, setRobots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/robots")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setRobots(data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Robot Fleet Registry</h1>
        <p className="text-xs text-slate-500 mt-1">All commissioned AGVs, AMRs, and ARVs across all field sites.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <th className="py-2.5 px-3">Robot Code</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Model</th>
              <th className="py-2.5 px-3">Customer Site</th>
              <th className="py-2.5 px-3">Zone / Operating Area</th>
              <th className="py-2.5 px-3">IP Address</th>
              <th className="py-2.5 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {robots.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 transition">
                <td className="py-3 px-3 font-bold text-slate-900">{r.code}</td>
                <td className="py-3 px-3 font-semibold text-blue-700">{r.type}</td>
                <td className="py-3 px-3 text-slate-700">{r.model}</td>
                <td className="py-3 px-3 text-slate-700">
                  {r.site?.company?.name} - {r.site?.name}
                </td>
                <td className="py-3 px-3 text-slate-600">{r.lineZone || "-"}</td>
                <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{r.ipAddress || "-"}</td>
                <td className="py-3 px-3">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      r.status === "RUNNING"
                        ? "bg-emerald-100 text-emerald-800"
                        : r.status === "SHORT_STOP"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
