"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Bot, TrendingUp, TrendingDown, Clock, MapPin, CheckCircle2 } from "lucide-react";
import { useSite } from "@/context/SiteContext";
import { format, subDays } from "date-fns";

const RANGE_OPTIONS = ["7d", "30d", "90d", "6mo", "1yr", "All"];

interface FocusCard {
  id: string;
  category: string;
  team: "FIELD" | "RND" | "CUSTOMER";
  status: "Active" | "Rising" | "Fixed";
  stopsCount: number;
  durationFormatted: string;
  durationMinutes: number;
  recentCount: number;
  robotLabel: string;
  lastDate: string;
  trendPath: string;
  accentColor: "orange" | "blue" | "red" | "green";
}

export default function FocusBoardView() {
  const { currentSiteId, currentCustomerId, currentCustomerName } = useSite();
  const [selectedRange, setSelectedRange] = useState("90d");
  const [stops, setStops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (currentSiteId && currentSiteId !== "ALL") {
      params.append("siteId", currentSiteId);
    } else if (currentCustomerId && currentCustomerId !== "ALL") {
      params.append("companyId", currentCustomerId);
    }
    params.append("limit", "500");

    fetch(`/api/short-stops?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setStops(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentSiteId, currentCustomerId]);

  const filteredStops = useMemo(() => {
    const now = new Date();
    let minTime = 0;
    if (selectedRange === "7d") minTime = subDays(now, 7).getTime();
    else if (selectedRange === "30d") minTime = subDays(now, 30).getTime();
    else if (selectedRange === "90d") minTime = subDays(now, 90).getTime();
    else if (selectedRange === "6mo") minTime = subDays(now, 180).getTime();
    else if (selectedRange === "1yr") minTime = subDays(now, 365).getTime();

    return stops.filter((s) => {
      if (!minTime) return true;
      return new Date(s.startTime).getTime() >= minTime;
    });
  }, [stops, selectedRange]);

  const { fieldCards, rdCards, customerCards, fieldStats, rdStats, customerStats } = useMemo(() => {
    const isRdCategory = (cat: string) => {
      const lower = cat.toLowerCase();
      return (
        lower.includes("map") ||
        lower.includes("livox") ||
        lower.includes("software") ||
        lower.includes("traffic") ||
        lower.includes("firmware") ||
        lower.includes("algo") ||
        lower.includes("lidar") ||
        lower.includes("nav")
      );
    };

    const isCustomerCategory = (cat: string) => {
      const lower = cat.toLowerCase();
      return (
        lower.includes("machine") ||
        lower.includes("operation") ||
        lower.includes("facility") ||
        lower.includes("rack") ||
        lower.includes("conveyor") ||
        lower.includes("station") ||
        lower.includes("power") ||
        lower.includes("operator")
      );
    };

    const catMap = new Map<string, any[]>();
    filteredStops.forEach((s) => {
      const cat = s.category || "General Stop";
      const list = catMap.get(cat) || [];
      list.push(s);
      catMap.set(cat, list);
    });

    const now = new Date();
    const sevenDaysAgo = subDays(now, 7).getTime();
    const fourteenDaysAgo = subDays(now, 14).getTime();

    const formatDuration = (mins: number) => {
      if (mins < 60) return `${Math.round(mins)}m`;
      const h = Math.floor(mins / 60);
      const m = Math.round(mins % 60);
      return `${h}h ${m}m`;
    };

    const cards: FocusCard[] = [];

    Array.from(catMap.entries()).forEach(([cat, catStops], idx) => {
      let team: "FIELD" | "RND" | "CUSTOMER" = "FIELD";
      if (isRdCategory(cat)) team = "RND";
      else if (isCustomerCategory(cat)) team = "CUSTOMER";

      const count = catStops.length;
      const totalMins = catStops.reduce(
        (sum: number, s: any) => sum + (Number(s.durationMinutes) || 1),
        0
      );
      const recent = catStops.filter(
        (s: any) => new Date(s.startTime).getTime() >= fourteenDaysAgo
      ).length;
      const lastWeek = catStops.filter(
        (s: any) => new Date(s.startTime).getTime() >= sevenDaysAgo
      ).length;

      // Sort by date descending
      catStops.sort(
        (a: any, b: any) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
      const latest = catStops[0];
      const lastDate = latest
        ? format(new Date(latest.startTime), "dd/MM/yyyy")
        : "-";
      const robotLabel = latest
        ? `${latest.robot?.code || "Robot"} · ${
            latest.specificLocation || latest.zone || "Main floor"
          }`
        : "Robot";

      let status: "Active" | "Rising" | "Fixed" = "Active";
      let accentColor: "orange" | "blue" | "red" | "green" =
        team === "RND" ? "blue" : "orange";

      if (lastWeek > 0 && lastWeek >= count * 0.4) {
        status = "Rising";
        accentColor = "red";
      } else if (recent === 0) {
        status = "Fixed";
        accentColor = "green";
      }

      cards.push({
        id: `card-${idx}-${cat}`,
        category: cat,
        team,
        status,
        stopsCount: count,
        durationFormatted: formatDuration(totalMins),
        durationMinutes: totalMins,
        recentCount: recent,
        robotLabel,
        lastDate,
        trendPath:
          status === "Rising"
            ? "M0,28 Q30,22 60,12 T100,5"
            : status === "Fixed"
            ? "M0,8 Q35,15 70,24 T100,29"
            : "M0,20 Q30,10 60,18 T100,12",
        accentColor,
      });
    });

    const fCards = cards.filter((c) => c.team === "FIELD");
    const rCards = cards.filter((c) => c.team === "RND");
    const cCards = cards.filter((c) => c.team === "CUSTOMER");

    const getStats = (teamCards: FocusCard[]) => {
      const totalStops = teamCards.reduce((acc, c) => acc + c.stopsCount, 0);
      const totalMins = teamCards.reduce((acc, c) => acc + c.durationMinutes, 0);
      const needFocus = teamCards.filter(
        (c) => c.status === "Active" || c.status === "Rising"
      ).length;
      const resolved = teamCards.filter((c) => c.status === "Fixed").length;
      return {
        totalStops,
        durationFormatted: formatDuration(totalMins),
        needFocus,
        resolved,
      };
    };

    return {
      fieldCards: fCards,
      rdCards: rCards,
      customerCards: cCards,
      fieldStats: getStats(fCards),
      rdStats: getStats(rCards),
      customerStats: getStats(cCards),
    };
  }, [filteredStops]);

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

  const customerColumnTitle =
    currentCustomerName && currentCustomerName !== "All Customers"
      ? currentCustomerName
      : "Customer Team";

  return (
    <div className="space-y-6">
      {/* Top Header & Range Pill Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Focus Board</h1>
          <p className="text-xs text-slate-500 mt-1">
            Short stop categories grouped by team responsibility - focus on what&apos;s Rising and Active
          </p>
        </div>

        {/* Range Pill Selector */}
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

      {/* 3 Columns: Field Team | R&D Team | Customer Team */}
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
              <span className="text-2xl font-black text-amber-500">{fieldStats.totalStops}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between font-medium">
              <span>
                {fieldStats.needFocus} need focus · {fieldStats.resolved} resolved
              </span>
              <span className="font-semibold text-slate-600">{fieldStats.durationFormatted}</span>
            </div>
          </div>

          <div className="space-y-3">
            {fieldCards.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 italic">
                No Field Team focus issues in this range.
              </div>
            ) : (
              fieldCards.map(renderCard)
            )}
          </div>
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
              <span className="text-2xl font-black text-blue-600">{rdStats.totalStops}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between font-medium">
              <span>
                {rdStats.needFocus} need focus · {rdStats.resolved} resolved
              </span>
              <span className="font-semibold text-slate-600">{rdStats.durationFormatted}</span>
            </div>
          </div>

          <div className="space-y-3">
            {rdCards.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 italic">
                No R&D Team focus issues in this range.
              </div>
            ) : (
              rdCards.map(renderCard)
            )}
          </div>
        </div>

        {/* Column 3: Customer Team */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm border-t-4 border-t-cyan-500">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">{customerColumnTitle}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customer-side operation & equipment - visibility, not ownership
                </p>
              </div>
              <span className="text-2xl font-black text-cyan-600">{customerStats.totalStops}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between font-medium">
              <span>
                {customerStats.needFocus} need focus · {customerStats.resolved} resolved
              </span>
              <span className="font-semibold text-slate-600">{customerStats.durationFormatted}</span>
            </div>
          </div>

          <div className="space-y-3">
            {customerCards.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 italic">
                No customer operation focus issues in this range.
              </div>
            ) : (
              customerCards.map(renderCard)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
