"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  CheckSquare, 
  FolderKanban, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Calendar, 
  User, 
  Clock, 
  Layers, 
  Target, 
  AlertTriangle,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Search,
  Filter
} from "lucide-react";
import { format } from "date-fns";

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

interface Project {
  id: string;
  name: string;
  code: string;
  company?: { name: string };
  site?: { name: string };
  leadEngineer: string;
  description?: string;
  tasks?: Task[];
}

export default function ProjectWorkspace() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const viewMode = searchParams.get("view") || "project"; // "project" | "my-task"
  const selectedProjectId = searchParams.get("id");

  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [engineers, setEngineers] = useState<{ id: string; name: string; username: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // New task inline/modal state
  const [addingSection, setAddingSection] = useState<"OPEN_ACTION" | "MILESTONE" | "ISSUE" | null>(null);
  const [newEvent, setNewEvent] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [newDueDate, setNewDueDate] = useState("");

  // My tasks filter state
  const [myTaskFilter, setMyTaskFilter] = useState<"all" | "pending" | "delayed" | "completed">("all");
  const [myTaskSearch, setMyTaskSearch] = useState("");

  // Fetch session & engineers
  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
          setNewAssignee(data.user.name || data.user.username);
        }
      })
      .catch(() => {});

    fetch("/api/engineers")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setEngineers(data);
      })
      .catch(() => {});
  }, []);

  // Fetch all projects
  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to load projects");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProjects(data);
        return data;
      }
    } catch (err) {
      console.error(err);
    }
    return [];
  };

  // Load project details and tasks
  const loadCurrentProject = async (projId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projId}`);
      if (!res.ok) throw new Error("Failed to load project");
      const data = await res.json();
      setCurrentProject(data);
      if (Array.isArray(data.tasks)) {
        setTasks(data.tasks);
      } else {
        const taskRes = await fetch(`/api/project-tasks?projectId=${projId}`);
        const taskData = await taskRes.json();
        if (Array.isArray(taskData)) setTasks(taskData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load My Tasks
  const loadMyTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/project-tasks?myTasks=true");
      if (!res.ok) throw new Error("Failed to load my tasks");
      const data = await res.json();
      if (Array.isArray(data)) setMyTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects().then((projList) => {
      if (viewMode === "my-task") {
        loadMyTasks();
      } else {
        if (selectedProjectId) {
          loadCurrentProject(selectedProjectId);
        } else if (projList && projList.length > 0) {
          router.replace(`/project?id=${projList[0].id}`);
          loadCurrentProject(projList[0].id);
        } else {
          setLoading(false);
        }
      }
    });

    const handleUpdate = () => {
      fetchProjects();
      if (selectedProjectId) loadCurrentProject(selectedProjectId);
      if (viewMode === "my-task") loadMyTasks();
    };

    window.addEventListener("projects-updated", handleUpdate);
    return () => window.removeEventListener("projects-updated", handleUpdate);
  }, [viewMode, selectedProjectId]);

  // Compute Delay helper
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

  // Toggle Done/Undone
  const handleToggleDone = async (task: Task) => {
    const nextDone = !task.isDone;
    const nextFinished = nextDone ? new Date().toISOString() : null;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, isDone: nextDone, actualFinishedDate: nextFinished } : t
      )
    );
    setMyTasks((prev) =>
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
      setMyTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err) {
      console.error(err);
      // Revert on error
      if (selectedProjectId) loadCurrentProject(selectedProjectId);
      if (viewMode === "my-task") loadMyTasks();
    }
  };

  // Update Assignee
  const handleAssigneeChange = async (task: Task, assignee: string) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, assignee } : t)));
    try {
      await fetch(`/api/project-tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignee }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Update Due Date
  const handleDueDateChange = async (task: Task, dueDate: string) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, dueDate } : t)));
    try {
      await fetch(`/api/project-tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Update Actual Finished Date
  const handleFinishedDateChange = async (task: Task, actualFinishedDate: string) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, actualFinishedDate } : t)));
    try {
      await fetch(`/api/project-tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actualFinishedDate }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setMyTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await fetch(`/api/project-tasks/${taskId}`, { method: "DELETE" });
    } catch (err) {
      console.error(err);
    }
  };

  // Add Task to Section
  const handleAddTask = async (section: "OPEN_ACTION" | "MILESTONE" | "ISSUE") => {
    if (!newEvent.trim() || !currentProject) return;

    try {
      const res = await fetch("/api/project-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: currentProject.id,
          section,
          event: newEvent.trim(),
          assignee: newAssignee || currentUser?.name || "Engineer",
          dueDate: newDueDate || null,
          isDone: false,
          delayNote: "no delay",
        }),
      });

      if (!res.ok) throw new Error("Failed to add task");
      const created = await res.json();
      setTasks((prev) => [...prev, created]);

      // Reset form
      setNewEvent("");
      setNewDueDate("");
      setAddingSection(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete Current Project
  const handleDeleteProject = async () => {
    if (!currentProject) return;
    if (!confirm(`Are you sure you want to delete project "${currentProject.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${currentProject.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete project");
      window.dispatchEvent(new Event("projects-updated"));
      const remaining = projects.filter((p) => p.id !== currentProject.id);
      if (remaining.length > 0) {
        router.push(`/project?id=${remaining[0].id}`);
      } else {
        router.push("/project?view=my-task");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Tasks grouped by section
  const openActionTasks = useMemo(
    () => tasks.filter((t) => t.section === "OPEN_ACTION"),
    [tasks]
  );
  const milestoneTasks = useMemo(
    () => tasks.filter((t) => t.section === "MILESTONE"),
    [tasks]
  );
  const issueTasks = useMemo(
    () => tasks.filter((t) => t.section === "ISSUE"),
    [tasks]
  );

  // Filtered My Tasks
  const filteredMyTasks = useMemo(() => {
    return myTasks.filter((t) => {
      if (myTaskFilter === "pending" && t.isDone) return false;
      if (myTaskFilter === "completed" && !t.isDone) return false;
      if (myTaskFilter === "delayed") {
        const d = computeDelay(t.dueDate, t.actualFinishedDate, t.isDone, t.delayNote);
        if (!d.isDelayed) return false;
      }
      if (myTaskSearch.trim()) {
        const query = myTaskSearch.toLowerCase();
        const matchEvent = t.event.toLowerCase().includes(query);
        const matchProj = t.project?.name.toLowerCase().includes(query) || false;
        if (!matchEvent && !matchProj) return false;
      }
      return true;
    });
  }, [myTasks, myTaskFilter, myTaskSearch]);

  // Section Component Renderer
  const renderSectionTable = (
    title: string,
    section: "OPEN_ACTION" | "MILESTONE" | "ISSUE",
    taskList: Task[],
    headerIcon: React.ReactNode,
    badgeColor: string
  ) => {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        {/* Section Header */}
        <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="p-1 rounded bg-white border border-slate-200 shadow-2xs">
              {headerIcon}
            </span>
            <h3 className="text-xs font-bold text-slate-900 tracking-tight">{title}</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
              {taskList.length} items
            </span>
          </div>

          <button
            onClick={() => {
              setAddingSection(addingSection === section ? null : section);
              setNewEvent("");
              setNewDueDate("");
            }}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-2.5 py-1.5 rounded-lg text-xs shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add {section === "OPEN_ACTION" ? "Action" : section === "MILESTONE" ? "Milestone" : "Issue"}</span>
          </button>
        </div>

        {/* Inline Add Task Form */}
        {addingSection === section && (
          <div className="p-3.5 bg-blue-50/60 border-b border-blue-100 flex flex-wrap items-center gap-2 text-xs">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder={
                  section === "MILESTONE"
                    ? "e.g. assembly AGV 1, Testing AGV 1, pakage and shipment AGV1"
                    : "e.g. Action item description..."
                }
                value={newEvent}
                onChange={(e) => setNewEvent(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div className="w-44">
              <select
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {engineers.map((eng) => (
                  <option key={eng.id} value={eng.name || eng.username}>
                    {eng.name || eng.username}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-36">
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => handleAddTask(section)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs shadow-xs transition shrink-0"
            >
              Add Row
            </button>
            <button
              onClick={() => setAddingSection(null)}
              className="bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs transition shrink-0"
            >
              Cancel
            </button>
          </div>
        )}

        {/* 5-Column To-Do List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3.5 w-10 text-center">Done</th>
                <th className="py-2.5 px-3">The Event</th>
                <th className="py-2.5 px-3 w-48">Assign</th>
                <th className="py-2.5 px-3 w-36">Due Date</th>
                <th className="py-2.5 px-3 w-40">Actual Finished Date</th>
                <th className="py-2.5 px-3 w-36">Delay</th>
                <th className="py-2.5 px-2 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {taskList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-slate-400 italic">
                    No items in {title.toLowerCase()} yet. Click "+ Add {section === "OPEN_ACTION" ? "Action" : section === "MILESTONE" ? "Milestone" : "Issue"}" above to add one.
                  </td>
                </tr>
              ) : (
                taskList.map((task) => {
                  const delay = computeDelay(
                    task.dueDate,
                    task.actualFinishedDate,
                    task.isDone,
                    task.delayNote
                  );

                  return (
                    <tr
                      key={task.id}
                      className={`hover:bg-slate-50/80 transition group ${
                        task.isDone ? "bg-slate-50/30 text-slate-400" : ""
                      }`}
                    >
                      {/* Column 0: Done / Undone Checkbox */}
                      <td className="py-2.5 px-3.5 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={task.isDone}
                          onChange={() => handleToggleDone(task)}
                          className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer transition"
                        />
                      </td>

                      {/* Column 1: The Event */}
                      <td className="py-2.5 px-3 font-medium text-slate-800 align-middle">
                        <span className={task.isDone ? "line-through text-slate-400" : "text-slate-800"}>
                          {task.event}
                        </span>
                      </td>

                      {/* Column 2: Assign (choose which engineer by name) */}
                      <td className="py-2.5 px-3 align-middle">
                        <div className="relative inline-block w-full">
                          <select
                            value={task.assignee}
                            onChange={(e) => handleAssigneeChange(task, e.target.value)}
                            className="w-full appearance-none bg-slate-50 hover:bg-slate-100 text-slate-700 py-1 pl-2 pr-6 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs cursor-pointer truncate"
                          >
                            {engineers.map((eng) => (
                              <option key={eng.id} value={eng.name || eng.username}>
                                {eng.name || eng.username}
                              </option>
                            ))}
                            {!engineers.some((e) => (e.name || e.username) === task.assignee) && (
                              <option value={task.assignee}>{task.assignee}</option>
                            )}
                          </select>
                          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
                        </div>
                      </td>

                      {/* Column 3: Due Date */}
                      <td className="py-2.5 px-3 align-middle">
                        <input
                          type="date"
                          value={task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : ""}
                          onChange={(e) => handleDueDateChange(task, e.target.value)}
                          className="bg-transparent hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Column 4: Actual Finished Date */}
                      <td className="py-2.5 px-3 align-middle">
                        <input
                          type="date"
                          value={task.actualFinishedDate ? format(new Date(task.actualFinishedDate), "yyyy-MM-dd") : ""}
                          onChange={(e) => handleFinishedDateChange(task, e.target.value)}
                          placeholder="—"
                          className={`bg-transparent hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${
                            task.actualFinishedDate ? "text-emerald-700 font-medium" : "text-slate-400"
                          }`}
                        />
                      </td>

                      {/* Column 5: Delay (if no delay then note down 'no delay') */}
                      <td className="py-2.5 px-3 align-middle">
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

                      {/* Delete Action */}
                      <td className="py-2.5 px-2 text-center align-middle">
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-2">
          <div className="w-7 h-7 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading project workspace...</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: MY TASK (Moved from "My role" on top bar)
  // -------------------------------------------------------------
  if (viewMode === "my-task") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
                <CheckSquare className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  My Task
                </h1>
                <p className="text-xs text-slate-500">
                  Tasks and milestones assigned to you across all projects
                </p>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            {(["all", "pending", "delayed", "completed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setMyTaskFilter(f)}
                className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition ${
                  myTaskFilter === f
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search my tasks or project..."
            value={myTaskSearch}
            onChange={(e) => setMyTaskSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
          />
        </div>

        {/* My Task 5-Column Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3.5 w-12 text-center">Done</th>
                  <th className="py-3 px-3">The Event</th>
                  <th className="py-3 px-3 w-40">Project</th>
                  <th className="py-3 px-3 w-40">Assign</th>
                  <th className="py-3 px-3 w-36">Due Date</th>
                  <th className="py-3 px-3 w-40">Actual Finished Date</th>
                  <th className="py-3 px-3 w-36">Delay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMyTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      No tasks found matching your filter.
                    </td>
                  </tr>
                ) : (
                  filteredMyTasks.map((task) => {
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
                        {/* Done/Undone Checkbox */}
                        <td className="py-3 px-3.5 text-center align-middle">
                          <input
                            type="checkbox"
                            checked={task.isDone}
                            onChange={() => handleToggleDone(task)}
                            className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                          />
                        </td>

                        {/* Column 1: The Event */}
                        <td className="py-3 px-3 align-middle">
                          <div className="font-semibold text-slate-800">
                            <span className={task.isDone ? "line-through text-slate-400" : "text-slate-900"}>
                              {task.event}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-tight mt-0.5">
                            {task.section.replace("_", " ")}
                          </div>
                        </td>

                        {/* Project Name */}
                        <td className="py-3 px-3 align-middle">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 max-w-[150px] truncate">
                            {task.project?.name || "Project"}
                          </span>
                        </td>

                        {/* Column 2: Assign */}
                        <td className="py-3 px-3 align-middle font-medium text-slate-700">
                          {task.assignee}
                        </td>

                        {/* Column 3: Due Date */}
                        <td className="py-3 px-3 align-middle text-slate-600">
                          {task.dueDate ? format(new Date(task.dueDate), "d/M/yyyy") : "—"}
                        </td>

                        {/* Column 4: Actual Finished Date */}
                        <td className="py-3 px-3 align-middle">
                          {task.actualFinishedDate ? (
                            <span className="text-emerald-700 font-semibold">
                              {format(new Date(task.actualFinishedDate), "d/M/yyyy")}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Pending</span>
                          )}
                        </td>

                        {/* Column 5: Delay */}
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

  // -------------------------------------------------------------
  // VIEW: SINGLE PROJECT (Always 3 Sections: Open Action, Milestone, Issue)
  // -------------------------------------------------------------
  if (!currentProject) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-slate-800">No project selected</h3>
        <p className="text-xs text-slate-500 mt-1">Select a project from the left sidebar under Work, or create one.</p>
      </div>
    );
  }

  const completedCount = tasks.filter((t) => t.isDone).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Project Overview Card */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
              <FolderKanban className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  {currentProject.name}
                </h1>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                  {currentProject.code}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentProject.description || "Field deployment and engineering tasks"}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats & Delete */}
        <div className="flex items-center space-x-4">
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-slate-600">
              Progress: <span className="font-bold text-slate-900">{completedCount}/{tasks.length} Done</span> ({progressPercent}%)
            </span>
            <div className="w-36 bg-slate-100 rounded-full h-2 mt-1 overflow-hidden border border-slate-200">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <button
            onClick={handleDeleteProject}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Delete Project"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. TOP SECTION: Open Action */}
      {renderSectionTable(
        "Open Action",
        "OPEN_ACTION",
        openActionTasks,
        <Target className="w-4 h-4 text-amber-600" />,
        "bg-amber-50 text-amber-700 border border-amber-200"
      )}

      {/* 2. MIDDLE SECTION: Milestone */}
      {renderSectionTable(
        "Milestone",
        "MILESTONE",
        milestoneTasks,
        <Layers className="w-4 h-4 text-blue-600" />,
        "bg-blue-50 text-blue-700 border border-blue-200"
      )}

      {/* 3. BOTTOM SECTION: Issue */}
      {renderSectionTable(
        "Issue",
        "ISSUE",
        issueTasks,
        <AlertTriangle className="w-4 h-4 text-rose-600" />,
        "bg-rose-50 text-rose-700 border border-rose-200"
      )}
    </div>
  );
}
