"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Key, AlertCircle, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      window.location.href = "/feed";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <img
            src="/images/df-logo.png"
            alt="DF Automation and robotics"
            className="h-14 w-auto mx-auto mb-2 object-contain"
          />
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">DF satellite</h1>
          <p className="text-xs text-slate-500 mt-1">
            Robotics Field Deployment Management & Fleet Issue Tracker
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Username & Password Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              User ID / Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-lg shadow transition disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2"
          >
            <span>{loading ? "Signing in..." : "Sign In to Satellite"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Admin Credential Notice */}
        <div className="mt-8 pt-5 border-t border-slate-100 text-center">
          <div className="text-[11px] text-slate-500">
            System Administrator login: <code className="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">admin</code> / password: <code className="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">df</code>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Customer and Engineer accounts are provisioned via the Admin Console.
          </p>
        </div>
      </div>
    </div>
  );
}
