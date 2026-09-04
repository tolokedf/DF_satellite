"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Bot, Key, AlertCircle, ArrowRight, Sparkles } from "lucide-react";

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

      if (data.user.role === "CUSTOMER") {
        router.push("/portal/log-stop");
      } else {
        router.push("/portfolio");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ googleAuth: true }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Google Auth failed");

      router.push("/portfolio");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoUser: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: demoUser }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Demo login failed");

      if (data.user.role === "CUSTOMER") {
        router.push("/portal/log-stop");
      } else {
        router.push("/portfolio");
      }
      router.refresh();
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
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-black text-xl flex items-center justify-center mx-auto shadow-md mb-3">
            DF
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">DF Satellite</h1>
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

        {/* Option 1: Google Account for Engineers & Internal Staff */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full mb-5 py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2.5 shadow-sm transition disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Sign in with Google (Field Engineers)</span>
        </button>

        <div className="relative mb-5 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <span className="relative px-3 bg-white text-[11px] uppercase font-bold text-slate-400">
            or Customer / Intern Login
          </span>
        </div>

        {/* Option 2: Username & Password */}
        <form onSubmit={handleLogin} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              User ID / Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. proton, perodua, intern, or admin"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-lg shadow transition disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2"
          >
            <span>Sign In to Satellite</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Quick Demo Logins */}
        <div className="mt-8 pt-5 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Quick Demo 1-Click Access
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => handleQuickDemo("proton")}
              className="p-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold hover:bg-emerald-100 transition text-left"
            >
              Proton (Customer)
              <div className="text-[10px] text-emerald-600 font-normal">Johor 10 AGVs & Penang 3 ARVs</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("perodua")}
              className="p-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold hover:bg-emerald-100 transition text-left"
            >
              Perodua (Customer)
              <div className="text-[10px] text-emerald-600 font-normal">Rawang 4 AMRs</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("engineer")}
              className="p-2 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-semibold hover:bg-blue-100 transition text-left"
            >
              Engineer (Field Lead)
              <div className="text-[10px] text-blue-600 font-normal">Asana Portfolio & All Sites</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("admin")}
              className="p-2 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 font-semibold hover:bg-purple-100 transition text-left"
            >
              Admin Console
              <div className="text-[10px] text-purple-600 font-normal">Manage IDs, RBAC & Sites</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
