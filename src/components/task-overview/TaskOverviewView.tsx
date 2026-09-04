"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  AlertTriangle, 
  Target, 
  Layers 
} from "lucide-react";
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

  const fetchData = async () => {
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

  return (
    <div className="space-y-6 select-none">
      {/* 1. KPI Stat Cards on Top */}
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

      {/* 2. Full Milestone Gantt Chart directly below */}
      <GanttChart projects={projects} />
    </div>
  );
}
