"use client";

import React, { useState, useEffect } from "react";
import { Bot, TrendingUp, TrendingDown, Clock, MapPin } from "lucide-react";
import { useSite } from "@/context/SiteContext";

const RANGE_OPTIONS = ["7d", "30d", "90d", "6mo", "1yr", "All"];

interface FocusCard {
  id: string;
  category: string;
  status: "Active" | "Rising" | "Fixed";
  stopsCount: number;
  durationFormatted: string;
  recentCount: number;
  robotLabel: string;
  lastDate: string;
  trendPath: string;
  accentColor: "orange" | "blue" | "red" | "green";
}

export default function FocusBoardView() {
  const { currentSiteId } = useSite();
  const [selectedRange, setSelectedRange] = useState("90d");
  const [loading, setLoading] = useState(false);

  // Field Team Cards (Onsite short-term resolution)
  const fieldCards: FocusCard[] = [
    {
      id: "f1",
      category: "Panel Transfer Stuck",
      status: "Active",
      stopsCount: 52,
      durationFormatted: "2h 2m",
      recentCount: 52,
      robotLabel: "AGV 2 · 60 slot",
      lastDate: "2026-07-28",
      trendPath: "M0,25 Q15,20 30,12 T60,5 T90,20 T100,22",
      accentColor: "orange",
    },
    {
      id: "f2",
      category: "Docking",
      status: "Active",
      stopsCount: 11,
      durationFormatted: "55m",
      recentCount: 11,
      robotLabel: "AGV 2 · 60 slot",
      lastDate: "2026-07-28",
      trendPath: "M0,28 Q20,25 40,15 T80,10 T100,20",
      accentColor: "orange",
    },
    {
      id: "f3",
      category: "Stopper not going down",
      status: "Active",
      stopsCount: 8,
      durationFormatted: "42m",
      recentCount: 8,
      robotLabel: "AGV 13 · Ur output",
      lastDate: "2026-08-26",
      trendPath: "M0,20 Q30,10 60,18 T100,12",
      accentColor: "orange",
    },
  ];

  // R&D Team Cards (Permanent fix)
  const rdCards: FocusCard[] = [
    {
      id: "r1",
      category: "Map Jump",
      status: "Active",
      stopsCount: 3,
      durationFormatted: "15m",
      recentCount: 3,
      robotLabel: "ARV 1 · Zc entry door to mold",
      lastDate: "2026-07-04",
      trendPath: "M0,22 Q25,25 50,18 T80,12 T100,24",
      accentColor: "blue",
    },
    {
      id: "r2",
      category: "Traffic",
      status: "Fixed",
      stopsCount: 4,
      durationFormatted: "20m",
      recentCount: 4,
      robotLabel: "ARV 7 · Mold",
      lastDate: "2026-07-10",
      trendPath: "M0,10 Q30,12 60,22 T100,28",
      accentColor: "green",
    },
    {
      id: "r3",
      category: "Livox Malfunction",
      status: "Active",
      stopsCount: 2,
      durationFormatted: "10m",
      recentCount: 2,
      robotLabel: "AGV 10 · Zc",
      lastDate: "2026-08-26",
      trendPath: "M0,18 Q40,15 80,12 T100,14",
      accentColor: "blue",
    },
  ];

  // ST Customer Team Cards (Customer-side operation)
  const stCards: FocusCard[] = [
    {
      id: "s1",
      category: "Machine Issue",
      status: "Rising",
      stopsCount: 11,
      durationFormatted: "1h 50m",
      recentCount: 11,
      robotLabel: "ARV 8 · Buffer 60",
      lastDate: "2026-08-25",
      trendPath: "M0,28 Q30,22 60,12 T100,5",
      accentColor: "red",
    },
    {
      id: "s2",
      category: "Operation Issue",
      status: "Fixed",
      stopsCount: 40,
      durationFormatted: "3h 40m",
      recentCount: 40,
      robotLabel: "AGV 1 · Air Shower",
      lastDate: "2026-08-20",
      trendPath: "M0,8 Q35,15 70,24 T100,29",
      accentColor: "green",
    },
    {
      id: "s3",
      category: "Gripper Issue",
      status: "Rising",
      stopsCount: 6,
      durationFormatted: "35m",
      recentCount: 6,
      robotLabel: "ARV 10 · Smart rack 5",
      lastDate: "2026-08-25",
      trendPath: "M0,26 Q40,20 70,10 T100,6",
      accentColor: "red",
    },
  ];

  const renderBadge = (status: "Active" | "Rising" | "Fixed") => {
    switch (status) {
      case "Active":
        return (
          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1"></span>
            Active
          </span>
        );
      case "Rising":
        return (
          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200">
            &uarr; Rising
          </span>
        );
      case "Fixed":
        return (
          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            &darr; Fixed
          </span>
        );
    }
  };

  const renderCard = (card: FocusCard) => {
    const leftBracketColor =
      card.accentColor === "orange"
        ? "border-amber-500"
        : card.accentColor === "blue"
        ? "border-blue-500"
        : card.accentColor === "red"
        ? "border-rose-500"
        : "border-emerald-500";

    return (
      <div
        key={card.id}
        className={`bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow transition relative pl-5 border-l-4 ${leftBracketColor}`}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-sm font-bold text-slate-900 tracking-tight">{card.category}</h4>
          {renderBadge(card.status)}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-600 mb-3">
          <div>
            <span className="font-semibold text-slate-800">{card.stopsCount} stops</span>
            <span className="mx-1.5 text-slate-300">·</span>
            <span>{card.durationFormatted}</span>
            <span className="mx-1.5 text-slate-300">·</span>
            <span>
              recent{" "}
              <strong className={card.accentColor === "red" ? "text-rose-600" : "text-amber-600"}>
                {card.recentCount}
              </strong>
            </span>
          </div>

          {/* Sparkline Curve */}
          <div className="w-20 h-6 shrink-0">
            <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible">
              <path
                d={card.trendPath}
                fill="none"
                stroke={
                  card.accentColor === "red"
                    ? "#e11d48"
                    : card.accentColor === "green"
                    ? "#10b981"
                    : "#f59e0b"
                }
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1 text-slate-600 font-medium truncate">
            <Bot className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{card.robotLabel}</span>
          </div>
          <span className="shrink-0 font-mono text-[10px]">last: {card.lastDate}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Range Pill Toggle matching Pasted image (3).png */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Focus Board</h1>
          <p className="text-xs text-slate-500 mt-1">
            Short stop categories grouped by team responsibility - focus on what's Rising and Active
          </p>
        </div>

        {/* Range Pill Selector: 7d 30d 90d 6mo 1yr All */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-full text-xs font-semibold text-slate-600 shrink-0 self-start sm:self-auto">
          <span className="text-[11px] text-slate-400 pl-2 pr-1 font-bold">Range:</span>
          {RANGE_OPTIONS.map((range) => {
            const active = selectedRange === range;
            return (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-2.5 py-1 rounded-full text-xs transition ${
                  active
                    ? "bg-blue-600 text-white shadow-sm font-bold"
                    : "hover:text-slate-900 hover:bg-slate-200/60 text-slate-600"
                }`}
              >
                {range}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3 Columns: Field Team | R&D Team | ST */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Field Team */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm border-t-4 border-t-amber-500">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Field Team</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Onsite short-term resolution — every logged short stop
                </p>
              </div>
              <span className="text-2xl font-black text-amber-500">196</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between font-medium">
              <span>20 need focus · 22 resolved</span>
              <span className="font-semibold text-slate-600">16h 27m</span>
            </div>
          </div>

          <div className="space-y-3">{fieldCards.map(renderCard)}</div>
        </div>

        {/* Column 2: R&D Team */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm border-t-4 border-t-blue-500">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">R&D Team</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Permanent fix — software, firmware, algorithm, map
                </p>
              </div>
              <span className="text-2xl font-black text-blue-600">10</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between font-medium">
              <span>1 need focus · 2 resolved</span>
              <span className="font-semibold text-slate-600">50m</span>
            </div>
          </div>

          <div className="space-y-3">{rdCards.map(renderCard)}</div>
        </div>

        {/* Column 3: ST (Customer Team) */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm border-t-4 border-t-cyan-500">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">ST</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customer-side (ST) operation & equipment - visibility, not ownership
                </p>
              </div>
              <span className="text-2xl font-black text-cyan-600">57</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between font-medium">
              <span>1 need focus · 3 resolved</span>
              <span className="font-semibold text-slate-600">6h 5m</span>
            </div>
          </div>

          <div className="space-y-3">{stCards.map(renderCard)}</div>
        </div>
      </div>
    </div>
  );
}
