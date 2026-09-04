"use client";

import React, { useState, useEffect } from "react";
import { Printer, QrCode } from "lucide-react";
import { useSite } from "@/context/SiteContext";

const SHOW_FILTERS = ["All", "AGVs", "ARVs", "Smart Racks", "Zones"];

export default function QrCodesView() {
  const { currentSiteId, currentCustomerId } = useSite();
  const [robots, setRobots] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>("All");

  // Custom QR Builder state
  const [builderEquipment, setBuilderEquipment] = useState<string>("-");
  const [builderZone, setBuilderZone] = useState<string>("-");
  const [builderStation, setBuilderStation] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (currentSiteId && currentSiteId !== "ALL") {
      params.append("siteId", currentSiteId);
    } else if (currentCustomerId && currentCustomerId !== "ALL") {
      params.append("companyId", currentCustomerId);
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    fetch(`/api/robots${query}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setRobots(data);
      });
  }, [currentSiteId, currentCustomerId]);

  const filteredRobots = robots.filter((r) => {
    if (selectedFilter === "AGVs") return r.type === "AGV";
    if (selectedFilter === "ARVs") return r.type === "ARV";
    if (selectedFilter === "Smart Racks") return r.name?.toLowerCase().includes("rack");
    if (selectedFilter === "Zones") return !!r.lineZone;
    return true;
  });

  const handlePrintAll = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // SVG QR Code graphic generator
  const renderQrSvg = (code: string) => {
    return (
      <svg
        viewBox="0 0 100 100"
        className="w-36 h-36 mx-auto my-2 text-slate-900"
        fill="currentColor"
      >
        {/* Finder pattern Top-Left */}
        <rect x="5" y="5" width="28" height="28" fill="black" rx="2" />
        <rect x="9" y="9" width="20" height="20" fill="white" />
        <rect x="13" y="13" width="12" height="12" fill="black" />

        {/* Finder pattern Top-Right */}
        <rect x="67" y="5" width="28" height="28" fill="black" rx="2" />
        <rect x="71" y="9" width="20" height="20" fill="white" />
        <rect x="75" y="13" width="12" height="12" fill="black" />

        {/* Finder pattern Bottom-Left */}
        <rect x="5" y="67" width="28" height="28" fill="black" rx="2" />
        <rect x="9" y="71" width="20" height="20" fill="white" />
        <rect x="13" y="75" width="12" height="12" fill="black" />

        {/* Data points */}
        <rect x="38" y="8" width="6" height="6" fill="black" />
        <rect x="48" y="12" width="6" height="6" fill="black" />
        <rect x="56" y="6" width="6" height="6" fill="black" />
        <rect x="38" y="24" width="6" height="6" fill="black" />
        <rect x="48" y="26" width="6" height="6" fill="black" />

        <rect x="8" y="38" width="6" height="6" fill="black" />
        <rect x="22" y="44" width="6" height="6" fill="black" />
        <rect x="36" y="38" width="6" height="6" fill="black" />
        <rect x="46" y="42" width="6" height="6" fill="black" />
        <rect x="58" y="38" width="6" height="6" fill="black" />
        <rect x="68" y="44" width="6" height="6" fill="black" />
        <rect x="82" y="38" width="6" height="6" fill="black" />

        <rect x="12" y="52" width="6" height="6" fill="black" />
        <rect x="28" y="54" width="6" height="6" fill="black" />
        <rect x="38" y="50" width="6" height="6" fill="black" />
        <rect x="52" y="52" width="6" height="6" fill="black" />
        <rect x="64" y="54" width="6" height="6" fill="black" />
        <rect x="78" y="52" width="6" height="6" fill="black" />

        <rect x="38" y="66" width="6" height="6" fill="black" />
        <rect x="48" y="72" width="6" height="6" fill="black" />
        <rect x="58" y="68" width="6" height="6" fill="black" />
        <rect x="70" y="76" width="6" height="6" fill="black" />
        <rect x="84" y="72" width="6" height="6" fill="black" />

        <rect x="42" y="84" width="6" height="6" fill="black" />
        <rect x="54" y="86" width="6" height="6" fill="black" />
        <rect x="66" y="84" width="6" height="6" fill="black" />
        <rect x="78" y="88" width="6" height="6" fill="black" />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title & Subtitle matching Pasted image (5).png */}
      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          QR Code Generator
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
          Print and stick these QR codes around the floor. Operators scan to auto-fill the short stop form.
          The yellow generic code below is for any operator to report a stop (no equipment pre-fill).
        </p>
      </div>

      {/* Custom QR Builder Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
          Custom QR Builder
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Equipment</label>
            <select
              value={builderEquipment}
              onChange={(e) => setBuilderEquipment(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="-">-</option>
              {robots.map((r) => (
                <option key={r.id} value={r.code}>
                  {r.code}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Zone</label>
            <select
              value={builderZone}
              onChange={(e) => setBuilderZone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="-">-</option>
              <option value="Zone A">Zone A</option>
              <option value="Zone B">Zone B</option>
              <option value="C">Zone C</option>
              <option value="F">Zone F</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Station (optional)
            </label>
            <input
              type="text"
              value={builderStation}
              onChange={(e) => setBuilderStation(e.target.value)}
              placeholder="e.g. DV-P-APO-DB-06"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <button
              type="button"
              className="w-full bg-[#c8e84a] hover:bg-[#b8da38] text-slate-900 font-bold text-xs py-2 px-4 rounded-lg shadow-sm transition"
            >
              Generate
            </button>
          </div>
        </div>
      </div>

      {/* Show Pills Filter Row & Print All button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-1">
          <span className="text-xs font-semibold text-slate-600 mr-2">Show:</span>
          {SHOW_FILTERS.map((f) => {
            const active = selectedFilter === f;
            return (
              <button
                key={f}
                onClick={() => setSelectedFilter(f)}
                className={`text-xs px-3 py-1 rounded-lg font-medium transition ${
                  active
                    ? "bg-blue-100 text-blue-800 font-bold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handlePrintAll}
          className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-300 px-3.5 py-1.5 rounded-lg text-xs transition self-start sm:self-auto"
        >
          <Printer className="w-3.5 h-3.5 text-slate-500" />
          <span>Print All</span>
        </button>
      </div>

      {/* Grid of QR Code Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: Generic Yellow Highlighted Card */}
        <div className="bg-amber-50/50 rounded-xl border-2 border-amber-300 shadow-sm overflow-hidden flex flex-col justify-between text-center">
          {/* Top Banner Ribbon */}
          <div className="bg-slate-900 text-amber-300 text-[10px] font-black uppercase tracking-wider py-1.5 px-2">
            SCAN TO REPORT A STOP
          </div>

          <div className="p-4 flex flex-col items-center">
            {renderQrSvg("GENERIC_REPORT_STOP")}
            <h4 className="text-sm font-bold text-slate-900 mt-2">Report a Stop</h4>
            <div className="text-xs text-slate-500 font-medium mt-0.5">
              Generic - any AGV / location
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-tight">
              Scan with your phone camera. Fill in the short stop form.
            </p>
          </div>
        </div>

        {/* Individual Robot QR Cards */}
        {filteredRobots.map((robot) => (
          <div
            key={robot.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between text-center hover:shadow transition"
          >
            {/* Top Banner Ribbon */}
            <div className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider py-1.5 px-2">
              SCAN TO REPORT A STOP
            </div>

            <div className="p-4 flex flex-col items-center">
              {renderQrSvg(robot.code)}
              <h4 className="text-sm font-bold text-slate-900 mt-2">{robot.code}</h4>
              <div className="text-xs text-slate-500 font-medium mt-0.5">{robot.type}</div>
              <p className="text-[11px] text-slate-400 mt-2 leading-tight">
                Scan to log a stop for <strong>{robot.code}</strong>. AGV pre-filled.
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
