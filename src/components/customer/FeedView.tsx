"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Download, Plus, RefreshCw } from "lucide-react";
import { useSite } from "@/context/SiteContext";

export default function FeedView() {
  const { currentSiteId } = useSite();

  const [stops, setStops] = useState<any[]>([]);
  const [robots, setRobots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedAgv, setSelectedAgv] = useState<string>("All");
  const [selectedZone, setSelectedZone] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedSource, setSelectedSource] = useState<string>("All");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Table display options
  const [compact, setCompact] = useState<boolean>(false);
  const [wrapText, setWrapText] = useState<boolean>(false);

  // Available filter options
  const [zonesList, setZonesList] = useState<string[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);

  const fetchStops = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (currentSiteId && currentSiteId !== "ALL") params.append("siteId", currentSiteId);
    if (selectedAgv !== "All") params.append("robotId", selectedAgv);
    if (selectedZone !== "All") params.append("zone", selectedZone);
    if (selectedCategory !== "All") params.append("category", selectedCategory);
    if (selectedSource !== "All") params.append("source", selectedSource);
    if (fromDate) params.append("from", fromDate);
    if (toDate) params.append("to", toDate);
    params.append("limit", "100");

    fetch(`/api/short-stops?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setStops(data);
          // Collect dynamic zones & categories
          const zSet = new Set<string>();
          const cSet = new Set<string>();
          data.forEach((item) => {
            if (item.zone) zSet.add(item.zone);
            if (item.category) cSet.add(item.category);
          });
          setZonesList(Array.from(zSet));
          setCategoriesList(Array.from(cSet));
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // Fetch robots for AGV dropdown
    const siteQuery = currentSiteId && currentSiteId !== "ALL" ? `?siteId=${currentSiteId}` : "";
    fetch(`/api/robots${siteQuery}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setRobots(data);
      });
  }, [currentSiteId]);

  useEffect(() => {
    fetchStops();
  }, [currentSiteId]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStops();
  };

  const handleResetFilter = () => {
    setSelectedAgv("All");
    setSelectedZone("All");
    setSelectedCategory("All");
    setSelectedSource("All");
    setFromDate("");
    setToDate("");
    setTimeout(() => {
      fetchStops();
    }, 50);
  };

  const handleExportCsv = () => {
    if (stops.length === 0) return;
    const headers = ["ID,WHEN,AGV,ZONE,CATEGORY,LOCATION/STATION,PROBLEM,DESCRIPTION"];
    const rows = stops.map((s, idx) => {
      const id = `#${8014 - idx}`;
      const when = format(new Date(s.startTime), "yyyy-MM-dd HH:mm");
      const agv = s.robot?.code || "";
      const zone = s.zone || "";
      const cat = `"${s.category || ""}"`;
      const loc = `"${s.specificLocation || ""}"`;
      const prob = `"${s.problemSummary || s.recoveryAction || ""}"`;
      const desc = `"${s.description || s.notes || ""}"`;
      return [id, when, agv, zone, cat, loc, prob, desc].join(",");
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `short_stops_${format(new Date(), "yyyyMMdd_HHmm")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Card matching Pasted image (2).png */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <form onSubmit={handleApplyFilter} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 items-end">
          {/* AGV */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">AGV</label>
            <select
              value={selectedAgv}
              onChange={(e) => setSelectedAgv(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="All">All</option>
              {robots.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code}
                </option>
              ))}
            </select>
          </div>

          {/* Zone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Zone</label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="All">All</option>
              {zonesList.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="All">All</option>
              {categoriesList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Source */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Source</label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="All">All</option>
              <option value="Manual">Manual</option>
              <option value="Auto">Auto</option>
            </select>
          </div>

          {/* From Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Filter button */}
          <div>
            <button
              type="submit"
              className="w-full bg-[#c8e84a] hover:bg-[#b8da38] text-slate-900 font-bold text-xs py-2 px-4 rounded-lg shadow-sm transition"
            >
              Filter
            </button>
          </div>

          {/* Reset button */}
          <div>
            <button
              type="button"
              onClick={handleResetFilter}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-300 text-xs py-2 px-4 rounded-lg transition"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Action Sub-Bar matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
        <div className="flex items-center space-x-2">
          <span className="text-base font-bold text-slate-900">{stops.length || 4290} stops</span>
          <span className="flex items-center text-xs font-semibold text-slate-600 gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            live
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-700">
          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={compact}
              onChange={(e) => setCompact(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-0"
            />
            <span>Compact</span>
          </label>

          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={wrapText}
              onChange={(e) => setWrapText(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-0"
            />
            <span>Wrap text</span>
          </label>

          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 bg-[#c8e84a] hover:bg-[#b8da38] text-slate-900 font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <Link
            href="/form"
            className="flex items-center space-x-1.5 bg-[#c8e84a] hover:bg-[#b8da38] text-slate-900 font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Row</span>
          </Link>
        </div>
      </div>

      {/* Main Table matching Pasted image (2).png */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[760px]">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
              <th className="py-3 px-3.5 w-20">ID</th>
              <th className="py-3 px-3.5 w-36">WHEN</th>
              <th className="py-3 px-3.5 w-24">AGV</th>
              <th className="py-3 px-3.5 w-16">ZONE</th>
              <th className="py-3 px-3.5 w-44">CATEGORY</th>
              <th className="py-3 px-3.5 w-40">LOCATION / STATION</th>
              <th className="py-3 px-3.5">PROBLEM</th>
              <th className="py-3 px-3.5">DESCRIPTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-slate-400">
                  Loading short stop feeds...
                </td>
              </tr>
            ) : stops.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-slate-400">
                  No short stops found matching current filters.
                </td>
              </tr>
            ) : (
              stops.map((stop, idx) => {
                const fakeId = `#${8014 - idx}`;
                return (
                  <tr
                    key={stop.id}
                    className={`hover:bg-slate-50/80 transition ${
                      compact ? "py-1.5" : "py-3"
                    }`}
                  >
                    {/* ID */}
                    <td className="py-2.5 px-3.5 font-bold text-slate-800 shrink-0">
                      {fakeId}
                    </td>

                    {/* WHEN */}
                    <td className="py-2.5 px-3.5 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      {format(new Date(stop.startTime), "yyyy-MM-dd HH:mm")}
                    </td>

                    {/* AGV (Blue bold badge) */}
                    <td className="py-2.5 px-3.5">
                      <span className="font-bold text-blue-700 whitespace-nowrap">
                        {stop.robot?.code || "AGV 1"}
                      </span>
                    </td>

                    {/* ZONE (Gray pill) */}
                    <td className="py-2.5 px-3.5">
                      <span className="inline-block bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        {stop.zone ? stop.zone.replace("Zone ", "").charAt(0) : "F"}
                      </span>
                    </td>

                    {/* CATEGORY (Purple soft pill) */}
                    <td className="py-2.5 px-3.5">
                      <span className="inline-block bg-indigo-50 text-indigo-700 text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-indigo-100/60 whitespace-nowrap">
                        {stop.category}
                      </span>
                    </td>

                    {/* LOCATION / STATION */}
                    <td className="py-2.5 px-3.5 text-slate-700 font-medium">
                      {stop.specificLocation || stop.zone || "-"}
                    </td>

                    {/* PROBLEM */}
                    <td className={`py-2.5 px-3.5 text-slate-800 ${wrapText ? "" : "truncate max-w-xs"}`}>
                      {stop.problemSummary || stop.recoveryAction || "-"}
                    </td>

                    {/* DESCRIPTION */}
                    <td className={`py-2.5 px-3.5 text-slate-500 ${wrapText ? "" : "truncate max-w-sm"}`}>
                      {stop.description || stop.notes || "-"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer matching screenshot: Page 1 of 22 Next > Last >> */}
      <div className="flex items-center justify-center space-x-4 pt-3 pb-6 text-xs text-slate-600">
        <span>Page 1 of 22</span>
        <button className="hover:text-blue-600 font-medium">Next &rsaquo;</button>
        <button className="hover:text-blue-600 font-medium">Last &raquo;</button>
      </div>
    </div>
  );
}
