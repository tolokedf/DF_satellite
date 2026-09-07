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
  ComposedChart,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Download, FileText, AlertTriangle, ShieldCheck, CheckCircle2, Clock } from "lucide-react";
import { format, subDays, startOfMonth, startOfYear } from "date-fns";
import { useSite } from "@/context/SiteContext";

const SEVERITIES = ["All", "CRITICAL", "MAJOR", "MODERATE", "MINOR"];
const RANGES = ["7d", "30d", "90d", "6mo", "1yr", "All"];
const PIE_COLORS = ["#ef4444", "#f97316", "#eab308", "#3b82f6"];

export default function IssueAnalyticsView() {
  const { currentSiteId, currentCustomerId } = useSite();
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedSeverity, setSelectedSeverity] = useState("All");
  const [selectedRange, setSelectedRange] = useState("90d");

  const [startDate, setStartDate] = useState(format(subDays(new Date(), 90), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentSiteId && currentSiteId !== "ALL") params.append("siteId", currentSiteId);
      else if (currentCustomerId && currentCustomerId !== "ALL") params.append("companyId", currentCustomerId);

      const res = await fetch(`/api/issues?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setIssues(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [currentSiteId, currentCustomerId]);

  const handleRangeChange = (r: string) => {
    setSelectedRange(r);
    const now = new Date();
    let s = subDays(now, 90);
    if (r === "7d") s = subDays(now, 7);
    else if (r === "30d") s = subDays(now, 30);
    else if (r === "90d") s = subDays(now, 90);
    else if (r === "6mo") s = subDays(now, 180);
    else if (r === "1yr") s = subDays(now, 365);
    else if (r === "All") s = subDays(now, 730);

    setStartDate(format(s, "yyyy-MM-dd"));
    setEndDate(format(now, "yyyy-MM-dd"));
  };

  const filteredIssues = useMemo(() => {
    const sDate = new Date(`${startDate}T00:00:00`).getTime();
    const eDate = new Date(`${endDate}T23:59:59`).getTime();

    return issues.filter((iss) => {
      const t = new Date(iss.createdAt).getTime();
      if (t < sDate || t > eDate) return false;
      if (selectedSeverity !== "All" && iss.severity !== selectedSeverity) return false;
      return true;
    });
  }, [issues, startDate, endDate, selectedSeverity]);

  // Aggregate Category breakdown & Monthly trend
  const { catData, kpis, monthlyData } = useMemo(() => {
    const total = filteredIssues.length;
    const critical = filteredIssues.filter((i) => i.severity === "CRITICAL").length;
    const closed = filteredIssues.filter((i) => i.status === "CLOSED").length;
    const open = total - closed;

    const catMap = new Map<string, number>();
    const monthMap = new Map<string, { month: string; critical: number; others: number; timestamp: number }>();

    filteredIssues.forEach((iss) => {
      const cat = iss.rootCauseCategory?.replace(/_/g, " ") || "OTHER";
      catMap.set(cat, (catMap.get(cat) || 0) + 1);

      const d = new Date(iss.createdAt);
      const mKey = format(d, "MMM yyyy");
      const mEntry = monthMap.get(mKey) || {
        month: mKey,
        critical: 0,
        others: 0,
        timestamp: startOfMonth(d).getTime(),
      };
      if (iss.severity === "CRITICAL") mEntry.critical += 1;
      else mEntry.others += 1;
      monthMap.set(mKey, mEntry);
    });

    const cats = Array.from(catMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const mList = Array.from(monthMap.values()).sort((a, b) => a.timestamp - b.timestamp);

    return {
      catData: cats,
      kpis: { total, critical, closed, open },
      monthlyData: mList.length > 0 ? mList : [{ month: format(new Date(), "MMM yyyy"), critical: 0, others: 0, timestamp: 0 }],
    };
  }, [filteredIssues]);

  const handleExportCsv = () => {
    const headers = ["Issue No,Robot,Severity,Title,Status,Created At"];
    const rows = filteredIssues.map((i) => `"${i.issueNo}","${i.robot?.code || "Site"}","${i.severity}","${i.title}","${i.status}","${format(new Date(i.createdAt), "dd/MM/yyyy HH:mm")}"`);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `issue_tracker_analytics_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 select-none">
      {/* Top Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-slate-700">Severity:</span>
            <div className="flex items-center space-x-1.5">
              {SEVERITIES.map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition ${
                    selectedSeverity === sev
                      ? "bg-rose-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            <span className="text-slate-300 hidden sm:inline">|</span>

            <span className="text-xs font-semibold text-slate-700">Range:</span>
            <div className="flex bg-slate-100 p-0.5 rounded-lg">
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => handleRangeChange(r)}
                  className={`text-xs px-2.5 py-1 rounded-md font-semibold transition ${
                    selectedRange === r ? "bg-rose-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm transition self-start lg:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Issues (CSV)</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-500 font-medium mt-3 pt-2.5 border-t border-slate-100">
          Showing: {format(new Date(startDate), "dd/MM/yyyy")} &rarr; {format(new Date(endDate), "dd/MM/yyyy")} • {filteredIssues.length} breakdown issues analyzed
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Issues</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{kpis.total}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/30 shadow-2xs">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Critical Severity</span>
          <div className="text-2xl font-black text-rose-700 mt-1">{kpis.critical}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/30 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">In Progress / Open</span>
          <div className="text-2xl font-black text-amber-700 mt-1">{kpis.open}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Resolved / Closed</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">{kpis.closed}</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Breakdown Trend */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Monthly Issue Frequency Trend
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend verticalAlign="top" align="center" iconSize={10} wrapperStyle={{ paddingBottom: "10px", fontSize: "11px" }} />
                <Bar dataKey="critical" name="Critical" fill="#ef4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="others" name="Other Severities" fill="#64748b" radius={[3, 3, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Root Cause Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Root Cause Category Distribution
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {catData.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-10">No categories recorded</div>
            ) : (
              catData.map((cat, idx) => {
                const pct = kpis.total > 0 ? Math.round((cat.value / kpis.total) * 100) : 0;
                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{cat.name}</span>
                      <span>{cat.value} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
