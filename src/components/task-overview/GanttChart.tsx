"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Calendar, 
  Check, 
  Clock, 
  ExternalLink, 
  FolderKanban, 
  Info,
  ChevronRight,
  Filter,
  CheckCircle2,
  Layers
} from "lucide-react";
import { format, differenceInDays, isSameDay, isPast, isToday } from "date-fns";

interface MilestoneTask {
  id: string;
  projectId: string;
  section: string;
  event: string;
  assignee: string;
  dueDate: string | null;
  actualFinishedDate: string | null;
  isDone: boolean;
  delayNote: string | null;
}

interface ProjectData {
  id: string;
  name: string;
  code: string;
  startDate?: string | null;
  createdAt: string;
  leadEngineer: string;
  tasks?: MilestoneTask[];
  company?: { name: string };
  site?: { name: string };
}

interface GanttChartProps {
  projects: ProjectData[];
}

export default function GanttChart({ projects }: GanttChartProps) {
  const [selectedMilestone, setSelectedMilestone] = useState<{
    task: MilestoneTask;
    projectName: string;
    projectId: string;
  } | null>(null);

  const [filterQuery, setFilterQuery] = useState("");

  // Process timeline date bounds
  const { minDate, maxDate, totalDays, dateTicks, todayPercent } = useMemo(() => {
    let minTime = new Date("2026-08-01").getTime();
    let maxTime = new Date("2026-10-31").getTime();

    projects.forEach((p) => {
      const pStart = p.startDate ? new Date(p.startDate).getTime() : new Date(p.createdAt).getTime();
      if (pStart < minTime) minTime = pStart;

      (p.tasks || []).forEach((t) => {
        if (t.section === "MILESTONE" && t.dueDate) {
          const dTime = new Date(t.dueDate).getTime();
          if (dTime > maxTime) maxTime = dTime;
          if (dTime < minTime) minTime = dTime;
        }
      });
    });

    // Add padding days at ends
    const start = new Date(minTime - 2 * 86400000);
    const end = new Date(maxTime + 4 * 86400000);
    const days = Math.max(1, differenceInDays(end, start));

    // Generate weekly/monthly date ticks
    const ticks: { date: Date; percent: number; isMonthStart: boolean; label: string }[] = [];
    let curr = new Date(start);
    while (curr <= end) {
      const p = (differenceInDays(curr, start) / days) * 100;
      const isMonthStart = curr.getDate() === 1;
      const isWeekTick = curr.getDay() === 1; // Mondays

      if (isMonthStart || isWeekTick) {
        ticks.push({
          date: new Date(curr),
          percent: p,
          isMonthStart,
          label: isMonthStart ? format(curr, "MMM yyyy") : format(curr, "d MMM"),
        });
      }
      curr = new Date(curr.getTime() + 86400000);
    }

    const today = new Date("2026-09-04"); // local current time
    const todayDiff = differenceInDays(today, start);
    const todayPct = Math.min(100, Math.max(0, (todayDiff / days) * 100));

    return { minDate: start, maxDate: end, totalDays: days, dateTicks: ticks, todayPercent: todayPct };
  }, [projects]);

  // Helper to convert date to percentage along timeline
  const getPercent = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    const diff = differenceInDays(d, minDate);
    return Math.min(100, Math.max(0, (diff / totalDays) * 100));
  };

  // Filtered projects
  const filteredProjects = useMemo(() => {
    if (!filterQuery.trim()) return projects;
    const q = filterQuery.toLowerCase();
    return projects.filter(
      (p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
    );
  }, [projects, filterQuery]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden select-none">
      {/* Chart Header & Legend */}
      <div className="p-4 bg-slate-50/90 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
              <Calendar className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Fleet Project Milestone Gantt Timeline
            </h2>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Continuous milestone timelines from initialization to final due date. Dark line signifies achieved milestones.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center space-x-1.5">
            <div className="w-5 h-2 rounded-full bg-blue-700 shadow-xs" />
            <span className="text-slate-800 font-bold">Achieved / Done</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-5 h-2 rounded-full bg-blue-200 border border-blue-300" />
            <span className="text-slate-500">Upcoming / Planned</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            <span>Completed Node</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-white border border-blue-400 inline-block" />
            <span>Pending Node</span>
          </div>
        </div>
      </div>

      {/* Gantt Viewport Container with horizontal scrolling */}
      <div className="overflow-x-auto relative min-w-[900px]">
        {/* Timeline Header (X-Axis) */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 text-slate-600 font-semibold text-[11px] sticky top-0 z-10">
          {/* Y-Axis Column Header */}
          <div className="w-64 shrink-0 px-4 py-2.5 border-r border-slate-200 bg-slate-100/90 text-slate-700 font-bold flex items-center justify-between">
            <span>Project (Y-Axis)</span>
            <span className="text-[10px] text-slate-400 font-normal">
              {filteredProjects.length} projects
            </span>
          </div>

          {/* Timeline Dates Header */}
          <div className="flex-1 relative h-9">
            {dateTicks.map((tick, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 flex flex-col justify-center transform -translate-x-1/2"
                style={{ left: `${tick.percent}%` }}
              >
                <div className="h-2 w-px bg-slate-300 mx-auto" />
                <span
                  className={`text-[10px] whitespace-nowrap px-1 ${
                    tick.isMonthStart
                      ? "font-bold text-slate-900 bg-slate-200/70 rounded px-1"
                      : "text-slate-500"
                  }`}
                >
                  {tick.label}
                </span>
              </div>
            ))}

            {/* Vertical 'Today' Indicator */}
            <div
              className="absolute top-0 bottom-0 z-20 pointer-events-none"
              style={{ left: `${todayPercent}%` }}
            >
              <div className="h-full w-0.5 bg-rose-500 shadow-xs" />
              <div className="absolute top-1 -left-3 bg-rose-600 text-white text-[9px] font-bold px-1 rounded shadow-xs uppercase tracking-tight">
                Today
              </div>
            </div>
          </div>
        </div>

        {/* Projects Rows (Y-Axis Rows) */}
        <div className="divide-y divide-slate-100 relative">
          {/* Background vertical grid lines */}
          <div className="absolute inset-0 pointer-events-none flex ml-64">
            <div className="relative w-full h-full">
              {dateTicks.map((tick, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 w-px bg-slate-100"
                  style={{ left: `${tick.percent}%` }}
                />
              ))}

              {/* Today line continuous through rows */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-rose-500/30 z-0"
                style={{ left: `${todayPercent}%` }}
              />
            </div>
          </div>

          {filteredProjects.map((project) => {
            const milestones = (project.tasks || [])
              .filter((t) => t.section === "MILESTONE" && t.dueDate)
              .sort(
                (a, b) =>
                  new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
              );

            const projectStart = project.startDate || project.createdAt;
            const startPct = getPercent(projectStart);

            const lastMilestone = milestones[milestones.length - 1];
            const endPct = lastMilestone ? getPercent(lastMilestone.dueDate!) : startPct + 15;

            // Find latest completed milestone
            let lastCompletedIndex = -1;
            milestones.forEach((m, idx) => {
              if (m.isDone) lastCompletedIndex = idx;
            });

            // Calculate dark line end percentage (up to latest completed milestone)
            let darkEndPct = startPct;
            if (lastCompletedIndex >= 0) {
              darkEndPct = getPercent(milestones[lastCompletedIndex].dueDate!);
            }

            const completedCount = milestones.filter((m) => m.isDone).length;

            return (
              <div
                key={project.id}
                className="flex items-center hover:bg-slate-50/70 transition group relative"
              >
                {/* Y-Axis Label: Project Details */}
                <div className="w-64 shrink-0 px-4 py-3.5 border-r border-slate-200 bg-white/90 z-10">
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/project?id=${project.id}`}
                      className="font-bold text-slate-900 text-xs hover:text-blue-600 transition truncate max-w-[170px] flex items-center gap-1 group-hover:underline"
                      title={project.name}
                    >
                      <span className="truncate">{project.name}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition" />
                    </Link>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                      {project.code}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {completedCount}/{milestones.length} milestones
                    </span>
                  </div>
                </div>

                {/* Timeline Track Area */}
                <div className="flex-1 relative h-14 z-1">
                  {/* CONTINUOUS LINE: Base Light Track (Start Date -> Final Milestone Due Date) */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full bg-blue-100 border border-blue-200/90 shadow-2xs transition-all"
                    style={{
                      left: `${startPct}%`,
                      width: `${Math.max(1, endPct - startPct)}%`,
                    }}
                    title={`Project Timeline: ${format(new Date(projectStart), "d MMM")} → ${
                      lastMilestone ? format(new Date(lastMilestone.dueDate!), "d MMM yyyy") : ""
                    }`}
                  />

                  {/* CONTINUOUS LINE: Dark Track (Start Date -> Latest Completed Milestone) */}
                  {lastCompletedIndex >= 0 && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full bg-blue-700 shadow-xs transition-all z-2"
                      style={{
                        left: `${startPct}%`,
                        width: `${Math.max(1, darkEndPct - startPct)}%`,
                      }}
                      title={`Achieved Milestone Progress: up to ${
                        milestones[lastCompletedIndex].event
                      }`}
                    />
                  )}

                  {/* Project Initialization Node */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-3 group/start cursor-pointer"
                    style={{ left: `${startPct}%` }}
                    title={`Initialized: ${format(new Date(projectStart), "dd MMM yyyy")}`}
                  >
                    <div className="w-3 h-3 rounded-full bg-slate-900 border-2 border-white shadow-xs" />
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-600 bg-white/90 px-1 rounded shadow-2xs whitespace-nowrap opacity-0 group-hover/start:opacity-100 transition">
                      Init: {format(new Date(projectStart), "dd MMM")}
                    </span>
                  </div>

                  {/* Milestone Nodes on the Timeline */}
                  {milestones.map((m, idx) => {
                    const mPct = getPercent(m.dueDate!);
                    const isAchieved = m.isDone;

                    return (
                      <div
                        key={m.id}
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-4 group/node cursor-pointer"
                        style={{ left: `${mPct}%` }}
                        onClick={() =>
                          setSelectedMilestone({
                            task: m,
                            projectName: project.name,
                            projectId: project.id,
                          })
                        }
                      >
                        {/* The Node Icon/Dot */}
                        {isAchieved ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs border-2 border-white group-hover/node:scale-125 transition">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-white border-2 border-blue-500 shadow-2xs flex items-center justify-center group-hover/node:scale-125 transition">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          </div>
                        )}

                        {/* Milestone Label Under Node */}
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
                          <span
                            className={`text-[9px] font-semibold whitespace-nowrap max-w-[90px] truncate px-1 rounded ${
                              isAchieved
                                ? "text-emerald-900 bg-emerald-50 border border-emerald-200"
                                : "text-slate-700 bg-white/95 border border-slate-200 shadow-2xs"
                            }`}
                          >
                            {m.event}
                          </span>
                        </div>

                        {/* Hover Tooltip Card */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden group-hover/node:flex flex-col bg-slate-900 text-white text-[11px] p-2.5 rounded-lg shadow-xl w-56 z-50 pointer-events-none">
                          <div className="font-bold text-white flex items-center justify-between">
                            <span className="truncate">{m.event}</span>
                            {isAchieved ? (
                              <span className="text-emerald-400 text-[10px] font-bold">Done</span>
                            ) : (
                              <span className="text-amber-400 text-[10px] font-bold">Pending</span>
                            )}
                          </div>
                          <div className="text-slate-300 text-[10px] mt-1">
                            <div>Assignee: <span className="text-white font-medium">{m.assignee}</span></div>
                            <div>Due: <span className="text-white font-medium">{m.dueDate ? format(new Date(m.dueDate), "dd MMM yyyy") : "—"}</span></div>
                            {m.actualFinishedDate && (
                              <div>Finished: <span className="text-emerald-300 font-medium">{format(new Date(m.actualFinishedDate), "dd MMM yyyy")}</span></div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Milestone Detail Modal */}
      {selectedMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className={`p-1.5 rounded-lg ${selectedMilestone.task.isDone ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
                  {selectedMilestone.task.isDone ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Milestone Details</h3>
                  <p className="text-[11px] text-slate-500">{selectedMilestone.projectName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMilestone(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Milestone Event
                </span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {selectedMilestone.task.event}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Assignee
                  </span>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {selectedMilestone.task.assignee}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Status
                  </span>
                  <div className="mt-0.5">
                    {selectedMilestone.task.isDone ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Achieved (Done)
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        In Progress / Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Due Date
                  </span>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {selectedMilestone.task.dueDate ? format(new Date(selectedMilestone.task.dueDate), "dd MMM yyyy") : "—"}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Actual Finished
                  </span>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {selectedMilestone.task.actualFinishedDate ? format(new Date(selectedMilestone.task.actualFinishedDate), "dd MMM yyyy") : "Pending"}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <Link
                href={`/project?id=${selectedMilestone.projectId}`}
                className="flex items-center space-x-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                <span>Open Project Workspace</span>
                <ExternalLink className="w-3 h-3" />
              </Link>

              <button
                onClick={() => setSelectedMilestone(null)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
