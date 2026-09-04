"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  FolderKanban, 
  Bot, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Plus, 
  Building2, 
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight
} from "lucide-react";
import { format } from "date-fns";

export default function PortfolioOverview() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCompany, setFilterCompany] = useState<string>("ALL");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  // New project form state
  const [companies, setCompanies] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [newCompanyId, setNewCompanyId] = useState("");
  const [newSiteId, setNewSiteId] = useState("");
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newLead, setNewLead] = useState("DF Robotics Engineer");
  const [newTargetGoLive, setNewTargetGoLive] = useState("");
  const [newDriveFolder, setNewDriveFolder] = useState("");

  const fetchProjects = () => {
    setLoading(true);
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProjects(data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch(() => {});

    fetchProjects();
    fetch("/api/sites")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSites(data);
          // Group companies
          const compMap: Record<string, any> = {};
          data.forEach((s) => {
            if (s.company && !compMap[s.company.id]) {
              compMap[s.company.id] = s.company;
            }
          });
          const compList = Object.values(compMap);
          setCompanies(compList);
          if (compList.length > 0) setNewCompanyId(compList[0].id);
          if (data.length > 0) setNewSiteId(data[0].id);
        }
      });
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newCode || !newCompanyId || !newSiteId) return;

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          code: newCode,
          companyId: newCompanyId,
          siteId: newSiteId,
          leadEngineer: newLead,
          targetGoLive: newTargetGoLive || null,
          gdriveFolderUrl: newDriveFolder || null,
        }),
      });

      if (res.ok) {
        setShowNewModal(false);
        setNewName("");
        setNewCode("");
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (filterCompany !== "ALL" && p.companyId !== filterCompany) return false;
    return true;
  });

  const totalRobots = projects.reduce((acc, p) => acc + (p.site?.robots?.length || 0), 0);
  const totalOpenActions = projects.reduce(
    (acc, p) => acc + (p.actionItems?.filter((a: any) => a.status !== "DONE").length || 0),
    0
  );
  const totalOpenIssues = projects.reduce(
    (acc, p) => acc + (p.issues?.filter((i: any) => i.status !== "CLOSED").length || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Task Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Task
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Task overview across active robot field deployments and customer operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Field Project</span>
          </button>
        </div>
      </div>

      {/* High-Level Portfolio Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Deployments</span>
            <FolderKanban className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{projects.length}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Across Proton, Perodua, ST Muar</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Robots Commissioned</span>
            <Bot className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalRobots}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Total AGVs, AMRs & ARVs in field</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Open Actions (OAL)</span>
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalOpenActions}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Pending engineering tasks</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Critical Issues</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalOpenIssues}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Active robot breakdown tickets</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Company filter dropdown without 'Customer:' text */}
          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none font-medium text-slate-800"
          >
            <option value="ALL">All Companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-700">{filteredProjects.length}</span> {filteredProjects.length === 1 ? "deployment" : "deployments"}
        </div>
      </div>

      {/* Standardized Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((proj) => {
          const totalActions = proj.actionItems?.length || 0;
          const completedActions = proj.actionItems?.filter((a: any) => a.status === "DONE").length || 0;
          const progressPercent = totalActions ? Math.round((completedActions / totalActions) * 100) : 0;
          const activeIssues = proj.issues?.filter((i: any) => i.status !== "CLOSED").length || 0;
          const robotCount = proj.site?.robots?.length || 0;

          const healthStyles: Record<string, { bg: string; label: string }> = {
            ON_TRACK: { bg: "bg-emerald-100 text-emerald-800 border-emerald-200", label: "On Track" },
            AT_RISK: { bg: "bg-amber-100 text-amber-800 border-amber-200", label: "At Risk" },
            OFF_TRACK: { bg: "bg-rose-100 text-rose-800 border-rose-200", label: "Delayed" },
          };
          const health = healthStyles[proj.health] || healthStyles.ON_TRACK;

          return (
            <div
              key={proj.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {proj.code}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${health.bg}`}>
                    {health.label}
                  </span>
                </div>

                <Link
                  href={`/projects/${proj.id}`}
                  className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-2"
                >
                  {proj.name}
                </Link>

                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-700">{proj.company?.name}</span>
                  <span>•</span>
                  <span>{proj.site?.name}</span>
                </div>

                <p className="text-xs text-slate-500 mt-2.5 line-clamp-2">
                  {proj.description || "Standard field deployment and robotics commissioning."}
                </p>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                    <span className="font-medium">OAL Completion</span>
                    <span className="font-bold">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Standard Sections Badge Summary */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                  <div className="bg-slate-50 rounded p-1.5">
                    <div className="text-xs font-bold text-slate-800">{robotCount}</div>
                    <div className="text-[10px] text-slate-400">Robots</div>
                  </div>
                  <div className="bg-slate-50 rounded p-1.5">
                    <div className="text-xs font-bold text-amber-700">
                      {totalActions - completedActions}
                    </div>
                    <div className="text-[10px] text-slate-400">Open OAL</div>
                  </div>
                  <div className="bg-slate-50 rounded p-1.5">
                    <div className="text-xs font-bold text-rose-700">{activeIssues}</div>
                    <div className="text-[10px] text-slate-400">Issues</div>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Go-Live:{" "}
                    <strong>
                      {proj.targetGoLive ? format(new Date(proj.targetGoLive), "MMM yyyy") : "TBD"}
                    </strong>
                  </span>
                </div>
                <Link
                  href={`/projects/${proj.id}`}
                  className="font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 group-hover:underline"
                >
                  <span>Open Workspace</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal to Create Project */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full p-4 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col my-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Create Field Deployment Project</h3>
            <p className="text-xs text-slate-500 mb-4">
              Instantiates a standardized field project with OAL, Issues, Short Stops, MoM, and Daily Reports.
            </p>

            <form onSubmit={handleCreateProject} className="space-y-4 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Proton Tanjung Malim AMR Delivery"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Project Code *</label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="PRJ-PTN-03"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Engineer</label>
                  <input
                    type="text"
                    value={newLead}
                    onChange={(e) => setNewLead(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer *</label>
                  <select
                    value={newCompanyId}
                    onChange={(e) => setNewCompanyId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Site *</label>
                  <select
                    value={newSiteId}
                    onChange={(e) => setNewSiteId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none"
                  >
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Go-Live</label>
                  <input
                    type="date"
                    value={newTargetGoLive}
                    onChange={(e) => setNewTargetGoLive(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Google Drive Folder Link</label>
                  <input
                    type="url"
                    value={newDriveFolder}
                    onChange={(e) => setNewDriveFolder(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2 rounded-lg shadow"
                >
                  Create Standardized Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
