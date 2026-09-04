"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { QrCode, CheckCircle2, AlertCircle, Clock, MapPin, Tag } from "lucide-react";

interface LogShortStopFormProps {
  initialSiteId?: string;
  onSuccess?: () => void;
}

const DEFAULT_CATEGORIES = [
  "Panel Transfer Stuck",
  "Wheel Slippage",
  "Cassette Stuck When Transfer",
  "Machine Issue",
  "TM (Robot Arm)",
  "Obstacle Detect",
  "Gripper Issue",
  "Barcode Read Fail",
  "Docking",
  "Panel Transfer Height Issue",
];

const DOWNTIME_CHIPS = [
  { label: "1 min", minutes: 1 },
  { label: "5 min", minutes: 5 },
  { label: "10 min", minutes: 10 },
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "1 hr", minutes: 60 },
  { label: "Others", minutes: null },
];

export default function LogShortStopForm({ initialSiteId, onSuccess }: LogShortStopFormProps) {
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>(initialSiteId || "");
  const [robots, setRobots] = useState<any[]>([]);
  const [selectedRobotId, setSelectedRobotId] = useState<string>("");
  const [zone, setZone] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [customCategory, setCustomCategory] = useState<string>("");
  const [categoryList, setCategoryList] = useState<string[]>(DEFAULT_CATEGORIES);

  // Date and times
  const today = format(new Date(), "yyyy-MM-dd");
  const currentTime = format(new Date(), "HH:mm");

  const [date, setDate] = useState<string>(today);
  const [startTime, setStartTime] = useState<string>(currentTime);
  const [durationMinutes, setDurationMinutes] = useState<number>(1);
  const [recoveredTime, setRecoveredTime] = useState<string>("");
  const [specificLocation, setSpecificLocation] = useState<string>("");
  const [resolvedBy, setResolvedBy] = useState<string>("Operator Reset");
  const [recoveryAction, setRecoveryAction] = useState<string>("Operator Reset");
  const [notes, setNotes] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  // Fetch sites accessible to this user
  useEffect(() => {
    fetch("/api/sites")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSites(data);
          if (!selectedSiteId && data.length > 0) {
            setSelectedSiteId(data[0].id);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Fetch robots when selected site changes
  useEffect(() => {
    if (!selectedSiteId) return;
    fetch(`/api/robots?siteId=${selectedSiteId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRobots(data);
          if (data.length > 0) {
            setSelectedRobotId(data[0].id);
            setZone(data[0].lineZone || "");
          } else {
            setSelectedRobotId("");
            setZone("");
          }
        }
      })
      .catch(() => {});
  }, [selectedSiteId]);

  // When robot changes, auto-fill default zone
  const handleRobotChange = (robotId: string) => {
    setSelectedRobotId(robotId);
    const r = robots.find((item) => item.id === robotId);
    if (r?.lineZone) setZone(r.lineZone);
  };

  // Recalculate recovered time when start time or duration changes
  useEffect(() => {
    if (!startTime) return;
    try {
      const [hours, minutes] = startTime.split(":").map(Number);
      const totalMinutes = hours * 60 + minutes + (durationMinutes || 0);
      const newHours = Math.floor(totalMinutes / 60) % 24;
      const newMinutes = totalMinutes % 60;
      setRecoveredTime(
        `${newHours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}`
      );
    } catch {
      // ignore
    }
  }, [startTime, durationMinutes]);

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setCustomCategory(cat);
  };

  const handleCategoryInputChange = (val: string) => {
    setCustomCategory(val);
    setSelectedCategory(val);
  };

  const handleSelectDowntime = (minutes: number | null) => {
    if (minutes !== null) {
      setDurationMinutes(minutes);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiteId || !selectedRobotId) {
      setMessage({ type: "error", text: "Please select an AGV / Equipment." });
      return;
    }

    const finalCategory = customCategory.trim() || selectedCategory;
    if (!finalCategory) {
      setMessage({ type: "error", text: "Please select or type an issue category." });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      // Construct full start datetime
      const startDateTime = new Date(`${date}T${startTime}:00`);
      const recoveryDateTime = new Date(`${date}T${recoveredTime}:00`);

      const res = await fetch("/api/short-stops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: selectedSiteId,
          robotId: selectedRobotId,
          category: finalCategory,
          zone,
          specificLocation,
          startTime: startDateTime.toISOString(),
          recoveryTime: recoveryDateTime.toISOString(),
          durationMinutes,
          resolvedBy,
          recoveryAction,
          notes,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to submit log");
      }

      setMessage({ type: "success", text: "Short Stop successfully logged to local database!" });
      
      // Auto-add new category to list if not present
      if (!categoryList.includes(finalCategory)) {
        setCategoryList((prev) => [finalCategory, ...prev]);
      }

      // Reset fields
      setSpecificLocation("");
      setNotes("");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Log Short Stop</h1>
          <p className="text-xs text-slate-500 mt-0.5">Fields marked * are required</p>
        </div>
        <button
          type="button"
          onClick={() => setShowQrModal(true)}
          className="flex items-center space-x-1.5 bg-lime-400 hover:bg-lime-500 text-slate-900 font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm transition"
        >
          <QrCode className="w-4 h-4" />
          <span>Scan QR</span>
        </button>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Site Selection (if multiple sites available) */}
        {sites.length > 1 && (
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
                  {s.company ? `${s.company.name} - ${s.name}` : s.name} ({s.location})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Equipment / AGV & Zone Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Equipment / AGV *
            </label>
            <select
              value={selectedRobotId}
              onChange={(e) => handleRobotChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Select...</option>
              {robots.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code} - {r.name || r.model} ({r.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Zone
            </label>
            <input
              type="text"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              placeholder="e.g. Zone A - Stamping & Subassembly"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Category * (Quick Chips & Autosuggest matching screenshot!) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Category *
          </label>
          {/* 10 Quick Chips */}
          <div className="flex flex-wrap gap-2 mb-2.5">
            {categoryList.map((cat) => {
              const active = (customCategory || selectedCategory) === cat;
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => handleSelectCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition font-medium ${
                    active
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Autosuggest text box */}
          <input
            type="text"
            value={customCategory}
            onChange={(e) => handleCategoryInputChange(e.target.value)}
            placeholder="Tap a button above or type here (autosuggest)..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Start typing for suggestions - new categories are auto-saved to prevent duplicates.
          </p>
        </div>

        {/* Date, Start Time, Recovered Time Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Recovered
            </label>
            <input
              type="time"
              value={recoveredTime}
              onChange={(e) => setRecoveredTime(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Downtime Duration Chips (matching screenshot!) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Downtime
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {DOWNTIME_CHIPS.map((chip) => {
              const active = durationMinutes === chip.minutes;
              return (
                <button
                  type="button"
                  key={chip.label}
                  onClick={() => handleSelectDowntime(chip.minutes)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition font-medium ${
                    active
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseFloat(e.target.value) || 0)}
              placeholder="Tap a chip above, or type minutes here"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <span className="text-xs text-slate-500 shrink-0 font-medium">Minutes</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Recovered time auto-fills based on Start time + duration.
          </p>
        </div>

        {/* Specific Location (matching screenshot!) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Specific Location
          </label>
          <input
            type="text"
            value={specificLocation}
            onChange={(e) => setSpecificLocation(e.target.value)}
            placeholder="e.g. PIT DOCK CONSTRUCTION BHR APG BR-02"
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Recovery Action & Resolution Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Recovery Action Taken
            </label>
            <select
              value={recoveryAction}
              onChange={(e) => setRecoveryAction(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="Auto Resume">Auto Resume</option>
              <option value="Operator Reset">Operator Reset (On-board button)</option>
              <option value="E-Stop Release">E-Stop Release & Reset</option>
              <option value="Manual Teach Pendant">Manual Teach Pendant Relocation</option>
              <option value="Controller Reboot">IPC / Controller Reboot</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Logged / Resolved By
            </label>
            <input
              type="text"
              value={resolvedBy}
              onChange={(e) => setResolvedBy(e.target.value)}
              placeholder="Operator / Shift Lead name"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-6 py-2.5 rounded-lg shadow transition disabled:opacity-50 flex items-center gap-1.5"
          >
            {submitting ? "Logging Stop..." : "Save Short Stop Log"}
          </button>
        </div>
      </form>

      {/* QR Code Scanner Dialog (Simulation) */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 text-center">
            <QrCode className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">Scan Robot QR Code</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Point camera at the QR code plate mounted on the AGV/ARV chassis.
            </p>
            <div className="space-y-1.5 mb-4">
              {robots.slice(0, 4).map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    handleRobotChange(r.id);
                    setShowQrModal(false);
                  }}
                  className="w-full py-1.5 px-3 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-xs font-medium text-slate-700 transition"
                >
                  Simulate Scan: [{r.code}] {r.name || r.model}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowQrModal(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
