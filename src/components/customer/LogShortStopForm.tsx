"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { QrCode, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { useSite } from "@/context/SiteContext";

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

const ACTION_TAKEN_CHIPS = [
  "Not resolved",
  "Resolved",
  "Restarted AGV",
  "Cleared obstacle",
  "Reset / power cycle",
  "Pending engineering",
];

export default function LogShortStopForm() {
  const { currentSiteId, currentCustomerId, availableSites, filteredSitesForCustomer } = useSite();

  const [robots, setRobots] = useState<any[]>([]);
  const [selectedRobotId, setSelectedRobotId] = useState<string>("");
  const [targetSiteId, setTargetSiteId] = useState<string>("");
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

  // Additional fields from reference images
  const [problemSummary, setProblemSummary] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [actionTakenChip, setActionTakenChip] = useState<string>("Resolved");
  const [actionTakenText, setActionTakenText] = useState<string>("Resolved");
  const [reportedBy, setReportedBy] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  // Fetch robots based on current site and customer selection
  useEffect(() => {
    const params = new URLSearchParams();
    if (currentSiteId && currentSiteId !== "ALL") {
      params.append("siteId", currentSiteId);
    } else if (currentCustomerId && currentCustomerId !== "ALL") {
      params.append("companyId", currentCustomerId);
    }
    const siteQuery = params.toString() ? `?${params.toString()}` : "";
    fetch(`/api/robots${siteQuery}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRobots(data);
          if (data.length > 0) {
            setSelectedRobotId(data[0].id);
            setTargetSiteId(data[0].siteId);
            setZone(data[0].lineZone || "");
          } else {
            setSelectedRobotId("");
            setTargetSiteId(currentSiteId !== "ALL" ? currentSiteId : "");
            setZone("");
          }
        }
      })
      .catch(() => {});
  }, [currentSiteId, currentCustomerId]);

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

  const handleRobotChange = (robotId: string) => {
    setSelectedRobotId(robotId);
    const r = robots.find((item) => item.id === robotId);
    if (r) {
      if (r.lineZone) setZone(r.lineZone);
      if (r.siteId) setTargetSiteId(r.siteId);
    }
  };

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setCustomCategory(cat);
  };

  const handleSelectDowntime = (minutes: number | null) => {
    if (minutes !== null) {
      setDurationMinutes(minutes);
    }
  };

  const handleSelectActionChip = (chip: string) => {
    setActionTakenChip(chip);
    setActionTakenText(chip);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRobotId) {
      setMessage({ type: "error", text: "Please select an Equipment / AGV." });
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
      const startDateTime = new Date(`${date}T${startTime}:00`);
      let recoveryDateTime = new Date(startDateTime.getTime() + (durationMinutes || 1) * 60 * 1000);
      if (recoveredTime) {
        const potentialRecovery = new Date(`${date}T${recoveredTime}:00`);
        if (potentialRecovery.getTime() < startDateTime.getTime()) {
          // Crossed midnight into next day
          recoveryDateTime = new Date(potentialRecovery.getTime() + 24 * 60 * 60 * 1000);
        } else {
          recoveryDateTime = potentialRecovery;
        }
      }

      const currentRobot = robots.find((r) => r.id === selectedRobotId);
      const effectiveSiteId = currentRobot?.siteId || targetSiteId || (currentSiteId !== "ALL" ? currentSiteId : (filteredSitesForCustomer[0]?.id || availableSites[0]?.id));

      const res = await fetch("/api/short-stops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: effectiveSiteId,
          robotId: selectedRobotId,
          category: finalCategory,
          zone,
          specificLocation,
          problemSummary,
          description,
          actionTaken: actionTakenText,
          resolvedBy: reportedBy,
          notes,
          startTime: startDateTime.toISOString(),
          recoveryTime: recoveryDateTime.toISOString(),
          durationMinutes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit short stop");
      }

      setMessage({ type: "success", text: "Short stop successfully logged!" });

      if (!categoryList.includes(finalCategory)) {
        setCategoryList((prev) => [finalCategory, ...prev]);
      }

      // Reset specific fields
      setSpecificLocation("");
      setProblemSummary("");
      setDescription("");
      setNotes("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-4xl mx-auto">
      {/* Header matching Pasted image.png */}
      <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Log Short Stop</h1>
          <p className="text-xs text-slate-500 mt-0.5">Fields marked * are required</p>
        </div>
        <button
          type="button"
          onClick={() => setShowQrModal(true)}
          className="flex items-center space-x-1.5 bg-[#c8e84a] hover:bg-[#b8da38] text-slate-900 font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm transition"
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

      <form onSubmit={handleSubmit} className="space-y-5 text-xs text-slate-700">
        {/* Equipment / AGV * and Zone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-800 mb-1.5">
              Equipment / AGV *
            </label>
            <select
              value={selectedRobotId}
              onChange={(e) => handleRobotChange(e.target.value)}
              className="w-full bg-slate-50/70 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none transition"
            >
              <option value="">Select...</option>
              {robots.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code} {r.name ? `- ${r.name}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1.5">
              Zone
            </label>
            <input
              type="text"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              placeholder="Select..."
              className="w-full bg-slate-50/70 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none transition"
            />
          </div>
        </div>

        {/* Category * */}
        <div>
          <label className="block font-semibold text-slate-800 mb-1.5">
            Category *
          </label>
          <div className="flex flex-wrap gap-2 mb-2.5">
            {categoryList.map((cat) => {
              const active = (customCategory || selectedCategory) === cat;
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => handleSelectCategory(cat)}
                  className={`text-xs px-3.5 py-1.5 rounded-full border transition font-medium ${
                    active
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <input
            type="text"
            value={customCategory}
            onChange={(e) => {
              setCustomCategory(e.target.value);
              setSelectedCategory(e.target.value);
            }}
            placeholder="Tap a button above or type here (autosuggest)..."
            className="w-full bg-slate-50/70 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none transition"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Start typing for suggestions - new categories are auto-saved to prevent duplicates.
          </p>
        </div>

        {/* Date *, Start Time, Recovered */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold text-slate-800 mb-1.5">
              Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50/70 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1.5">
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-slate-50/70 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1.5">
              Recovered
            </label>
            <input
              type="time"
              value={recoveredTime}
              onChange={(e) => setRecoveredTime(e.target.value)}
              className="w-full bg-slate-50/70 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none transition"
            />
          </div>
        </div>

        {/* Downtime Chips */}
        <div>
          <label className="block font-semibold text-slate-800 mb-1.5">
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
                  className={`text-xs px-3.5 py-1.5 rounded-full border transition font-medium ${
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
              className="w-full bg-slate-50/70 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none transition"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Recovered time auto-fills based on Start time + duration.
          </p>
        </div>

        {/* Specific Location */}
        <div>
          <label className="block font-semibold text-slate-800 mb-1.5">
            Specific Location
          </label>
          <input
            type="text"
            value={specificLocation}
            onChange={(e) => setSpecificLocation(e.target.value)}
            placeholder="PIT DOCK CONSTRUCTION BHR APG BR-02"
            className="w-full bg-slate-50/70 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none transition"
          />
        </div>

        {/* Brief problem summary (Pasted image.png reference) */}
        <div>
          <label className="block font-semibold text-slate-800 mb-1.5">
            Brief problem summary
          </label>
          <input
            type="text"
            value={problemSummary}
            onChange={(e) => setProblemSummary(e.target.value)}
            placeholder="Brief problem summary"
            className="w-full bg-slate-50/70 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none transition"
          />
        </div>

        {/* Description (Pasted image.png reference) */}
        <div>
          <label className="block font-semibold text-slate-800 mb-1.5">
            Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What happened? Root cause if known..."
            className="w-full bg-slate-50/70 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none transition"
          />
        </div>

        {/* Action Taken (optional - leave blank if you only reported) */}
        <div>
          <label className="block font-semibold text-slate-800 mb-1.5">
            Action Taken <span className="font-normal text-slate-400">(optional - leave blank if you only reported)</span>
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {ACTION_TAKEN_CHIPS.map((chip) => {
              const active = actionTakenChip === chip;
              return (
                <button
                  type="button"
                  key={chip}
                  onClick={() => handleSelectActionChip(chip)}
                  className={`text-xs px-3.5 py-1.5 rounded-full border transition font-medium ${
                    active
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>
          <textarea
            rows={2}
            value={actionTakenText}
            onChange={(e) => setActionTakenText(e.target.value)}
            className="w-full bg-slate-50/70 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none transition"
          />
        </div>

        {/* Reported By */}
        <div>
          <label className="block font-semibold text-slate-800 mb-1.5">
            Reported By
          </label>
          <input
            type="text"
            value={reportedBy}
            onChange={(e) => setReportedBy(e.target.value)}
            placeholder="e.g. Operator Name or Email"
            className="w-full bg-slate-50/70 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none transition"
          />
        </div>

        {/* Note */}
        <div>
          <label className="block font-semibold text-slate-800 mb-1.5">
            Note
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes"
            className="w-full bg-slate-50/70 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none transition"
          />
        </div>

        {/* Photo */}
        <div>
          <label className="block font-semibold text-slate-800 mb-1.5">
            Photo
          </label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files ? e.target.files[0] : null)}
              className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-slate-300 file:text-xs file:font-semibold file:bg-slate-100 hover:file:bg-slate-200 cursor-pointer"
            />
          </div>
        </div>

        {/* Submit Short Stop Full-Width Lime Green Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#c8e84a] hover:bg-[#b8da38] text-slate-900 font-bold text-sm py-3 px-4 rounded-xl shadow-sm transition disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Short Stop"}
          </button>
        </div>
      </form>

      {/* QR Code Scanner Simulation Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 text-center shadow-xl border border-slate-200">
            <QrCode className="w-12 h-12 text-slate-800 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900">Scan Robot QR Code</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Point camera at the QR code plate mounted on the AGV/ARV chassis.
            </p>
            <div className="space-y-1.5 mb-4 max-h-48 overflow-y-auto">
              {robots.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    handleRobotChange(r.id);
                    setShowQrModal(false);
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition border border-slate-200 text-left flex items-center justify-between"
                >
                  <span>{r.code}</span>
                  <span className="text-[10px] text-slate-400">{r.type}</span>
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
