"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  AlertTriangle, 
  Target, 
  Layers,
  Users,
  Clock,
  CheckCircle2,
  Square,
  FolderKanban,
  User
} from "lucide-react";
import { format } from "date-fns";
import GanttChart from "./GanttChart";

interface Task {
  id: string;
  projectId: string;
  section: "OPEN_ACTION" | "MILESTONE" | "ISSUE";
  event: string;
  assignee: string;
  dueDate: string | null;
  actualFinishedDate: string | null;
  isDone: boolean;
  delayNote: string | null;
  project?: {
    id: string;
    name: string;
    code: string;
  };
}

interface ProjectData {
  id: string;
  name: string;
  code: string;
  startDate?: string | null;
  createdAt: string;
  leadEngineer: string;
  tasks?: any[];
  company?: { name: string };
  site?: { name: string };
}

export default function TaskOverviewView() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [engineers, setEngineers] = useState<{ id: string; name: string; username: string }[]>([]);

  const fetchData = async () => {
    try {
      const [projRes, taskRes, engRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/project-tasks"),
        fetch("/api/engineers").catch(() => null),
      ]);

      if (projRes.ok) {
        const pData = await projRes.json();
        if (Array.isArray(pData)) setProjects(pData);
      }

      if (taskRes.ok) {
        const tData = await taskRes.json();
        if (Array.isArray(tData)) setTasks(tData);
      }

      if (engRes && engRes.ok) {
        const eData = await engRes.json();
        if (Array.isArray(eData)) setEngineers(eData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();

    const handleUpdate = () => fetchData();
    window.addEventListener("projects-updated", handleUpdate);
    return () => window.removeEventListener("projects-updated", handleUpdate);
  }, []);

  const computeDelay = (
    dueDateStr?: string | null,
    actualFinishedDateStr?: string | null,
    isDone?: boolean,
    customNote?: string | null
  ) => {
    if (!dueDateStr) {
      return { text: customNote || "no delay", isDelayed: false, diffDays: 0 };
    }

    const dueDate = new Date(dueDateStr);
    const finishDate = actualFinishedDateStr
      ? new Date(actualFinishedDateStr)
      : isDone
      ? null
      : new Date();

    if (!finishDate) {
      return { text: customNote || "no delay", isDelayed: false, diffDays: 0 };
    }

    const dDue = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime();
    const dFinish = new Date(finishDate.getFullYear(), finishDate.getMonth(), finishDate.getDate()).getTime();

    const diffDays = Math.round((dFinish - dDue) / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return { text: `+${diffDays} days delay`, isDelayed: true, diffDays };
    } else {
      return { text: customNote || "no delay", isDelayed: false, diffDays: 0 };
    }
  };

  // Toggle Done/Undone on overdue task
  const handleToggleDone = async (task: Task) => {
    const nextDone = !task.isDone;
    const nextFinished = nextDone ? new Date().toISOString() : null;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, isDone: nextDone, actualFinishedDate: nextFinished } : t
      )
    );

    try {
      const res = await fetch(`/api/project-tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isDone: nextDone,
          actualFinishedDate: nextFinished,
        }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      window.dispatchEvent(new CustomEvent("projects-updated"));
    } catch (err) {
      console.error(err);
      fetchData();
    }
  };

  // Compute KPI Metrics
  const stats = useMemo(() => {
    const total = tasks.length;
    const openActionCount = tasks.filter((t) => t.section === "OPEN_ACTION").length;
    const milestoneCount = tasks.filter((t) => t.section === "MILESTONE").length;
    const issueCount = tasks.filter((t) => t.section === "ISSUE").length;
    const completedCount = tasks.filter((t) => t.isDone).length;
    const delayedCount = tasks.filter((t) => {
      const d = computeDelay(t.dueDate, t.actualFinishedDate, t.isDone, t.delayNote);
      return d.isDelayed;
    }).length;

    return { total, openActionCount, milestoneCount, issueCount, completedCount, delayedCount };
  }, [tasks]);

  // Compute Engineer Workload
  const engineerWorkloads = useMemo(() => {
    const map = new Map<string, {
      name: string;
      total: number;
      active: number;
      completed: number;
      overdue: number;
      openActions: number;
      milestones: number;
      issues: number;
    }>();

    // Seed known engineers from /api/engineers
    engineers.forEach((eng) => {
      const displayName = eng.name || eng.username;
      if (!map.has(displayName)) {
        map.set(displayName, {
          name: displayName,
          total: 0,
          active: 0,
          completed: 0,
          overdue: 0,
          openActions: 0,
          milestones: 0,
          issues: 0,
        });
      }
    });

    // Populate from tasks
    tasks.forEach((t) => {
      const rawName = t.assignee?.trim() || "Unassigned";
      let entry = map.get(rawName);
      if (!entry) {
        entry = {
          name: rawName,
          total: 0,
          active: 0,
          completed: 0,
          overdue: 0,
          openActions: 0,
          milestones: 0,
          issues: 0,
        };
        map.set(rawName, entry);
      }

      entry.total += 1;
      if (t.isDone) {
        entry.completed += 1;
      } else {
        entry.active += 1;
        const delay = computeDelay(t.dueDate, t.actualFinishedDate, t.isDone, t.delayNote);
        if (delay.isDelayed) {
          entry.overdue += 1;
        }
      }

      if (t.section === "OPEN_ACTION") entry.openActions += 1;
      else if (t.section === "MILESTONE") entry.milestones += 1;
      else if (t.section === "ISSUE") entry.issues += 1;
    });

    return Array.from(map.values()).sort((a, b) => {
      if (b.active !== a.active) return b.active - a.active;
      if (b.overdue !== a.overdue) return b.overdue - a.overdue;
      return b.total - a.total;
    });
  }, [tasks, engineers]);

  // Compute Overdue Tasks (only incomplete tasks that are delayed)
  const overdueTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (t.isDone) return false;
        const delay = computeDelay(t.dueDate, t.actualFinishedDate, t.isDone, t.delayNote);
        return delay.isDelayed;
      })
      .map((t) => {
        const delay = computeDelay(t.dueDate, t.actualFinishedDate, t.isDone, t.delayNote);
        return {
          ...t,
          diffDays: delay.diffDays || 1,
          delayText: delay.text,
        };
      })
      .sort((a, b) => (b.diffDays || 0) - (a.diffDays || 0));
  }, [tasks]);

  return (
    <div className="space-y-6 select-none pb-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Task Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Consolidated field deployment summary, milestone timelines, engineer workloads, and overdue tasks.
          </p>
        </div>
      </div>

      {/* Part 1: Summary */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Summary
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Tasks
            </span>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">{stats.total}</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/20 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                Open Actions
              </span>
              <Target className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-xl font-extrabold text-amber-900 mt-0.5">{stats.openActionCount}</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-blue-200/80 bg-blue-50/20 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                Milestones
              </span>
              <Layers className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-xl font-extrabold text-blue-900 mt-0.5">{stats.milestoneCount}</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-rose-200/80 bg-rose-50/20 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                Issues
              </span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="text-xl font-extrabold text-rose-900 mt-0.5">{stats.issueCount}</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-2xs">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
              Delayed
            </span>
            <div className="text-xl font-extrabold text-rose-700 mt-0.5">{stats.delayedCount}</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-2xs">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
              Completed
            </span>
            <div className="text-xl font-extrabold text-emerald-700 mt-0.5">{stats.completedCount}</div>
          </div>
        </div>
      </div>

      {/* Part 2: Gantt Chart */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Gantt Chart
          </h2>
        </div>
        <GanttChart projects={projects} />
      </div>

      {/* Part 3: Below Gantt Chart - Two-Column Layout (Left: Workload, Right: Overdue) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Section: Current Engineer Workload */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-700" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Current Engineer Workload
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {engineerWorkloads.length} Engineers
            </span>
          </div>

          <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
            {engineerWorkloads.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400">
                No active engineer workloads recorded.
              </div>
            ) : (
              engineerWorkloads.map((eng) => (
                <div
                  key={eng.name}
                  className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-slate-300 transition space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                        {eng.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase() || "EN"}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {eng.name}
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          {eng.active} active • {eng.completed} done
                          {eng.overdue > 0 && (
                            <span className="text-rose-600 font-semibold ml-1">
                              • {eng.overdue} overdue
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Workload Status Badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                        eng.active >= 5
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : eng.active >= 2
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : eng.active === 1
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      {eng.active >= 5
                        ? "Heavy Load"
                        : eng.active >= 2
                        ? "Moderate"
                        : eng.active === 1
                        ? "Light"
                        : "Available"}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span>Completion Rate</span>
                      <span>
                        {eng.total > 0
                          ? `${Math.round((eng.completed / eng.total) * 100)}% (${eng.completed}/${eng.total})`
                          : "0% (0 tasks)"}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{
                          width: `${eng.total > 0 ? (eng.completed / eng.total) * 100 : 0}%`,
                        }}
                      />
                      <div
                        className="bg-rose-500 h-full transition-all duration-300"
                        style={{
                          width: `${eng.total > 0 ? (eng.overdue / eng.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Category Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 font-medium">
                      {eng.openActions} Actions
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 font-medium">
                      {eng.milestones} Milestones
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-100 font-medium">
                      {eng.issues} Issues
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Section: Overdue Task */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Overdue Task
              </h2>
            </div>
            <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
              {overdueTasks.length} Overdue
            </span>
          </div>

          <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
            {overdueTasks.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-slate-800">No Overdue Tasks</p>
                <p className="text-[11px] text-slate-500">
                  All field actions, milestones, and issues are tracking on schedule.
                </p>
              </div>
            ) : (
              overdueTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 sm:p-3.5 bg-white border border-rose-200/90 rounded-xl shadow-2xs hover:border-rose-300 transition space-y-2"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <button
                        onClick={() => handleToggleDone(task)}
                        className="mt-0.5 shrink-0 text-slate-300 hover:text-emerald-600 transition"
                        title="Mark task as done"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                          {task.event}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px]">
                          {task.project && (
                            <Link
                              href={`/project?id=${task.projectId}`}
                              className="font-semibold text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <FolderKanban className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[150px]">
                                {task.project.name}
                              </span>
                            </Link>
                          )}
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                              task.section === "OPEN_ACTION"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : task.section === "MILESTONE"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {task.section === "OPEN_ACTION"
                              ? "Open Action"
                              : task.section === "MILESTONE"
                              ? "Milestone"
                              : "Issue"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delay Badge */}
                    <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-red-600" />
                      <span>{task.delayText}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span className="font-medium text-slate-700">{task.assignee}</span>
                    </div>
                    <div>
                      <span>Due: </span>
                      <span className="font-semibold text-red-600">
                        {task.dueDate ? format(new Date(task.dueDate), "dd/MM/yyyy") : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
