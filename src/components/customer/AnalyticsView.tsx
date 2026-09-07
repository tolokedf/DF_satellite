"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { Download, FileText, Calendar, Printer, X, CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";
import { format, subDays, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import { useSite } from "@/context/SiteContext";

const TEAMS = ["All", "Field", "R&D", "ST"];
const SOURCES = ["Both", "Manual", "Auto (synced)"];
const VIEWS = ["Daily", "Weekly", "Monthly", "Annually"];
const RANGES = ["7d", "30d", "90d", "6mo", "1yr", "All"];

export default function AnalyticsView() {
  const { currentSiteId, currentCustomerId, currentSiteName, currentCustomerName } = useSite();

  const [stops, setStops] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedTeam, setSelectedTeam] = useState<string>("All");
  const [selectedSource, setSelectedSource] = useState<string>("Both");
  const [selectedView, setSelectedView] = useState<string>("Weekly");
  const [selectedRange, setSelectedRange] = useState<string>("30d");

  // Default dates: past 30 days
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const defaultStartStr = format(subDays(new Date(), 30), "yyyy-MM-dd");

  const [startDate, setStartDate] = useState<string>(defaultStartStr);
  const [endDate, setEndDate] = useState<string>(todayStr);

  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  const teamDescriptions: Record<string, string> = {
    All: "All Teams - combined cross-functional stoppage trends",
    Field: "Field Team - onsite short-term resolution",
    "R&D": "R&D Team - permanent software, firmware and engineering fixes",
    ST: "Customer Team - customer-side equipment and facilities visibility",
  };

  // Fetch stops from API
  const fetchStops = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentSiteId && currentSiteId !== "ALL") {
        params.append("siteId", currentSiteId);
      } else if (currentCustomerId && currentCustomerId !== "ALL") {
        params.append("companyId", currentCustomerId);
      }
      params.append("limit", "1000");

      const res = await fetch(`/api/short-stops?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setStops(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStops();
  }, [currentSiteId, currentCustomerId]);

  // Handle range change
  const handleRangeChange = (range: string) => {
    setSelectedRange(range);
    const now = new Date();
    let start = subDays(now, 30);

    if (range === "7d") start = subDays(now, 7);
    else if (range === "30d") start = subDays(now, 30);
    else if (range === "90d") start = subDays(now, 90);
    else if (range === "6mo") start = subDays(now, 180);
    else if (range === "1yr") start = subDays(now, 365);
    else if (range === "All") start = subDays(now, 730);

    setStartDate(format(start, "yyyy-MM-dd"));
    setEndDate(format(now, "yyyy-MM-dd"));
  };

  // Filtered stops based on dates, team, source
  const filteredStops = useMemo(() => {
    const sDate = new Date(`${startDate}T00:00:00`);
    const eDate = new Date(`${endDate}T23:59:59`);

    return stops.filter((item) => {
      const itemTime = new Date(item.startTime).getTime();
      if (itemTime < sDate.getTime() || itemTime > eDate.getTime()) {
        return false;
      }
      if (selectedSource === "Manual" && item.source !== "Manual") return false;
      if (selectedSource === "Auto (synced)" && item.source !== "Auto (synced)") return false;
      return true;
    });
  }, [stops, startDate, endDate, selectedSource]);

  // Dynamic Chart & KPI Data
  const { chartData, kpis, topCategories } = useMemo(() => {
    const totalStops = filteredStops.length;
    let totalDowntimeMin = 0;
    let maxDowntime = 0;
    let manualCount = 0;
    let autoCount = 0;

    const catMap = new Map<string, { count: number; downtime: number }>();
    const bucketMap = new Map<string, { period: string; stopCount: number; downtimeMin: number; timestamp: number }>();

    filteredStops.forEach((s) => {
      const d = new Date(s.startTime);
      const mins = Number(s.durationMinutes) || 1;
      totalDowntimeMin += mins;
      if (mins > maxDowntime) maxDowntime = mins;

      if (s.source === "Auto (synced)") autoCount += 1;
      else manualCount += 1;

      // Category Pareto
      const cat = s.category || "Uncategorized";
      const catEntry = catMap.get(cat) || { count: 0, downtime: 0 };
      catEntry.count += 1;
      catEntry.downtime += mins;
      catMap.set(cat, catEntry);

      // Period bucket
      let periodKey = "";
      let bucketTimestamp = d.getTime();

      if (selectedView === "Daily") {
        periodKey = format(d, "d/M");
        bucketTimestamp = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      } else if (selectedView === "Weekly") {
        const wStart = startOfWeek(d, { weekStartsOn: 1 });
        periodKey = `W${format(d, "ww yyyy")}`;
        bucketTimestamp = wStart.getTime();
      } else if (selectedView === "Monthly") {
        periodKey = format(d, "MMM yyyy");
        bucketTimestamp = startOfMonth(d).getTime();
      } else {
        periodKey = format(d, "yyyy");
        bucketTimestamp = startOfYear(d).getTime();
      }

      const bEntry = bucketMap.get(periodKey) || { period: periodKey, stopCount: 0, downtimeMin: 0, timestamp: bucketTimestamp };
      bEntry.stopCount += 1;
      bEntry.downtimeMin += mins;
      bucketMap.set(periodKey, bEntry);
    });

    // Top categories sorted by frequency
    const topCats = Array.from(catMap.entries())
      .map(([name, data]) => ({ name, count: data.count, downtime: data.downtime }))
      .sort((a, b) => b.count - a.count);

    const topCauseName = topCats.length > 0 ? topCats[0].name : "None Recorded";
    const topCauseStops = topCats.length > 0 ? topCats[0].count : 0;

    // Sort chart data chronologically
    const sortedBuckets = Array.from(bucketMap.values()).sort((a, b) => a.timestamp - b.timestamp);

    // Calculate moving average
    const chart = sortedBuckets.map((item, idx, arr) => {
      const windowStart = Math.max(0, idx - 3);
      const slice = arr.slice(windowStart, idx + 1);
      const avg = Math.round(slice.reduce((acc, curr) => acc + curr.stopCount, 0) / slice.length);
      return {
        ...item,
        avgPeriod: avg,
      };
    });

    // Latest period stats vs previous
    const latestCount = chart.length > 0 ? chart[chart.length - 1].stopCount : 0;
    const prevCount = chart.length > 1 ? chart[chart.length - 2].stopCount : 0;
    const diffPct = prevCount > 0 ? Math.round(((latestCount - prevCount) / prevCount) * 100) : 0;

    // Format total downtime string
    const days = Math.floor(totalDowntimeMin / 1440);
    const hrs = Math.floor((totalDowntimeMin % 1440) / 60);
    const mins = Math.round(totalDowntimeMin % 60);
    const downtimeStr = days > 0 ? `${days}d ${hrs}h` : hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

    const avgMins = totalStops > 0 ? (totalDowntimeMin / totalStops).toFixed(1) : "0";

    return {
      chartData: chart.length > 0 ? chart : [
        { period: "No Data", stopCount: 0, downtimeMin: 0, avgPeriod: 0 }
      ],
      kpis: {
        totalStops,
        manualCount,
        autoCount,
        latestCount,
        diffPct,
        downtimeStr,
        avgMins,
        maxDowntime,
        topCauseName,
        topCauseStops,
      },
      topCategories: topCats,
    };
  }, [filteredStops, selectedView]);

  const handleExportCsv = () => {
    const headers = ["Period,Stop Count,Downtime (min),4-period Avg"];
    const rows = chartData.map((d) => `${d.period},${d.stopCount},${d.downtimeMin},${d.avgPeriod}`);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `short_stop_analytics_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 select-none">
      {/* Top Filter Bar */}
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
              onClick={() => setShowReportModal(true)}
              className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-300 px-3 py-1.5 rounded-lg text-xs shadow-2xs transition active:scale-95 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Management report</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center space-x-1.5 bg-[#c8e84a] hover:bg-[#b8da38] text-slate-900 font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export view (CSV)</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-100">
          {teamDescriptions[selectedTeam] || teamDescriptions.All}
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
                      className={`text-xs px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
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
                      onClick={() => handleRangeChange(r)}
                      className={`text-xs px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
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

          {/* Date Picker Range + Apply Button */}
          <div className="flex items-center space-x-2 self-start xl:self-auto">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none cursor-pointer"
            />
            <span className="text-xs text-slate-400">&rarr;</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none cursor-pointer"
            />
            <button
              type="button"
              onClick={() => fetchStops()}
              className="bg-[#c8e84a] hover:bg-[#b8da38] text-slate-900 font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-sm transition active:scale-95 cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 font-medium">
          Showing: {format(new Date(startDate), "d/M/yyyy")} &rarr; {format(new Date(endDate), "d/M/yyyy")} • {filteredStops.length} events analyzed
        </p>
      </div>

      {/* 4 KPI Metric Cards in a Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL STOPS */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            TOTAL STOPS
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">
            {kpis.totalStops.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            {kpis.manualCount} manual · {kpis.autoCount} auto
          </div>
        </div>

        {/* LATEST PERIOD */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            LATEST {selectedView.toUpperCase()}
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">
            {kpis.latestCount}
          </div>
          <div className={`text-xs mt-1 font-semibold ${kpis.diffPct <= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {kpis.diffPct > 0 ? `+${kpis.diffPct}%` : `${kpis.diffPct}%`} vs previous
          </div>
        </div>

        {/* TOTAL DOWNTIME */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            TOTAL DOWNTIME
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">
            {kpis.downtimeStr}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            Avg: {kpis.avgMins} min · Max: {kpis.maxDowntime} min
          </div>
        </div>

        {/* TOP CAUSE */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            TOP CAUSE
          </div>
          <div className="text-xl font-extrabold text-slate-900 mt-1 truncate" title={kpis.topCauseName}>
            {kpis.topCauseName}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            {kpis.topCauseStops} stops logged
          </div>
        </div>
      </div>

      {/* Main Dual-Axis Chart */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4 tracking-tight">
          {selectedView} Short Stop Trend
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
              />
              {/* Right Y-axis: Downtime Minutes */}
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
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

              {/* Green Dashed Line: Moving Avg */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="avgPeriod"
                name="Moving Avg"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Management Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    Short Stop & Fleet Management Report
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Official DF Automation Operational Stoppage Dossier
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Report Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-800">
              {/* Report Header Metadata */}
              <div className="border-b-2 border-blue-600 pb-3 flex justify-between items-end">
                <div>
                  <div className="text-lg font-black text-slate-900">
                    DF AUTOMATION & ROBOTICS
                  </div>
                  <div className="text-xs text-slate-600 font-semibold">
                    Customer: {currentCustomerName} • Facility: {currentSiteName}
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <div><strong>Period:</strong> {format(new Date(startDate), "d/M/yyyy")} &rarr; {format(new Date(endDate), "d/M/yyyy")}</div>
                  <div><strong>Generated:</strong> {format(new Date(), "d/M/yyyy HH:mm")}</div>
                </div>
              </div>

              {/* Executive Summary Cards */}
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Total Stops</div>
                  <div className="text-xl font-extrabold text-slate-900 mt-0.5">{kpis.totalStops}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Total Downtime</div>
                  <div className="text-xl font-extrabold text-slate-900 mt-0.5">{kpis.downtimeStr}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Mean Time to Recover</div>
                  <div className="text-xl font-extrabold text-slate-900 mt-0.5">{kpis.avgMins} min</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Top Problem Category</div>
                  <div className="text-sm font-extrabold text-slate-900 mt-1 truncate">{kpis.topCauseName}</div>
                </div>
              </div>

              {/* Top Categories Pareto Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  1. Stoppage Fault Category Breakdown (Pareto Analysis)
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Fault Category</th>
                        <th className="py-2 px-3 text-right">Occurrences</th>
                        <th className="py-2 px-3 text-right">Total Downtime (min)</th>
                        <th className="py-2 px-3 text-right">% of Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {topCategories.map((c) => {
                        const pct = kpis.totalStops > 0 ? ((c.count / kpis.totalStops) * 100).toFixed(1) : "0";
                        return (
                          <tr key={c.name} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-semibold text-slate-800">{c.name}</td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">{c.count}</td>
                            <td className="py-2 px-3 text-right text-slate-600">{c.downtime} min</td>
                            <td className="py-2 px-3 text-right font-medium text-blue-600">{pct}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Stoppage Trend Summary Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  2. Operational Period Breakdown ({selectedView})
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Period</th>
                        <th className="py-2 px-3 text-right">Stops</th>
                        <th className="py-2 px-3 text-right">Downtime (min)</th>
                        <th className="py-2 px-3 text-right">Moving Avg</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {chartData.map((d) => (
                        <tr key={d.period} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 font-medium text-slate-800">{d.period}</td>
                          <td className="py-1.5 px-3 text-right font-bold text-slate-900">{d.stopCount}</td>
                          <td className="py-1.5 px-3 text-right text-slate-600">{d.downtimeMin}</td>
                          <td className="py-1.5 px-3 text-right font-medium text-emerald-600">{d.avgPeriod}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-6 border-t border-dashed border-slate-300 grid grid-cols-2 gap-8 text-xs text-slate-600">
                <div>
                  <div className="font-bold text-slate-900">Prepared By:</div>
                  <div>DF Robotics Lead Field Deployment Engineer</div>
                  <div className="mt-8 border-b border-slate-300 w-48"></div>
                  <div className="mt-1 text-[10px] text-slate-400">Signature & Date</div>
                </div>
                <div>
                  <div className="font-bold text-slate-900">Acknowledged By:</div>
                  <div>Customer Operations & Maintenance Lead ({currentCustomerName})</div>
                  <div className="mt-8 border-b border-slate-300 w-48"></div>
                  <div className="mt-1 text-[10px] text-slate-400">Signature & Date</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
