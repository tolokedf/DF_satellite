"use client";

import React, { useState, useEffect } from "react";
import { Printer, AlertTriangle, QrCode } from "lucide-react";
import { useSite } from "@/context/SiteContext";

const SHOW_FILTERS = ["All", "AGVs", "ARVs", "AMRs"];

export default function IssueQrCodesView() {
  const { currentSiteId, currentCustomerId } = useSite();
  const [robots, setRobots] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>("All");

  useEffect(() => {
    const params = new URLSearchParams();
    if (currentSiteId && currentSiteId !== "ALL") params.append("siteId", currentSiteId);
    else if (currentCustomerId && currentCustomerId !== "ALL") params.append("companyId", currentCustomerId);

    fetch(`/api/robots?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setRobots(data);
      });
  }, [currentSiteId, currentCustomerId]);

  const filteredRobots = robots.filter((r) => {
    if (selectedFilter === "AGVs") return r.type === "AGV";
    if (selectedFilter === "ARVs") return r.type === "ARV";
    if (selectedFilter === "AMRs") return r.type === "AMR";
    return true;
  });

  const renderQrSvg = () => (
    <svg viewBox="0 0 100 100" className="w-36 h-36 mx-auto my-2 text-slate-900" fill="currentColor">
      <rect x="5" y="5" width="28" height="28" fill="black" rx="2" />
      <rect x="9" y="9" width="20" height="20" fill="white" />
      <rect x="13" y="13" width="12" height="12" fill="black" />
      <rect x="67" y="5" width="28" height="28" fill="black" rx="2" />
      <rect x="71" y="9" width="20" height="20" fill="white" />
      <rect x="75" y="13" width="12" height="12" fill="black" />
      <rect x="5" y="67" width="28" height="28" fill="black" rx="2" />
      <rect x="9" y="71" width="20" height="20" fill="white" />
      <rect x="13" y="75" width="12" height="12" fill="black" />
      <rect x="40" y="8" width="6" height="6" fill="black" />
      <rect x="50" y="12" width="8" height="8" fill="black" />
      <rect x="42" y="24" width="8" height="8" fill="black" />
      <rect x="10" y="40" width="8" height="8" fill="black" />
      <rect x="24" y="44" width="8" height="8" fill="black" />
      <rect x="40" y="40" width="16" height="16" fill="#e11d48" rx="2" />
      <rect x="62" y="42" width="6" height="14" fill="black" />
      <rect x="75" y="48" width="12" height="6" fill="black" />
      <rect x="40" y="66" width="10" height="8" fill="black" />
      <rect x="56" y="72" width="8" height="12" fill="black" />
      <rect x="72" y="68" width="14" height="6" fill="black" />
      <rect x="80" y="80" width="10" height="10" fill="black" />
    </svg>
  );

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <QrCode className="w-6 h-6 text-rose-600" />
            <span>Issue Tracker QR Placards</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Printable barcodes for equipment chassis. Scanning opens the direct breakdown ticketing form.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold px-3.5 py-2 rounded-lg text-xs shadow-sm transition self-start sm:self-auto"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print All Placards</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {SHOW_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setSelectedFilter(f)}
            className={`text-xs px-3 py-1 rounded-lg font-medium transition ${
              selectedFilter === f ? "bg-rose-600 text-white font-bold shadow-xs" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* QR Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredRobots.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-xl border-2 border-rose-300 shadow-sm overflow-hidden flex flex-col justify-between text-center"
          >
            <div className="bg-rose-700 text-white text-[10px] font-black uppercase tracking-wider py-1.5 px-2 flex items-center justify-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>SCAN TO REPORT BREAKDOWN</span>
            </div>

            <div className="p-4 space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {r.site?.name || "Factory Fleet"}
              </div>
              <div className="text-xl font-black text-slate-900 tracking-tight">
                {r.code}
              </div>
              <div className="text-xs text-slate-600 font-medium">
                {r.name || r.model} • {r.type}
              </div>

              {renderQrSvg()}

              <div className="bg-slate-50 p-2 rounded-lg text-[10px] text-slate-500 font-mono break-all border border-slate-200">
                /portal/log-issue?robotId={r.code}
              </div>
            </div>

            <div className="bg-slate-100 py-1.5 px-3 text-[10px] font-bold text-slate-600 border-t border-slate-200 uppercase">
              DF Automation & Robotics Support
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
