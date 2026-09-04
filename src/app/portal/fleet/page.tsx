"use client";

import React, { useState, useEffect } from "react";
import { Bot, Wifi, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function CustomerFleetPage() {
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
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Site Robot Fleet</h1>
        <p className="text-xs text-slate-500 mt-1">
          Active AGVs, AMRs, and ARVs operating in your authorized facility zones.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {robots.map((r) => (
          <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded">
                  {r.type}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">{r.code}</h3>
                <p className="text-xs text-slate-500">{r.name || r.model}</p>
              </div>
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
            </div>

            <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
              <div>
                <span className="text-slate-400">Site:</span> <strong>{r.site?.name}</strong>
              </div>
              <div>
                <span className="text-slate-400">Zone:</span> {r.lineZone || "Standard Route"}
              </div>
              {r.ipAddress && (
                <div>
                  <span className="text-slate-400">IP:</span> <code>{r.ipAddress}</code>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
