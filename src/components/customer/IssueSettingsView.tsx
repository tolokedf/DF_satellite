"use client";

import React, { useState } from "react";
import { Settings, ShieldAlert, Clock, Mail, CheckCircle2 } from "lucide-react";
import { useSite } from "@/context/SiteContext";

export default function IssueSettingsView() {
  const { currentSiteName } = useSite();
  const [criticalSla, setCriticalSla] = useState("4");
  const [majorSla, setMajorSla] = useState("12");
  const [moderateSla, setModerateSla] = useState("24");
  const [escalationEmail, setEscalationEmail] = useState("");
  const [autoCountermeasureRequire, setAutoCountermeasureRequire] = useState(true);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2500);
  };

  return (
    <div className="space-y-6 select-none max-w-4xl">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-rose-600" />
          <span>Issue Tracker Settings</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure SLA response targets, escalation routing, and root cause investigation rules for {currentSiteName}.
        </p>
      </div>

      {savedMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Issue Tracker preferences saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* SLA Targets */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Clock className="w-4 h-4 text-rose-600" />
            <span>Resolution SLA Target Times (Hours)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-rose-700 mb-1">Critical Severity</label>
              <input
                type="number"
                value={criticalSla}
                onChange={(e) => setCriticalSla(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">Target response / containment</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-700 mb-1">Major Severity</label>
              <input
                type="number"
                value={majorSla}
                onChange={(e) => setMajorSla(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">Target response</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-700 mb-1">Moderate Severity</label>
              <input
                type="number"
                value={moderateSla}
                onChange={(e) => setModerateSla(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">Target response</span>
            </div>
          </div>
        </div>

        {/* Escalation & Notifications */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Mail className="w-4 h-4 text-rose-600" />
            <span>Escalation & Notification Routing</span>
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Engineering Alert Recipient Email</label>
            <input
              type="email"
              value={escalationEmail}
              onChange={(e) => setEscalationEmail(e.target.value)}
              placeholder="e.g. support@company.com"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none max-w-md"
            />
            <p className="text-[10px] text-slate-400 mt-1">Dispatches alerts immediately when Critical or Major breakdowns are reported.</p>
          </div>

          <div className="pt-2">
            <label className="flex items-center space-x-2 text-xs font-medium text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={autoCountermeasureRequire}
                onChange={(e) => setAutoCountermeasureRequire(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span>Require 5-Why Root Cause Analysis before marking an issue CLOSED</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm transition"
        >
          Save Issue Tracker Settings
        </button>
      </form>
    </div>
  );
}
