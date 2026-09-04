"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Clock, Search, Filter } from "lucide-react";

export default function CustomerFeedPage() {
  const [stops, setStops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/short-stops?limit=50")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setStops(data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Recent Short Stop Feed</h1>
        <p className="text-xs text-slate-500 mt-1">Real-time log of robot pauses and stoppages on your site.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <th className="py-2.5 px-3 w-36">Time</th>
              <th className="py-2.5 px-3 w-28">Robot</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">Location / Zone</th>
              <th className="py-2.5 px-3 w-24">Downtime</th>
              <th className="py-2.5 px-3 w-32">Recovery Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {stops.map((stop) => (
              <tr key={stop.id} className="hover:bg-slate-50 transition">
                <td className="py-3 px-3 text-slate-600">
                  {format(new Date(stop.startTime), "yyyy-MM-dd HH:mm")}
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
