"use client";

import React, { useState, useEffect } from "react";
import { 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  ComposedChart 
} from "recharts";
import { Download, FileText, Calendar } from "lucide-react";
import { useSite } from "@/context/SiteContext";

const TEAMS = ["All", "Field", "R&D", "ST"];
const SOURCES = ["Both", "Manual", "Auto (synced)"];
const VIEWS = ["Daily", "Weekly", "Monthly", "Annually"];
const RANGES = ["7d", "30d", "90d", "6mo", "1yr", "All"];

// Weekly Trend Data matching reference chart in Pasted image (4).png
const SAMPLE_TREND_DATA = [
  { period: "W36 2025", stopCount: 210, downtimeMin: 1020, avgPeriod: 220 },
  { period: "W40 2025", stopCount: 240, downtimeMin: 800, avgPeriod: 250 },
  { period: "W44 2025", stopCount: 280, downtimeMin: 1200, avgPeriod: 270 },
  { period: "W48 2025", stopCount: 310, downtimeMin: 1350, avgPeriod: 300 },
  { period: "W52 2025", stopCount: 160, downtimeMin: 1720, avgPeriod: 280 },
  { period: "W04 2026", stopCount: 130, downtimeMin: 700, avgPeriod: 210 },
  { period: "W08 2026", stopCount: 120, downtimeMin: 550, avgPeriod: 180 },
  { period: "W12 2026", stopCount: 290, downtimeMin: 1300, avgPeriod: 240 },
  { period: "W16 2026", stopCount: 420, downtimeMin: 1250, avgPeriod: 290 },
  { period: "W20 2026", stopCount: 230, downtimeMin: 1050, avgPeriod: 270 },
  { period: "W24 2026", stopCount: 360, downtimeMin: 1200, avgPeriod: 310 },
  { period: "W28 2026", stopCount: 180, downtimeMin: 500, avgPeriod: 260 },
  { period: "W32 2026", stopCount: 120, downtimeMin: 400, avgPeriod: 190 },
  { period: "W35 2026", stopCount: 8, downtimeMin: 45, avgPeriod: 50 },
];

export default function AnalyticsView() {
  const { currentSiteId } = useSite();

  const [selectedTeam, setSelectedTeam] = useState<string>("Field");
  const [selectedSource, setSelectedSource] = useState<string>("Both");
  const [selectedView, setSelectedView] = useState<string>("Weekly");
  const [selectedRange, setSelectedRange] = useState<string>("1yr");

  const [startDate, setStartDate] = useState<string>("2025-09-04");
  const [endDate, setEndDate] = useState<string>("2026-09-04");

  const [chartData, setChartData] = useState(SAMPLE_TREND_DATA);

  const teamDescriptions: Record<string, string> = {
    All: "All Teams - combined cross-functional stoppage trends",
    Field: "Field Team - onsite short-term resolution",
    "R&D": "R&D Team - permanent software, firmware and engineering fixes",
    ST: "Customer Team - customer-side equipment and facilities visibility",
  };

  const handleExportCsv = () => {
    const headers = ["Period,Stop Count,Downtime (min),4-period Avg"];
    const rows = chartData.map((d) => `${d.period},${d.stopCount},${d.downtimeMin},${d.avgPeriod}`);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics_trend_${formatDate(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  function formatDate(d: Date) {
    return d.toISOString().slice(0, 10);
  }

  return (
    <div className="space-y-5">
      {/* Top Filter Bar matching Pasted image (4).png */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Team Pills: All | Field | R&D | ST */}
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold text-slate-700 mr-1">Team:</span>
              {TEAMS.map((team) => {
                const active = selectedTeam === team;
                return (
                  <button
                    key={team}
                    onClick={() => setSelectedTeam(team)}
                    className={`text-xs px-3 py-1 rounded-lg font-semibold transition ${
                      active
                        ? "bg-amber-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {team}
                  </button>
                );
              })}
            </div>

            <span className="text-slate-300 hidden sm:inline">|</span>

            {/* Source Pills: Both | Manual | Auto (synced) */}
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold text-slate-700 mr-1">Source:</span>
              {SOURCES.map((source) => {
                const active = selectedSource === source;
                return (
                  <button
                    key={source}
                    onClick={() => setSelectedSource(source)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                      active
                        ? "bg-slate-200 text-slate-900 font-bold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {source}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Buttons: Management report & Export view (CSV) */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-300 px-3 py-1.5 rounded-lg text-xs transition"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Management report</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center space-x-1.5 bg-[#c8e84a] hover:bg-[#b8da38] text-slate-900 font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export view (CSV)</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-100">
          {teamDescriptions[selectedTeam] || teamDescriptions.Field}
        </p>
      </div>

      {/* Period & Date Controls Row */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* View: Daily | Weekly | Monthly | Annually */}
            <div className="flex items-center space-x-1">
              <span className="text-xs font-semibold text-slate-700 mr-1.5">View:</span>
              <div className="flex bg-slate-100 p-0.5 rounded-lg">
                {VIEWS.map((v) => {
                  const active = selectedView === v;
                  return (
                    <button
                      key={v}
                      onClick={() => setSelectedView(v)}
                      className={`text-xs px-2.5 py-1 rounded-md font-semibold transition ${
                        active
                          ? "bg-blue-700 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Range: 7d | 30d | 90d | 6mo | 1yr | All */}
            <div className="flex items-center space-x-1">
              <span className="text-xs font-semibold text-slate-700 mr-1.5">Range:</span>
              <div className="flex bg-slate-100 p-0.5 rounded-lg">
                {RANGES.map((r) => {
                  const active = selectedRange === r;
                  return (
                    <button
                      key={r}
                      onClick={() => setSelectedRange(r)}
                      className={`text-xs px-2.5 py-1 rounded-md font-semibold transition ${
                        active
                          ? "bg-blue-700 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Date Picker Range + Apply */}
          <div className="flex items-center space-x-2 self-start xl:self-auto">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none"
            />
            <span className="text-xs text-slate-400">&rarr;</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none"
            />
            <button
              type="button"
              className="bg-[#c8e84a] hover:bg-[#b8da38] text-slate-900 font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-sm transition"
            >
              Apply
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          Showing: {startDate} &rarr; {endDate}
        </p>
      </div>

      {/* 4 KPI Metric Cards in a Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL STOPS */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            TOTAL STOPS
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">4,290</div>
          <div className="text-xs text-slate-500 mt-1 font-medium">4289 manual · 1 auto</div>
        </div>

        {/* LATEST WEEK */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            LATEST WEEK
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">7</div>
          <div className="text-xs text-emerald-600 mt-1 font-semibold">
            -30% vs previous week
          </div>
        </div>

        {/* TOTAL DOWNTIME */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            TOTAL DOWNTIME
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">12d 5h</div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            Avg: 4.7 min · Max: 9h 0m
          </div>
        </div>

        {/* TOP CAUSE */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            TOP CAUSE
          </div>
          <div className="text-xl font-extrabold text-slate-900 mt-1 truncate">
            Panel Transfer Stuck
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">995 stops</div>
        </div>
      </div>

      {/* Main Dual-Axis Chart: Weekly Short Stop Trend */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4 tracking-tight">
          Weekly Short Stop Trend
        </h3>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} />
              {/* Left Y-axis: Count */}
              <YAxis
                yAxisId="left"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={[0, 450]}
              />
              {/* Right Y-axis: Downtime Minutes */}
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={[0, 1800]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
                  fontSize: "12px",
                }}
              />
              <Legend
                verticalAlign="top"
                align="center"
                iconSize={10}
                wrapperStyle={{ paddingBottom: "12px", fontSize: "12px" }}
              />

              {/* Bar: Stop Count */}
              <Bar
                yAxisId="left"
                dataKey="stopCount"
                name="Stop Count"
                fill="#60a5fa"
                radius={[3, 3, 0, 0]}
              />

              {/* Red Line: Downtime (min) */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="downtimeMin"
                name="Downtime (min)"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
              />

              {/* Green Dashed Line: 4-period Avg */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="avgPeriod"
                name="4-period Avg"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
