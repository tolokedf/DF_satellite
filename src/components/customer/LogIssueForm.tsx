"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2, AlertCircle, Wrench, FileText } from "lucide-react";
import { useSite } from "@/context/SiteContext";

interface LogIssueFormProps {
  initialSiteId?: string;
  onSuccess?: () => void;
}

export default function LogIssueForm({ initialSiteId, onSuccess }: LogIssueFormProps) {
  const { currentSiteId, currentCustomerId } = useSite();
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>(initialSiteId || "");
  const [robots, setRobots] = useState<any[]>([]);
  const [selectedRobotId, setSelectedRobotId] = useState<string>("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("MODERATE");
  const [rootCauseCategory, setRootCauseCategory] = useState("PANEL_TRANSFER");
  const [immediateAction, setImmediateAction] = useState("");
  const [fiveWhyAnalysis, setFiveWhyAnalysis] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/sites")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const available = currentCustomerId !== "ALL"
            ? data.filter((s: any) => s.companyId === currentCustomerId)
            : data;
          setSites(available);
          if (currentSiteId !== "ALL" && available.some((s: any) => s.id === currentSiteId)) {
            setSelectedSiteId(currentSiteId);
          } else if (available.length > 0) {
            setSelectedSiteId(available[0].id);
          }
        }
      })
      .catch(() => {});
  }, [currentCustomerId, currentSiteId]);

  useEffect(() => {
    if (!selectedSiteId) return;
    fetch(`/api/robots?siteId=${selectedSiteId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRobots(data);
          if (data.length > 0) setSelectedRobotId(data[0].id);
        }
      })
      .catch(() => {});
  }, [selectedSiteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiteId || !title.trim()) {
      setMessage({ type: "error", text: "Please enter an issue title and site." });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: selectedSiteId,
          robotId: selectedRobotId || null,
          title,
          description,
          severity,
          rootCauseCategory,
          immediateAction,
          fiveWhyAnalysis,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to log issue");
      }

      setMessage({ type: "success", text: "Issue ticket created and dispatched to DF Engineering Team!" });
      setTitle("");
      setDescription("");
      setImmediateAction("");
      setFiveWhyAnalysis("");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-4xl mx-auto">
      <div className="pb-4 border-b border-slate-100 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
            Log Robot Issue / Breakdown Ticket
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit persistent robot stoppage or hardware malfunction to the DF support team.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 p-3.5 rounded-lg text-xs flex items-center gap-2 border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Site & Robot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer Site *
            </label>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.company ? `${s.company.name} - ${s.name}` : s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Affected Robot / Equipment
            </label>
            <select
              value={selectedRobotId}
              onChange={(e) => setSelectedRobotId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Whole Site / Multiple Robots</option>
              {robots.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code} - {r.name || r.model} ({r.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Issue Title / Summary *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. AGV-03 recurring wheel slip at Stamping Press 3 joint"
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Severity & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Severity Level *
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="CRITICAL">Critical (Line Stoppage / Zero Operation)</option>
              <option value="MAJOR">Major (Reduced Throughput / Frequent Intervention)</option>
              <option value="MODERATE">Moderate (Intermittent Glitch / Self Recoverable)</option>
              <option value="MINOR">Minor (Cosmetic / Low Impact Warning)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fault Subsystem / Category
            </label>
            <select
              value={rootCauseCategory}
              onChange={(e) => setRootCauseCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="PANEL_TRANSFER">Panel Transfer Stuck / Height</option>
              <option value="WHEEL_SLIPPAGE">Wheel Slippage / Oily Floor</option>
              <option value="CASSETTE_STUCK">Cassette Stuck When Transfer</option>
              <option value="MACHINE_ISSUE">Machine / Facility Interlock</option>
              <option value="ROBOT_ARM">TM Robot Arm Failure</option>
              <option value="OBSTACLE_DETECT">LiDAR / Safety Obstacle Detect</option>
              <option value="GRIPPER_ISSUE">Gripper / End-Effector Issue</option>
              <option value="BARCODE_READ_FAIL">Barcode / QR Read Fail</option>
              <option value="DOCKING">Charging / Station Docking Fail</option>
              <option value="ELECTRICAL">Electrical / Battery / Wiring</option>
              <option value="SOFTWARE">NavWiz / Software / Firmware</option>
              <option value="OTHER">Other / Unknown</option>
            </select>
          </div>
        </div>

        {/* Detailed description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Problem Description & Symptoms
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what happened, error codes on display, and operating conditions..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Immediate Action Taken */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Immediate Action Taken on Site
          </label>
          <input
            type="text"
            value={immediateAction}
            onChange={(e) => setImmediateAction(e.target.value)}
            placeholder="e.g. Cleared route, performed manual E-Stop reset, moved robot back to home station"
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Optional 5-Why analysis */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Preliminary Root-Cause Notes (5-Why)
          </label>
          <textarea
            rows={2}
            value={fiveWhyAnalysis}
            onChange={(e) => setFiveWhyAnalysis(e.target.value)}
            placeholder="1. Why did it stop? 2. Why did it fail to dock? (Optional engineer/tech notes)"
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-6 py-2.5 rounded-lg shadow transition disabled:opacity-50 flex items-center gap-1.5"
          >
            {submitting ? "Submitting..." : "Submit Issue Ticket"}
          </button>
        </div>
      </form>
    </div>
  );
}
