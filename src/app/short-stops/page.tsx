"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";

export default function GlobalShortStopsPage() {
  const [stops, setStops] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/short-stops?limit=100")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setStops(data);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Global Short Stop Feed</h1>
        <p className="text-xs text-slate-500 mt-1">Cross-site micro-stoppage telemetry across all customer deployments.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <th className="py-2.5 px-3 w-36">Time</th>
              <th className="py-2.5 px-3">Customer & Site</th>
              <th className="py-2.5 px-3 w-28">Robot</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">Specific Location</th>
              <th className="py-2.5 px-3 w-24">Downtime</th>
              <th className="py-2.5 px-3">Recovery Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {stops.map((stop) => (
              <tr key={stop.id} className="hover:bg-slate-50 transition">
                <td className="py-3 px-3 text-slate-600">
                  {format(new Date(stop.startTime), "dd/MM/yyyy HH:mm")}
                </td>
                <td className="py-3 px-3 text-slate-800 font-medium">
                  {stop.site?.company?.name} - {stop.site?.name}
                </td>
                <td className="py-3 px-3 font-bold text-slate-900">{stop.robot?.code}</td>
                <td className="py-3 px-3">
                  <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                    {stop.category}
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-600">{stop.specificLocation || stop.zone || "-"}</td>
                <td className="py-3 px-3 font-semibold text-slate-800">{stop.durationMinutes} min</td>
                <td className="py-3 px-3 text-slate-600">{stop.recoveryAction || "Auto Resume"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
