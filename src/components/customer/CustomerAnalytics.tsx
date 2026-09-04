"use client";

import React, { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { BarChart3, Clock, AlertTriangle, CheckCircle2, Bot } from "lucide-react";

interface CustomerAnalyticsProps {
  siteId?: string;
}

const COLORS = ["#0284c7", "#e11d48", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#64748b"];

export default function CustomerAnalytics({ siteId }: CustomerAnalyticsProps) {
  const [shortStops, setShortStops] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [robots, setRobots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const query = siteId ? `?siteId=${siteId}` : "";

    Promise.all([
      fetch(`/api/short-stops${query}`).then((r) => r.json()),
      fetch(`/api/issues${query}`).then((r) => r.json()),
      fetch(`/api/robots${query}`).then((r) => r.json()),
    ])
      .then(([stopsData, issuesData, robotsData]) => {
        setShortStops(Array.isArray(stopsData) ? stopsData : []);
        setIssues(Array.isArray(issuesData) ? issuesData : []);
        setRobots(Array.isArray(robotsData) ? robotsData : []);
      })
      .finally(() => setLoading(false));
  }, [siteId]);

  // Aggregate monthly stoppage count
  const monthlyDataMap: Record<string, number> = {};
  shortStops.forEach((stop) => {
    const month = new Date(stop.startTime).toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
    monthlyDataMap[month] = (monthlyDataMap[month] || 0) + 1;
  });

  const monthlyChartData = Object.entries(monthlyDataMap).map(([name, count]) => ({
    name,
    stoppages: count,
  }));

  if (monthlyChartData.length === 0) {
    monthlyChartData.push({ name: "Current Month", stoppages: shortStops.length });
  }

  // Aggregate top categories
  const categoryMap: Record<string, number> = {};
  shortStops.forEach((stop) => {
    const cat = stop.category || "Other";
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });

  const categoryChartData = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));

  // Key metrics
  const totalDowntimeMinutes = shortStops.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  const avgDowntime = shortStops.length ? (totalDowntimeMinutes / shortStops.length).toFixed(1) : "0";
  const openIssuesCount = issues.filter((i) => i.status !== "CLOSED").length;
  const runningRobotsCount = robots.filter((r) => r.status === "RUNNING").length;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Stoppages Logged
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">{shortStops.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Short stops recorded to local DB</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Avg Recovery Time
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">{avgDowntime} min</div>
          <p className="text-[11px] text-slate-400 mt-1">Mean duration per stoppage</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Open Support Issues
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">{openIssuesCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Under investigation / validation</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Site Fleet
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">
            {runningRobotsCount} / {robots.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Robots currently in RUNNING state</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Monthly Robot Error & Stoppage Trend</h3>
          <p className="text-xs text-slate-400 mb-4">Total recorded short stops over time</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="stoppages" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Failure Categories */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Top Stoppage Categories (Pareto)</h3>
          <p className="text-xs text-slate-400 mb-4">Distribution of fault triggers on site</p>
          <div className="h-64 w-full flex items-center justify-center">
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "none",
                      borderRadius: "8px",
                      color: "white",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">No category data recorded yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
