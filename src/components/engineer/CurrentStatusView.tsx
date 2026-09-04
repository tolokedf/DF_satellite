"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Activity, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  User, 
  Users, 
  FolderKanban, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight, 
  ExternalLink, 
  Award, 
  TrendingUp, 
  ChevronLeft,
  Filter,
  Check
} from "lucide-react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";

export default function CurrentStatusView() {
  const [team, setTeam] = useState<"dfa" | "dfi">("dfa");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View state
  const [activeView, setActiveView] = useState<"overview" | "workload">("overview");
  const [statusFilter, setStatusFilter] = useState<"active" | "all" | "completed">("active");
  const [period, setPeriod] = useState<"month" | "quarter" | "fy" | "all">("quarter");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Accordion state for projects
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  // Calendar week state
  const [calWeekStart, setCalWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [calProject, setCalProject] = useState("all");
  const [calIncludeCompleted, setCalIncludeCompleted] = useState(false);
  const [calHideEmpty, setCalHideEmpty] = useState(true);

  const fetchData = async (targetTeam: string = team) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/current-status?team=${targetTeam}`);
      if (!res.ok) throw new Error("Failed to fetch current status");
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(team);
  }, [team]);

  const toggleProject = (gid: string) => {
    setExpandedProjects((prev) => ({ ...prev, [gid]: !prev[gid] }));
  };

  const tasks: any[] = data?.tasks || [];
  const projects: any[] = data?.projects || [];

  // Filter tasks based on period and status
  const filteredTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter((t) => {
      // Status filter
      if (statusFilter === "active" && t.completed) return false;
      if (statusFilter === "completed" && !t.completed) return false;

      // Period filter
      if (t.due_on) {
        const d = new Date(t.due_on);
        if (dateFrom && d < new Date(dateFrom)) return false;
        if (dateTo && d > new Date(dateTo)) return false;

        if (period === "month") {
          if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
        } else if (period === "quarter") {
          const curQuarter = Math.floor(now.getMonth() / 3);
          const taskQuarter = Math.floor(d.getMonth() / 3);
          if (curQuarter !== taskQuarter || d.getFullYear() !== now.getFullYear()) return false;
        }
      }
      return true;
    });
  }, [tasks, statusFilter, period, dateFrom, dateTo]);

  // Overall KPIs
  const nowStr = new Date().toISOString().split("T")[0];
  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);
  const overdueTasks = tasks.filter((t) => !t.completed && t.due_on && t.due_on < nowStr);
  const unassignedTasks = tasks.filter((t) => !t.completed && !t.assignee);

  // Group engineers
  const engineersMap: Record<string, { name: string; email?: string; active: number; completed: number; overdue: number; hours: number; projects: Set<string> }> = {};
  tasks.forEach((t) => {
    const engName = t.assignee?.name || (t.assignee?.email ? t.assignee.email.split("@")[0] : null);
    if (!engName) return;

    if (!engineersMap[engName]) {
      engineersMap[engName] = {
        name: engName,
        email: t.assignee?.email,
        active: 0,
        completed: 0,
        overdue: 0,
        hours: 0,
        projects: new Set(),
      };
    }
    const eng = engineersMap[engName];
    if (t.project?.name) eng.projects.add(t.project.name);

    let hrs = 8;
    const wf = t.custom_fields?.find((c: any) => c.name?.includes("Weightage") || c.name?.includes("Hour"));
    if (wf && wf.number_value) hrs = Number(wf.number_value);

    if (t.completed) {
      eng.completed += 1;
    } else {
      eng.active += 1;
      eng.hours += hrs;
      if (t.due_on && t.due_on < nowStr) eng.overdue += 1;
    }
  });

  const engineersList = Object.values(engineersMap).map((eng) => ({
    ...eng,
    projectsCount: eng.projects.size,
    score: eng.completed * 3 + eng.active - eng.overdue * 2 + eng.projects.size,
  })).sort((a, b) => b.score - a.score);

  // Calendar dates (Mon-Sun)
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(calWeekStart, i));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
              Current Task
            </span>
            <span className="text-xs text-slate-400">• Field Application &amp; Workload</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Activity className="w-6 h-6 text-teal-600" />
            <span>Field Application Dashboard</span>
          </h1>
          <p className="text-xs text-slate-500">
            Real-time project deployment statuses, engineer workloads, and task health.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{data?.source === "live_fa" ? "Live from Asana (FA)" : "Local Satellite DB"}</span>
            <span className="text-slate-400">({tasks.length} tasks)</span>
          </span>

          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Refresh from Asana"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Team Tabs (DFA Malaysia vs DFI India) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200">
        <div className="flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none pb-1 sm:pb-0">
          <button
            onClick={() => setTeam("dfa")}
            className={`pb-2.5 sm:pb-3 px-3 sm:px-4 font-bold text-xs flex items-center gap-1.5 sm:gap-2 border-b-2 shrink-0 transition ${
              team === "dfa"
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="text-sm">🇲🇾</span>
            <span>DFA — Malaysia Team</span>
          </button>
          <button
            onClick={() => setTeam("dfi")}
            className={`pb-2.5 sm:pb-3 px-3 sm:px-4 font-bold text-xs flex items-center gap-1.5 sm:gap-2 border-b-2 shrink-0 transition ${
              team === "dfi"
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="text-sm">🇮🇳</span>
            <span>DFI — India Team</span>
          </button>
        </div>

        {/* View Switcher (Overview vs Workload & Scoreboard) */}
        <div className="flex bg-slate-100 p-1 rounded-lg mb-2 self-start sm:self-auto shrink-0">
          <button
            onClick={() => setActiveView("overview")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
              activeView === "overview" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveView("workload")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
              activeView === "workload" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Workload &amp; Scoreboard
          </button>
        </div>
      </div>

      {/* Period Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-500">Period:</span>
          <div className="flex bg-slate-100 p-0.5 rounded-lg">
            <button
              onClick={() => setPeriod("month")}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                period === "month" ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setPeriod("quarter")}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                period === "quarter" ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              This Quarter
            </button>
            <button
              onClick={() => setPeriod("fy")}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                period === "fy" ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Full FY
            </button>
            <button
              onClick={() => setPeriod("all")}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                period === "all" ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700"
            title="Custom start"
          />
          <span className="text-slate-400">-</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700"
            title="Custom end"
          />
        </div>
      </div>

      {/* ═════════ VIEW 1: OVERVIEW ═════════ */}
      {activeView === "overview" && (
        <div className="space-y-6">
          {/* Status filter & KPI Row */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setStatusFilter("active")}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  statusFilter === "active" ? "bg-teal-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Active ({activeTasks.length})
              </button>
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  statusFilter === "all" ? "bg-teal-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({tasks.length})
              </button>
              <button
                onClick={() => setStatusFilter("completed")}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  statusFilter === "completed" ? "bg-teal-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Completed ({completedTasks.length})
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-blue-500">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Tasks</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{activeTasks.length}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">field jobs in progress</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completed</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{completedTasks.length}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">tasks marked done</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-rose-500">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Overdue</div>
              <div className="text-2xl font-black text-rose-600 mt-1">{overdueTasks.length}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">past targeted due date</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-slate-400">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Engineers</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{engineersList.length}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">assigned to active work</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unassigned</div>
              <div className="text-2xl font-black text-amber-600 mt-1">{unassignedTasks.length}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">tasks needing owner</div>
            </div>
          </div>

          {/* Deployment Projects List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                <span>FA Deployment Projects ({projects.length})</span>
              </h2>
              <span className="text-xs text-slate-500">Click a project to view tasks and milestones</span>
            </div>

            <div className="space-y-2">
              {projects.map((p) => {
                const isExpanded = expandedProjects[p.gid] ?? false;
                const projectTasks = tasks.filter((t) => t.project?.gid === p.gid || t.project?.name === p.name);
                const doneCount = projectTasks.filter((t) => t.completed).length;
                const pct = projectTasks.length ? Math.round((doneCount / projectTasks.length) * 100) : 0;

                return (
                  <div key={p.gid || p.name} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div
                      onClick={() => toggleProject(p.gid)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <button className="text-slate-400 hover:text-slate-600">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{p.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>{p.company || "Customer Deployment"}</span>
                            {p.site && <span>• {p.site}</span>}
                            <span>• {projectTasks.length} total tasks</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-28 hidden sm:block">
                          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 mb-1">
                            <span>Progress</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-teal-600 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          pct === 100 ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          {pct === 100 ? "Completed" : `${projectTasks.length - doneCount} active`}
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-100 p-4 bg-slate-50/50 space-y-2">
                        {projectTasks.length === 0 ? (
                          <div className="text-xs text-slate-400 py-2 text-center">No tasks listed for this project.</div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                              <thead>
                                <tr className="text-slate-400 border-b border-slate-200">
                                  <th className="pb-2 font-medium">Task</th>
                                  <th className="pb-2 font-medium">Assignee</th>
                                  <th className="pb-2 font-medium">Due Date</th>
                                  <th className="pb-2 font-medium text-right">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {projectTasks.map((t) => (
                                  <tr key={t.gid} className="hover:bg-white transition">
                                    <td className="py-2 pr-3 font-medium text-slate-800 flex items-center gap-1.5">
                                      {t.completed ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                      ) : (
                                        <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                                      )}
                                      <span>{t.name}</span>
                                    </td>
                                    <td className="py-2 pr-3 text-slate-600">
                                      {t.assignee?.name ? (
                                        <span className="font-semibold text-slate-800">{t.assignee.name}</span>
                                      ) : (
                                        <span className="text-amber-600 font-medium">Unassigned</span>
                                      )}
                                    </td>
                                    <td className="py-2 pr-3 text-slate-500">
                                      {t.due_on || "-"}
                                      {t.due_on && t.due_on < nowStr && !t.completed && (
                                        <span className="text-rose-600 font-bold ml-1 text-[10px]">(Overdue)</span>
                                      )}
                                    </td>
                                    <td className="py-2 text-right">
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                        t.completed
                                          ? "bg-emerald-100 text-emerald-800"
                                          : t.due_on && t.due_on < nowStr
                                          ? "bg-rose-100 text-rose-800"
                                          : "bg-blue-100 text-blue-800"
                                      }`}>
                                        {t.completed ? "Done" : "In Progress"}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Two Columns: Engineer Workload & Overdue Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Engineer Workload Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>Engineer Workload ({engineersList.length})</span>
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {engineersList.map((eng) => (
                  <div key={eng.name} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-900">{eng.name}</div>
                      <div className="text-[11px] text-slate-500">{eng.projectsCount} project(s) assigned</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        {eng.active} active
                      </span>
                      <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {eng.hours} hrs
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Overdue Tasks Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>Overdue Tasks ({overdueTasks.length})</span>
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {overdueTasks.length === 0 ? (
                  <div className="text-xs text-slate-400 p-4 text-center">No overdue tasks! All assignments on track.</div>
                ) : (
                  overdueTasks.slice(0, 15).map((t) => (
                    <div key={t.gid} className="p-3 bg-rose-50/50 rounded-lg border border-rose-200 flex items-center justify-between">
                      <div className="pr-2">
                        <div className="font-bold text-xs text-slate-900">{t.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {t.project?.name} • Assignee: <strong>{t.assignee?.name || "Unassigned"}</strong>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-[11px] font-bold text-rose-600">{t.due_on}</div>
                        <span className="text-[10px] font-semibold text-rose-500 uppercase">Past Due</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════ VIEW 2: WORKLOAD & SCOREBOARD ═════════ */}
      {activeView === "workload" && (
        <div className="space-y-6">
          {/* Work Week Calendar */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                  <span>Work Week Calendar</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Week of {format(calWeekStart, "MMM d, yyyy")}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCalWeekStart(addDays(calWeekStart, -7))}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                  title="Previous week"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCalWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
                >
                  Today
                </button>
                <button
                  onClick={() => setCalWeekStart(addDays(calWeekStart, 7))}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                  title="Next week"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 px-3 w-40">Engineer</th>
                    {weekDays.map((d) => (
                      <th key={d.toISOString()} className="py-2.5 px-2 text-center">
                        <div className="font-bold text-slate-800">{format(d, "EEE")}</div>
                        <div className="text-[10px] text-slate-400">{format(d, "d MMM")}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {engineersList.map((eng) => (
                    <tr key={eng.name} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap">
                        {eng.name}
                      </td>
                      {weekDays.map((d) => {
                        const dayStr = format(d, "yyyy-MM-dd");
                        const dayTasks = tasks.filter(
                          (t) => t.assignee?.name === eng.name && t.due_on === dayStr
                        );

                        return (
                          <td key={d.toISOString()} className="py-2 px-1 align-top text-center">
                            {dayTasks.length > 0 ? (
                              <div className="space-y-1">
                                {dayTasks.map((t) => (
                                  <div
                                    key={t.gid}
                                    className={`p-1 rounded text-[10px] font-semibold truncate text-left ${
                                      t.completed
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-blue-100 text-blue-800 border border-blue-200"
                                    }`}
                                    title={t.name}
                                  >
                                    {t.name}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-300 text-[10px]">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Scoreboard Table */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Engineer Performance Scoreboard</span>
            </h2>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3 text-center w-12">Rank</th>
                    <th className="py-2.5 px-3">Engineer</th>
                    <th className="py-2.5 px-3 text-right">Projects</th>
                    <th className="py-2.5 px-3 text-right">Active</th>
                    <th className="py-2.5 px-3 text-right">Completed</th>
                    <th className="py-2.5 px-3 text-right">Overdue</th>
                    <th className="py-2.5 px-3 text-right">Hours</th>
                    <th className="py-2.5 px-3 text-right font-bold text-slate-900">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {engineersList.map((eng, idx) => (
                    <tr key={eng.name} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                        {idx === 0 ? "🥇 1" : idx === 1 ? "🥈 2" : idx === 2 ? "🥉 3" : idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{eng.name}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600">{eng.projectsCount}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-blue-600">{eng.active}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">{eng.completed}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-rose-600">{eng.overdue}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600">{eng.hours}</td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-teal-700 bg-teal-50/50">
                        {eng.score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
