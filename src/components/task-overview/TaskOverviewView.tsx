"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  Activity, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  Target, 
  Layers, 
  FolderKanban, 
  User, 
  ExternalLink,
  ChevronDown
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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterProject, setFilterProject] = useState("ALL");
  const [filterSection, setFilterSection] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "DELAYED" | "DONE">("ALL");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, taskRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/project-tasks"),
      ]);

      if (projRes.ok) {
        const pData = await projRes.json();
        if (Array.isArray(pData)) setProjects(pData);
      }

      if (taskRes.ok) {
        const tData = await taskRes.json();
        if (Array.isArray(tData)) setTasks(tData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
    if (customNote && customNote.trim().toLowerCase() === "no delay") {
      return { text: "no delay", isDelayed: false };
    }
    if (!dueDateStr) {
      return { text: "no delay", isDelayed: false };
    }

    const dueDate = new Date(dueDateStr);
    const finishDate = isDone && actualFinishedDateStr ? new Date(actualFinishedDateStr) : new Date();

    const dDue = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime();
    const dFinish = new Date(finishDate.getFullYear(), finishDate.getMonth(), finishDate.getDate()).getTime();

    const diffDays = Math.round((dFinish - dDue) / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return { text: `+${diffDays} days delay`, isDelayed: true };
    } else {
      return { text: "no delay", isDelayed: false };
    }
  };

  const handleToggleDone = async (task: Task) => {
    const nextDone = !task.isDone;
    const nextFinished = nextDone ? new Date().toISOString() : null;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, isDone: nextDone, actualFinishedDate: nextFinished } : t
      )
    );

    // Also update project tasks in projects state for immediate Gantt timeline color update!
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== task.projectId) return p;
        return {
          ...p,
          tasks: (p.tasks || []).map((pt) =>
            pt.id === task.id ? { ...pt, isDone: nextDone, actualFinishedDate: nextFinished } : pt
          ),
        };
      })
    );

    try {
      await fetch(`/api/project-tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isDone: nextDone,
          actualFinishedDate: nextFinished,
        }),
      });
      window.dispatchEvent(new Event("projects-updated"));
    } catch (err) {
      console.error(err);
      fetchData();
    }
  };

  // Extract unique projects
  const uniqueProjects = useMemo(() => {
    return projects.map((p) => ({ id: p.id, name: p.name }));
  }, [projects]);

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

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterProject !== "ALL" && t.projectId !== filterProject) return false;
      if (filterSection !== "ALL" && t.section !== filterSection) return false;

      if (filterStatus === "PENDING" && t.isDone) return false;
      if (filterStatus === "DONE" && !t.isDone) return false;
      if (filterStatus === "DELAYED") {
        const d = computeDelay(t.dueDate, t.actualFinishedDate, t.isDone, t.delayNote);
        if (!d.isDelayed) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchEvent = t.event.toLowerCase().includes(q);
        const matchAssignee = t.assignee.toLowerCase().includes(q);
        const matchProj = t.project?.name.toLowerCase().includes(q) || false;
        if (!matchEvent && !matchAssignee && !matchProj) return false;
      }

      return true;
    });
  }, [tasks, filterProject, filterSection, filterStatus, search]);

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <span className="p-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-700">
            <Activity className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              Task Overview
            </h1>
            <p className="text-xs text-slate-500">
              Consolidated overview of all Open Actions, Milestones, and Issues across projects
            </p>
          </div>
        </div>

        <Link
          href="/project"
          className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3 py-2 rounded-lg shadow-xs transition w-fit"
        >
          <FolderKanban className="w-3.5 h-3.5" />
          <span>Manage in Project</span>
        </Link>
      </div>

      {/* 1. FIRST THING: Full Gantt Chart */}
      <GanttChart projects={projects} />

      {/* 2. KPI Stat Cards */}
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

      {/* 3. Search & Filters Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search task event, assignee, or project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Project Filter */}
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Projects</option>
            {uniqueProjects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Section Filter */}
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Sections</option>
            <option value="OPEN_ACTION">Open Action</option>
            <option value="MILESTONE">Milestone</option>
            <option value="ISSUE">Issue</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="DELAYED">Delayed</option>
            <option value="DONE">Completed</option>
          </select>
        </div>
      </div>

      {/* 4. Cross-Project Unified Task Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[820px]">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3.5 w-12 text-center">Done</th>
                <th className="py-3 px-3">The Event</th>
                <th className="py-3 px-3 w-40">Project</th>
                <th className="py-3 px-3 w-32">Section</th>
                <th className="py-3 px-3 w-36">Assign</th>
                <th className="py-3 px-3 w-32">Due Date</th>
                <th className="py-3 px-3 w-36">Actual Finished Date</th>
                <th className="py-3 px-3 w-32">Delay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Loading task overview and Gantt chart...
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    No tasks found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const delay = computeDelay(
                    task.dueDate,
                    task.actualFinishedDate,
                    task.isDone,
                    task.delayNote
                  );

                  return (
                    <tr
                      key={task.id}
                      className={`hover:bg-slate-50/80 transition ${
                        task.isDone ? "bg-slate-50/30 text-slate-400" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3.5 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={task.isDone}
                          onChange={() => handleToggleDone(task)}
                          className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Event */}
                      <td className="py-3 px-3 align-middle font-semibold text-slate-800">
                        <span className={task.isDone ? "line-through text-slate-400" : "text-slate-900"}>
                          {task.event}
                        </span>
                      </td>

                      {/* Project Link */}
                      <td className="py-3 px-3 align-middle">
                        <Link
                          href={`/project?id=${task.projectId}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60 max-w-[150px] truncate transition"
                        >
                          <span className="truncate">{task.project?.name || "Project"}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-60" />
                        </Link>
                      </td>

                      {/* Section */}
                      <td className="py-3 px-3 align-middle">
                        {task.section === "OPEN_ACTION" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Open Action
                          </span>
                        )}
                        {task.section === "MILESTONE" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Milestone
                          </span>
                        )}
                        {task.section === "ISSUE" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Issue
                          </span>
                        )}
                      </td>

                      {/* Assignee */}
                      <td className="py-3 px-3 align-middle font-medium text-slate-700">
                        {task.assignee}
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-3 align-middle text-slate-600">
                        {task.dueDate ? format(new Date(task.dueDate), "dd MMM yyyy") : "—"}
                      </td>

                      {/* Actual Finished Date */}
                      <td className="py-3 px-3 align-middle">
                        {task.actualFinishedDate ? (
                          <span className="text-emerald-700 font-semibold">
                            {format(new Date(task.actualFinishedDate), "dd MMM yyyy")}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Pending</span>
                        )}
                      </td>

                      {/* Delay */}
                      <td className="py-3 px-3 align-middle">
                        {delay.isDelayed ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            {delay.text}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            no delay
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
