"use client";

import React, { useState } from "react";
import { Download, RefreshCw, Clock, Plus, CheckCircle2 } from "lucide-react";
import { useSite } from "@/context/SiteContext";

export default function SettingsView() {
  const { currentSiteName } = useSite();

  const [sheetUrl, setSheetUrl] = useState("");
  const [refreshingSheet, setRefreshingSheet] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  const [uploadLabel, setUploadLabel] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  // Sample upload history matching screenshot
  const [uploadHistory, setUploadHistory] = useState([
    {
      id: "u1",
      label: "e2e test",
      timestamp: "2026-04-14 09:17",
      uploadedCount: 2,
      rolledBackCount: 2,
    },
  ]);

  // Shifts state
  const [shifts, setShifts] = useState([
    { id: "1", name: "Day Shift", startTime: "07:00", endTime: "19:00" },
    { id: "2", name: "Night Shift", startTime: "19:00", endTime: "07:00" },
  ]);

  const handleRefreshSheet = () => {
    setRefreshingSheet(true);
    setRefreshMessage(null);
    setTimeout(() => {
      setRefreshingSheet(false);
      setRefreshMessage("Google Sheet data successfully synced with local SQLite database.");
    }, 1200);
  };

  const handleCommitUpload = () => {
    if (!uploadFile && !uploadLabel) return;
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setUploadMessage("JSON sync file committed. Short stops updated.");
      setUploadHistory([
        {
          id: Date.now().toString(),
          label: uploadLabel || "DFleet Sync Export",
          timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
          uploadedCount: 8,
          rolledBackCount: 0,
        },
        ...uploadHistory,
      ]);
      setUploadLabel("");
      setUploadFile(null);
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Title & Subtitle matching Pasted image (6).png */}
      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Clean up categories - merge typos and variations into a single canonical name
        </p>
      </div>

      {/* Card 1: Refresh from Google Sheet */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
        <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
          <Download className="w-4 h-4 text-slate-700" />
          <span>Refresh from Google Sheet</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Pull the latest Short Stop Log from the shared Google Sheet. Existing manual rows are wiped
          and replaced in one shot - DFleet auto-synced rows are kept.
        </p>

        {refreshMessage && (
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{refreshMessage}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Sheet URL (leave blank for default)
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none"
            />
            <button
              type="button"
              onClick={handleRefreshSheet}
              disabled={refreshingSheet}
              className="w-full sm:w-auto bg-[#c8e84a] hover:bg-[#b8da38] text-slate-900 font-bold text-xs py-2 px-5 rounded-lg shadow-sm transition whitespace-nowrap disabled:opacity-50 shrink-0"
            >
              {refreshingSheet ? "Refreshing..." : "Refresh now"}
            </button>
          </div>
        </div>
      </div>

      {/* Card 2: Upload from DFleet Operation Dashboard */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
          <RefreshCw className="w-4 h-4 text-slate-700" />
          <span>Upload from DFleet Operation Dashboard</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Upload a JSON export from the local sync agent, preview it, then commit. Each upload can be
          rolled back later.
        </p>

        {uploadMessage && (
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{uploadMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              JSON file from sync agent
            </label>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-600 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border file:border-slate-300 file:text-xs file:font-medium file:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Label (optional)
            </label>
            <input
              type="text"
              value={uploadLabel}
              onChange={(e) => setUploadLabel(e.target.value)}
              placeholder={`e.g. ${currentSiteName || "Site A"} - 2026-04-14`}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            className="bg-[#c8e84a] hover:bg-[#b8da38] text-slate-900 font-bold text-xs py-1.5 px-4 rounded-lg shadow-sm transition"
          >
            Preview
          </button>
          <button
            type="button"
            onClick={handleCommitUpload}
            disabled={uploading}
            className="bg-[#c8e84a] hover:bg-[#b8da38] text-slate-900 font-bold text-xs py-1.5 px-4 rounded-lg shadow-sm transition disabled:opacity-50"
          >
            Commit upload
          </button>
          <button
            type="button"
            onClick={() => {
              setUploadFile(null);
              setUploadLabel("");
            }}
            className="bg-white hover:bg-slate-50 text-slate-700 font-medium border border-slate-300 text-xs py-1.5 px-4 rounded-lg transition"
          >
            Cancel
          </button>
        </div>

        {/* Upload History List */}
        <div className="pt-3 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-700 mb-2">Upload history</div>
          <div className="space-y-2">
            {uploadHistory.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-slate-800">{item.label}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    {item.timestamp} · {item.uploadedCount} uploaded ·{" "}
                    <span className="text-rose-600 font-medium">
                      rolled back {item.rolledBackCount}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card 3: Shift Schedule */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
              <Clock className="w-4 h-4 text-slate-700" />
              <span>Shift Schedule</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Define production shifts, used by the Shift Handover page and analytics. Overnight shifts
              OK (e.g. 22:00-06:00)
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                setShifts([
                  ...shifts,
                  {
                    id: Date.now().toString(),
                    name: `Shift ${shifts.length + 1}`,
                    startTime: "08:00",
                    endTime: "16:00",
                  },
                ])
              }
              className="bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-300 text-xs py-1.5 px-3 rounded-lg transition"
            >
              + Add shift
            </button>
            <button
              type="button"
              className="bg-[#c8e84a] hover:bg-[#b8da38] text-slate-900 font-bold text-xs py-1.5 px-4 rounded-lg shadow-sm transition"
            >
              Save all
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {shifts.map((shift, idx) => (
            <div
              key={shift.id}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 items-center text-xs"
            >
              <input
                type="text"
                value={shift.name}
                onChange={(e) => {
                  const copy = [...shifts];
                  copy[idx].name = e.target.value;
                  setShifts(copy);
                }}
                className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800"
              />
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">From:</span>
                <input
                  type="time"
                  value={shift.startTime}
                  onChange={(e) => {
                    const copy = [...shifts];
                    copy[idx].startTime = e.target.value;
                    setShifts(copy);
                  }}
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 w-full"
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">To:</span>
                <input
                  type="time"
                  value={shift.endTime}
                  onChange={(e) => {
                    const copy = [...shifts];
                    copy[idx].endTime = e.target.value;
                    setShifts(copy);
                  }}
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 w-full"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
