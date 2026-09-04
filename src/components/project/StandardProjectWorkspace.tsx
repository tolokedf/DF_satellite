"use client";

import React, { useState } from "react";
import { 
  CheckSquare, 
  AlertTriangle, 
  Clock, 
  FileText, 
  CalendarDays, 
  Printer, 
  ExternalLink, 
  Plus, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  Bot, 
  UserCheck, 
  Edit3, 
  Trash2,
  Calendar,
  Layers,
  ChevronDown
} from "lucide-react";
import { format } from "date-fns";

interface StandardProjectWorkspaceProps {
  project: any;
  onRefresh: () => void;
}

export default function StandardProjectWorkspace({ project, onRefresh }: StandardProjectWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"oal" | "issues" | "stops" | "mom" | "dar">("oal");

  // Modal states
  const [showAddActionModal, setShowAddActionModal] = useState(false);
  const [showAddIssueModal, setShowAddIssueModal] = useState(false);
  const [showAddMoMModal, setShowAddMoMModal] = useState(false);
  const [showAddDARModal, setShowAddDARModal] = useState(false);

  // New Action Item state
  const [actionTitle, setActionTitle] = useState("");
  const [actionOwner, setActionOwner] = useState(project.leadEngineer || "DF Engineer");
  const [actionPriority, setActionPriority] = useState("HIGH");
  const [actionCategory, setActionCategory] = useState("HARDWARE");
  const [actionTargetDate, setActionTargetDate] = useState("");
  const [actionNotes, setActionNotes] = useState("");

  // New Issue state
  const [issueTitle, setIssueTitle] = useState("");
  const [issueRobotId, setIssueRobotId] = useState("");
  const [issueSeverity, setIssueSeverity] = useState("MAJOR");
  const [issueCategory, setIssueCategory] = useState("PANEL_TRANSFER");
  const [issue5Why, setIssue5Why] = useState("");
  const [issueCountermeasure, setIssueCountermeasure] = useState("");

  // New MoM state
  const [momTitle, setMomTitle] = useState("");
  const [momDate, setMomDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [momAttendees, setMomAttendees] = useState("");
  const [momAgenda, setMomAgenda] = useState("");
  const [momDecisions, setMomDecisions] = useState("");
  const [momDriveLink, setMomDriveLink] = useState("");

  // New DAR state
  const [darDate, setDarDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [darEngineer, setDarEngineer] = useState(project.leadEngineer || "Field Engineer");
  const [darShift, setDarShift] = useState("DAY");
  const [darActivities, setDarActivities] = useState("");
  const [darBlockers, setDarBlockers] = useState("");
  const [darNextPlan, setDarNextPlan] = useState("");
  const [darDriveLink, setDarDriveLink] = useState("");

  // Handler: Add Action Item
  const handleAddAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTitle) return;

    await fetch("/api/action-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: project.id,
        title: actionTitle,
        owner: actionOwner,
        priority: actionPriority,
        category: actionCategory,
        targetDate: actionTargetDate || null,
        notes: actionNotes,
      }),
    });

    setShowAddActionModal(false);
    setActionTitle("");
    setActionNotes("");
    onRefresh();
  };

  // Handler: Update Action Status
  const handleToggleActionStatus = async (item: any, newStatus: string) => {
    await fetch("/api/action-items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, status: newStatus }),
    });
    onRefresh();
  };

  // Handler: Add Issue
  const handleAddIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTitle) return;

    await fetch("/api/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: project.id,
        siteId: project.siteId,
        robotId: issueRobotId || null,
        title: issueTitle,
        severity: issueSeverity,
        rootCauseCategory: issueCategory,
        fiveWhyAnalysis: issue5Why,
        permanentCountermeasure: issueCountermeasure,
      }),
    });

    setShowAddIssueModal(false);
    setIssueTitle("");
    setIssue5Why("");
    setIssueCountermeasure("");
    onRefresh();
  };

  // Handler: Update Issue Status
  const handleUpdateIssueStatus = async (issueId: string, status: string) => {
    await fetch("/api/issues", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: issueId, status }),
    });
    onRefresh();
  };

  // Handler: Export Dossier (HTML / PDF)
  const handleExport = () => {
    window.open(`/api/export?projectId=${project.id}`, "_blank");
  };

  const actionItems = project.actionItems || [];
  const issues = project.issues || [];
  const shortStops = project.shortStops || [];
  const meetingMinutes = project.meetingMinutes || [];
  const dailyReports = project.dailyReports || [];

  return (
    <div className="space-y-6">
      {/* Project Header Dossier */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {project.code}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {project.company?.name} ({project.site?.name})
              </span>
              <span className="text-slate-300">•</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  project.health === "ON_TRACK"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : project.health === "AT_RISK"
                    ? "bg-amber-100 text-amber-800 border-amber-200"
                    : "bg-rose-100 text-rose-800 border-rose-200"
                }`}
              >
                {project.health.replace("_", " ")}
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {project.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              {project.description || "Turnkey field deployment and automated robotics commissioning."}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {project.gdriveFolderUrl && (
              <a
                href={project.gdriveFolderUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2 rounded-lg transition flex items-center gap-1.5"
                title="Synced Google Drive Folder"
              >
                <ExternalLink className="w-4 h-4 text-blue-600" />
                <span>Google Drive</span>
              </a>
            )}

            <button
              onClick={handleExport}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow transition flex items-center gap-1.5"
              title="Export complete standardized dossier to HTML / PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Export HTML / PDF</span>
            </button>
          </div>
        </div>

        {/* Lead Engineer & Target Date Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-4 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Lead Engineer</span>
            <span className="font-semibold text-slate-800">{project.leadEngineer}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Go-Live</span>
            <span className="font-semibold text-slate-800">
              {project.targetGoLive ? format(new Date(project.targetGoLive), "d/M/yyyy") : "TBD"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Site Robots</span>
            <span className="font-semibold text-slate-800">
              {project.site?.robots?.length || 0} Units Assigned
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Template Architecture</span>
            <span className="font-semibold text-blue-600">Standardized Field Suite</span>
          </div>
        </div>
      </div>

      {/* Standardized Tabs Navigation (Asana-style) */}
      <div className="border-b border-slate-200 flex items-center space-x-1 overflow-x-auto bg-white px-3 rounded-t-xl">
        <button
          onClick={() => setActiveTab("oal")}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === "oal"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Open Action List (OAL)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">
            {actionItems.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("issues")}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === "issues"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Issue List (RCA / 5-Why)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-50 text-rose-600">
            {issues.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("stops")}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === "stops"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Short Stop Logs</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">
            {shortStops.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("mom")}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === "mom"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Minutes Meeting (MoM)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">
            {meetingMinutes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("dar")}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === "dar"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Daily Activity Reports (DAR)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">
            {dailyReports.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Open Action List (OAL) */}
      {activeTab === "oal" && (
        <div className="bg-white rounded-b-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Open Action List (OAL)</h2>
              <p className="text-xs text-slate-400">
                Standardized task tracker with owners, priorities, and milestone deadlines.
              </p>
            </div>
            <button
              onClick={() => setShowAddActionModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Action Item</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-16">Item No</th>
                  <th className="py-2.5 px-3">Action Task & Notes</th>
                  <th className="py-2.5 px-3 w-28">Category</th>
                  <th className="py-2.5 px-3 w-36">Owner</th>
                  <th className="py-2.5 px-3 w-24">Priority</th>
                  <th className="py-2.5 px-3 w-28">Target Date</th>
                  <th className="py-2.5 px-3 w-32 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {actionItems.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-bold text-slate-700">{item.itemNo}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{item.title}</div>
                      {item.notes && (
                        <div className="text-[11px] text-slate-500 mt-0.5">{item.notes}</div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">{item.owner}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          item.priority === "CRITICAL"
                            ? "bg-rose-100 text-rose-800"
                            : item.priority === "HIGH"
                            ? "bg-orange-100 text-orange-800"
                            : item.priority === "MEDIUM"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {item.targetDate ? format(new Date(item.targetDate), "d/M/yyyy") : "-"}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <select
                        value={item.status}
                        onChange={(e) => handleToggleActionStatus(item, e.target.value)}
                        className={`text-[11px] font-bold px-2 py-1 rounded border focus:outline-none ${
                          item.status === "DONE"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : item.status === "IN_PROGRESS"
                            ? "bg-blue-50 text-blue-800 border-blue-300"
                            : item.status === "BLOCKED"
                            ? "bg-rose-50 text-rose-800 border-rose-300"
                            : "bg-slate-50 text-slate-700 border-slate-300"
                        }`}
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="BLOCKED">BLOCKED</option>
                        <option value="DONE">DONE</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Issue Tracker */}
      {activeTab === "issues" && (
        <div className="bg-white rounded-b-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Robot Issue Tracker & RCA</h2>
              <p className="text-xs text-slate-400">
                Root-cause analysis (5-Why) and permanent countermeasures for AGV/AMR/ARV breakdowns.
              </p>
            </div>
            <button
              onClick={() => setShowAddIssueModal(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Issue Ticket</span>
            </button>
          </div>

          <div className="space-y-3">
            {issues.map((iss: any) => (
              <div
                key={iss.id}
                className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-400">{iss.issueNo}</span>
                      {iss.robot && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {iss.robot.code} ({iss.robot.model})
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          iss.severity === "CRITICAL"
                            ? "bg-rose-100 text-rose-800"
                            : iss.severity === "MAJOR"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {iss.severity}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{iss.title}</h3>
                    <p className="text-xs text-slate-600 mt-1">{iss.description}</p>
                  </div>

                  {/* Status Dropdown */}
                  <select
                    value={iss.status}
                    onChange={(e) => handleUpdateIssueStatus(iss.id, e.target.value)}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-none shrink-0 ${
                      iss.status === "CLOSED"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : iss.status === "VALIDATING"
                        ? "bg-purple-50 text-purple-800 border-purple-300"
                        : "bg-rose-50 text-rose-800 border-rose-300"
                    }`}
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="INVESTIGATING">INVESTIGATING</option>
                    <option value="COUNTERMEASURE_PROPOSED">COUNTERMEASURE</option>
                    <option value="VALIDATING">VALIDATING</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                {/* 5-Why and Countermeasure Box */}
                {(iss.fiveWhyAnalysis || iss.permanentCountermeasure) && (
                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {iss.fiveWhyAnalysis && (
                      <div className="bg-sky-50/70 p-2.5 rounded-lg border border-sky-100">
                        <span className="font-bold text-sky-900 block text-[10px] uppercase">
                          Root Cause Analysis (5-Why)
                        </span>
                        <p className="text-slate-700 mt-0.5 whitespace-pre-wrap">{iss.fiveWhyAnalysis}</p>
                      </div>
                    )}
                    {iss.permanentCountermeasure && (
                      <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100">
                        <span className="font-bold text-emerald-900 block text-[10px] uppercase">
                          Permanent Countermeasure
                        </span>
                        <p className="text-slate-700 mt-0.5 whitespace-pre-wrap">
                          {iss.permanentCountermeasure}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Short Stop Logs */}
      {activeTab === "stops" && (
        <div className="bg-white rounded-b-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Short Stop Telemetry Logs</h2>
            <p className="text-xs text-slate-400">
              Site micro-stoppages logged via operator UI or fleet controller.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-32">Timestamp</th>
                  <th className="py-2.5 px-3 w-24">Robot</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Specific Location</th>
                  <th className="py-2.5 px-3 w-20">Downtime</th>
                  <th className="py-2.5 px-3 w-28">Recovery</th>
                  <th className="py-2.5 px-3 w-28">Resolved By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {shortStops.map((stop: any) => (
                  <tr key={stop.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 text-slate-600">
                      {format(new Date(stop.startTime), "d/M/yyyy HH:mm")}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">{stop.robot?.code}</td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold text-[11px]">
                        {stop.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {stop.specificLocation || stop.zone || "-"}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {stop.durationMinutes} min
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {stop.recoveryAction || "Auto Resume"}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{stop.resolvedBy || "Operator"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Minutes of Meeting (MoM) */}
      {activeTab === "mom" && (
        <div className="bg-white rounded-b-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Minutes of Meeting (MoM)</h2>
              <p className="text-xs text-slate-400">
                Customer alignment meetings, decisions, and synced Google Drive records.
              </p>
            </div>
            <button
              onClick={() => setShowAddMoMModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record MoM</span>
            </button>
          </div>

          <div className="space-y-3">
            {meetingMinutes.map((mom: any) => (
              <div key={mom.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-blue-600 mb-1">
                      {format(new Date(mom.meetingDate), "d/M/yyyy")}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{mom.title}</h3>
                    <div className="text-xs text-slate-500 mt-1">
                      <strong>Attendees:</strong> {mom.attendees}
                    </div>
                  </div>
                  {mom.driveLink && (
                    <a
                      href={mom.driveLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Google Drive File</span>
                    </a>
                  )}
                </div>

                {mom.agenda && (
                  <div className="mt-3 text-xs">
                    <strong className="text-slate-700 block">Meeting Agenda:</strong>
                    <p className="text-slate-600 whitespace-pre-wrap mt-0.5">{mom.agenda}</p>
                  </div>
                )}

                {mom.keyDecisions && (
                  <div className="mt-3 bg-white p-3 rounded-lg border border-slate-200 text-xs">
                    <strong className="text-emerald-800 block">Key Decisions & Next Steps:</strong>
                    <p className="text-slate-700 whitespace-pre-wrap mt-0.5">{mom.keyDecisions}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Daily Activity Reports (DAR) */}
      {activeTab === "dar" && (
        <div className="bg-white rounded-b-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Daily Activity Reports (DAR)</h2>
              <p className="text-xs text-slate-400">
                Site progress logs, shift blockers, and commissioning reports by field engineers.
              </p>
            </div>
            <button
              onClick={() => setShowAddDARModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Daily Report</span>
            </button>
          </div>

          <div className="space-y-4">
            {dailyReports.map((dar: any) => (
              <div key={dar.id} className="border border-slate-200 rounded-xl p-4 bg-white">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-bold text-slate-900">
                      {format(new Date(dar.reportDate), "d/M/yyyy (EEEE)")}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {dar.shift} SHIFT
                    </span>
                    <span className="text-xs text-slate-500">
                      Engineer: <strong>{dar.engineerName}</strong>
                    </span>
                  </div>
                  {dar.driveLink && (
                    <a
                      href={dar.driveLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Drive Backup</span>
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 md:col-span-2">
                    <span className="font-bold text-slate-800 block text-[11px] uppercase mb-1">
                      Activities Accomplished
                    </span>
                    <p className="text-slate-700 whitespace-pre-wrap">{dar.activitiesDone}</p>
                  </div>

                  <div className="space-y-3">
                    {dar.blockers && (
                      <div className="bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                        <span className="font-bold text-rose-900 block text-[10px] uppercase mb-0.5">
                          Blockers / Impediments
                        </span>
                        <p className="text-slate-700 whitespace-pre-wrap">{dar.blockers}</p>
                      </div>
                    )}
                    {dar.nextPlan && (
                      <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                        <span className="font-bold text-blue-900 block text-[10px] uppercase mb-0.5">
                          Tomorrow's Plan
                        </span>
                        <p className="text-slate-700 whitespace-pre-wrap">{dar.nextPlan}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Add Action Item */}
      {showAddActionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add Open Action Item (OAL)</h3>
            <p className="text-xs text-slate-500 mb-4">Assigns a field milestone or corrective action.</p>

            <form onSubmit={handleAddAction} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Action Title *</label>
                <input
                  type="text"
                  required
                  value={actionTitle}
                  onChange={(e) => setActionTitle(e.target.value)}
                  placeholder="e.g. Recalibrate docking optical sensor"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Owner</label>
                  <input
                    type="text"
                    value={actionOwner}
                    onChange={(e) => setActionOwner(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={actionPriority}
                    onChange={(e) => setActionPriority(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={actionCategory}
                    onChange={(e) => setActionCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none"
                  >
                    <option value="HARDWARE">Hardware</option>
                    <option value="SOFTWARE">Software</option>
                    <option value="MECHANICAL">Mechanical</option>
                    <option value="NETWORK">Network</option>
                    <option value="FACILITY">Facility</option>
                    <option value="SAFETY">Safety</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={actionTargetDate}
                    onChange={(e) => setActionTargetDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Details</label>
                <textarea
                  rows={2}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddActionModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-1.5 rounded-lg"
                >
                  Save Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Issue */}
      {showAddIssueModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">Log Robot Issue & 5-Why RCA</h3>
            <p className="text-xs text-slate-500 mb-4">Captures root causes and countermeasures.</p>

            <form onSubmit={handleAddIssue} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Summary *</label>
                <input
                  type="text"
                  required
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                  placeholder="e.g. AGV-03 intermittent wheel slippage on oily expansion joint"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Affected Robot</label>
                  <select
                    value={issueRobotId}
                    onChange={(e) => setIssueRobotId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none"
                  >
                    <option value="">Whole Site</option>
                    {project.site?.robots?.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {r.code} ({r.model})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Severity</label>
                  <select
                    value={issueSeverity}
                    onChange={(e) => setIssueSeverity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="MAJOR">Major</option>
                    <option value="MODERATE">Moderate</option>
                    <option value="MINOR">Minor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">5-Why Root Cause Analysis</label>
                <textarea
                  rows={3}
                  value={issue5Why}
                  onChange={(e) => setIssue5Why(e.target.value)}
                  placeholder="1. Why stopped? ... 2. Why slipped? ... 3. Root Cause..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Permanent Countermeasure</label>
                <textarea
                  rows={2}
                  value={issueCountermeasure}
                  onChange={(e) => setIssueCountermeasure(e.target.value)}
                  placeholder="Long-term fix applied to prevent recurrence..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddIssueModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4 py-1.5 rounded-lg"
                >
                  Record Issue Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
