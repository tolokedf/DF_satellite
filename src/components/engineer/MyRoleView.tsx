"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Search, 
  Calendar, 
  User, 
  FolderKanban, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  Flame,
  ArrowUpDown,
  Filter
} from "lucide-react";
import { format, differenceInDays, isAfter, startOfDay } from "date-fns";

interface Milestone {
  id: string;
  name: string;
  assignee: string;
  dueDate: string;
  actualCompletionDate: string | null;
  status: string;
  notes?: string | null;
  projectId?: string | null;
  project?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

interface MyRoleViewProps {
  currentUser: any;
}

export default function MyRoleView({ currentUser }: MyRoleViewProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "MINE" | "DELAYED" | "COMPLETED">("ALL");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formAssignee, setFormAssignee] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formActualDate, setFormActualDate] = useState("");
  const [formProjectId, setFormProjectId] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Quick complete modal
  const [quickCompleteItem, setQuickCompleteItem] = useState<Milestone | null>(null);
  const [quickCompleteDate, setQuickCompleteDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/milestones");
      if (res.ok) {
        const data = await res.json();
        setMilestones(data);
      }
    } catch (err) {
      console.error("Failed to fetch milestones:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    }
  };

  useEffect(() => {
    fetchMilestones();
    fetchProjects();
  }, []);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingMilestone(null);
    setFormName("");
    setFormAssignee(currentUser?.name || currentUser?.username || "engineer 1");
    setFormDueDate(new Date().toISOString().split("T")[0]);
    setFormActualDate("");
    setFormProjectId(projects[0]?.id || "");
    setFormNotes("");
    setShowModal(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (m: Milestone) => {
    setEditingMilestone(m);
    setFormName(m.name);
    setFormAssignee(m.assignee);
    setFormDueDate(m.dueDate ? new Date(m.dueDate).toISOString().split("T")[0] : "");
    setFormActualDate(
      m.actualCompletionDate
        ? new Date(m.actualCompletionDate).toISOString().split("T")[0]
        : ""
    );
    setFormProjectId(m.projectId || "");
    setFormNotes(m.notes || "");
    setShowModal(true);
  };

  const handleSaveMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formAssignee.trim() || !formDueDate) return;

    try {
      setSaving(true);
      if (editingMilestone) {
        // Update
        const res = await fetch(`/api/milestones/${editingMilestone.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            assignee: formAssignee.trim(),
            dueDate: formDueDate,
            actualCompletionDate: formActualDate || null,
            projectId: formProjectId || null,
            notes: formNotes || null,
            status: formActualDate ? "COMPLETED" : "IN_PROGRESS",
          }),
        });
        if (res.ok) {
          setShowModal(false);
          fetchMilestones();
        }
      } else {
        // Create
        const res = await fetch("/api/milestones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            assignee: formAssignee.trim(),
            dueDate: formDueDate,
            actualCompletionDate: formActualDate || null,
            projectId: formProjectId || null,
            notes: formNotes || null,
            status: formActualDate ? "COMPLETED" : "IN_PROGRESS",
          }),
        });
        if (res.ok) {
          setShowModal(false);
          fetchMilestones();
        }
      }
    } catch (err) {
      console.error("Failed to save milestone:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    if (!confirm("Are you sure you want to delete this milestone?")) return;
    try {
      const res = await fetch(`/api/milestones/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchMilestones();
      }
    } catch (err) {
      console.error("Failed to delete milestone:", err);
    }
  };

  const handleQuickComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCompleteItem || !quickCompleteDate) return;

    try {
      const res = await fetch(`/api/milestones/${quickCompleteItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actualCompletionDate: quickCompleteDate,
          status: "COMPLETED",
        }),
      });
      if (res.ok) {
        setQuickCompleteItem(null);
        fetchMilestones();
      }
    } catch (err) {
      console.error("Failed to update milestone completion:", err);
    }
  };

  /**
   * Calculate delay (days)
   * Formula:
   * - If actualCompletionDate is set: differenceInDays(actualCompletionDate, dueDate)
   * - If not completed: differenceInDays(today, dueDate)
   */
  const getDelayInfo = (dueDateStr: string, actualDateStr: string | null) => {
    const due = startOfDay(new Date(dueDateStr));
    const today = startOfDay(new Date());

    if (actualDateStr) {
      const actual = startOfDay(new Date(actualDateStr));
      const days = differenceInDays(actual, due);
      if (days > 0) {
        return {
          days,
          text: `+${days} days`,
          status: "DELAYED",
          color: "bg-rose-100 text-rose-700 border-rose-200",
        };
      } else {
        return {
          days: 0,
          text: "0 days",
          status: "ON_TIME",
          color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        };
      }
    } else {
      // Pending / In-progress
      const days = differenceInDays(today, due);
      if (days > 0) {
        return {
          days,
          text: `+${days} days`,
          status: "OVERDUE",
          color: "bg-amber-100 text-amber-800 border-amber-200",
        };
      } else {
        return {
          days: 0,
          text: "0 days",
          status: "ON_TRACK",
          color: "bg-slate-100 text-slate-700 border-slate-200",
        };
      }
    }
  };

  // Filtered milestones
  const filteredMilestones = useMemo(() => {
    return milestones.filter((m) => {
      // Search
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        m.name.toLowerCase().includes(search) ||
        m.assignee.toLowerCase().includes(search) ||
        (m.project?.name && m.project.name.toLowerCase().includes(search)) ||
        (m.project?.code && m.project.code.toLowerCase().includes(search));

      if (!matchesSearch) return false;

      // Filter Type
      if (filterType === "MINE") {
        const userIdentifier = (currentUser?.name || currentUser?.username || "").toLowerCase();
        return m.assignee.toLowerCase().includes(userIdentifier);
      }
      if (filterType === "DELAYED") {
        const delay = getDelayInfo(m.dueDate, m.actualCompletionDate);
        return delay.days > 0;
      }
      if (filterType === "COMPLETED") {
        return !!m.actualCompletionDate;
      }

      return true;
    });
  }, [milestones, searchTerm, filterType, currentUser]);

  // High-level milestone summary stats
  const totalCount = milestones.length;
  const completedCount = milestones.filter((m) => !!m.actualCompletionDate).length;
  const delayedCount = milestones.filter((m) => {
    const info = getDelayInfo(m.dueDate, m.actualCompletionDate);
    return info.days > 0;
  }).length;
  const pendingCount = totalCount - completedCount;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            My role
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Engineering milestone tracking, schedule commitments, and actual completion variance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Milestone</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Milestones</span>
            <FolderKanban className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalCount}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Fleet deployment scope</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{completedCount}</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
            {totalCount ? Math.round((completedCount / totalCount) * 100) : 0}% delivery rate
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Delayed / Overdue</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{delayedCount}</div>
          <p className="text-[11px] text-rose-600 font-medium mt-0.5">
            Requires engineering catch-up
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Active</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{pendingCount}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">In execution pipeline</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {/* Search box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search milestone or assignee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Filter Pill Buttons with horizontal scrolling on mobile */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none whitespace-nowrap">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition ${
                filterType === "ALL"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("MINE")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition ${
                filterType === "MINE"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              My Milestones
            </button>
            <button
              onClick={() => setFilterType("DELAYED")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition ${
                filterType === "DELAYED"
                  ? "bg-rose-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Delayed
            </button>
            <button
              onClick={() => setFilterType("COMPLETED")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition ${
                filterType === "COMPLETED"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500 self-end sm:self-auto">
          Showing <span className="font-semibold text-slate-800">{filteredMilestones.length}</span> of {totalCount} milestones
        </div>
      </div>

      {/* Main Milestones Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">name</th>
                <th className="py-3 px-4">assignee</th>
                <th className="py-3 px-4">due date</th>
                <th className="py-3 px-4">actual completion date</th>
                <th className="py-3 px-4">delay (days)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading milestones...
                  </td>
                </tr>
              ) : filteredMilestones.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No milestones found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredMilestones.map((m) => {
                  const delayInfo = getDelayInfo(m.dueDate, m.actualCompletionDate);
                  const isCompleted = !!m.actualCompletionDate;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition">
                      {/* 1. Name */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex flex-col">
                          <span className="text-slate-900 font-semibold">{m.name}</span>
                          {m.project && (
                            <span className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">
                              {m.project.code} • {m.project.name}
                            </span>
                          )}
                          {m.notes && (
                            <span className="text-[11px] text-slate-500 font-normal italic mt-0.5 line-clamp-1">
                              {m.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. Assignee */}
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                            {m.assignee.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{m.assignee}</span>
                        </div>
                      </td>

                      {/* 3. Due date */}
                      <td className="py-3.5 px-4 text-slate-700 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{format(new Date(m.dueDate), "dd MMM yyyy")}</span>
                        </div>
                      </td>

                      {/* 4. Actual completion date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isCompleted ? (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{format(new Date(m.actualCompletionDate!), "dd MMM yyyy")}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setQuickCompleteItem(m);
                              setQuickCompleteDate(new Date().toISOString().split("T")[0]);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 border border-slate-200 transition cursor-pointer"
                            title="Mark as Completed"
                          >
                            <Clock className="w-3 h-3 text-amber-500" />
                            <span>Pending (Set Date)</span>
                          </button>
                        )}
                      </td>

                      {/* 5. Delay (days) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${delayInfo.color}`}
                        >
                          {delayInfo.days > 0 ? (
                            <span className="mr-1">⚠️</span>
                          ) : (
                            <Check className="w-3 h-3 mr-1 text-emerald-600" />
                          )}
                          <span>{delayInfo.text}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Milestone"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMilestone(m.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Milestone"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Milestone Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col my-auto">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingMilestone ? "Edit Milestone" : "Add New Milestone"}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track commitment, due date, and actual completion date.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMilestone} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Milestone Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Site Acceptance Test (SAT)"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assignee *
                  </label>
                  <input
                    type="text"
                    required
                    value={formAssignee}
                    onChange={(e) => setFormAssignee(e.target.value)}
                    placeholder="Engineer name"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Associated Project
                  </label>
                  <select
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800"
                  >
                    <option value="">None / General</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Actual Completion Date
                  </label>
                  <input
                    type="date"
                    value={formActualDate}
                    onChange={(e) => setFormActualDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notes / Progress Status
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Optional context, delays or dependencies..."
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingMilestone ? "Update Milestone" : "Create Milestone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Mark Complete Modal */}
      {quickCompleteItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Mark Milestone as Completed
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {quickCompleteItem.name}
                </p>
              </div>
              <button
                onClick={() => setQuickCompleteItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickComplete} className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Actual Completion Date
                </label>
                <input
                  type="date"
                  required
                  value={quickCompleteDate}
                  onChange={(e) => setQuickCompleteDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Target Due Date: {format(new Date(quickCompleteItem.dueDate), "dd MMM yyyy")}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuickCompleteItem(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
                >
                  Confirm Completion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
