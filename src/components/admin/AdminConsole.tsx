"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  ShieldCheck, 
  Plus, 
  Bot, 
  Building2, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Key, 
  Mail, 
  Lock, 
  RefreshCw,
  FolderDown
} from "lucide-react";

export default function AdminConsole() {
  const [users, setUsers] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [robots, setRobots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"users" | "sites" | "fleet" | "portability">("users");

  // New User form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("CUSTOMER");
  const [companyId, setCompanyId] = useState("");
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [googleLinked, setGoogleLinked] = useState(false);

  // New Site form state
  const [siteName, setSiteName] = useState("");
  const [siteCode, setSiteCode] = useState("");
  const [siteLocation, setSiteLocation] = useState("");
  const [siteCompanyId, setSiteCompanyId] = useState("");
  const [isNewCompany, setIsNewCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");

  // New Robot form state
  const [robotCode, setRobotCode] = useState("");
  const [robotName, setRobotName] = useState("");
  const [robotModel, setRobotModel] = useState("Titan");
  const [robotType, setRobotType] = useState("AGV");
  const [robotSiteId, setRobotSiteId] = useState("");
  const [robotZone, setRobotZone] = useState("");

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, sRes, rRes] = await Promise.all([
        fetch("/api/admin/users").then((r) => r.json()),
        fetch("/api/sites").then((r) => r.json()),
        fetch("/api/robots").then((r) => r.json()),
      ]);

      if (Array.isArray(uRes)) setUsers(uRes);
      if (Array.isArray(sRes)) {
        setSites(sRes);
        const compMap: Record<string, any> = {};
        sRes.forEach((s) => {
          if (s.company && !compMap[s.company.id]) compMap[s.company.id] = s.company;
        });
        const compList = Object.values(compMap);
        setCompanies(compList);
        if (compList.length > 0 && !companyId) setCompanyId(compList[0].id);
        if (compList.length > 0 && !siteCompanyId) setSiteCompanyId(compList[0].id);
        if (sRes.length > 0 && !robotSiteId) setRobotSiteId(sRes[0].id);
      }
      if (Array.isArray(rRes)) setRobots(rRes);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleSite = (siteId: string) => {
    setSelectedSiteIds((prev) =>
      prev.includes(siteId) ? prev.filter((id) => id !== siteId) : [...prev, siteId]
    );
  };

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName) {
      setMessage({ type: "error", text: "Site name is required." });
      return;
    }

    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: siteName,
          code: siteCode || undefined,
          companyId: isNewCompany ? undefined : siteCompanyId,
          newCompanyName: isNewCompany ? newCompanyName : undefined,
          location: siteLocation || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create site");

      setMessage({
        type: "success",
        text: `Customer site '${data.name}' (${data.company?.name || ""}) added successfully!`,
      });

      setSiteName("");
      setSiteCode("");
      setSiteLocation("");
      setNewCompanyName("");
      setIsNewCompany(false);
      fetchData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleDeleteSite = async (siteId: string, sName: string) => {
    if (!confirm(`Are you sure you want to delete site '${sName}'? All associated robots and stop logs will be affected.`)) return;

    try {
      const res = await fetch(`/api/sites?id=${siteId}`, { method: "DELETE" });
      if (res.ok) {
        setMessage({ type: "success", text: `Site '${sName}' deleted.` });
        fetchData();
      } else {
        const d = await res.json();
        throw new Error(d.error || "Failed to delete site");
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setMessage({ type: "error", text: "Username and password are required." });
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          name: name || username,
          email: email || null,
          role,
          companyId: role === "CUSTOMER" ? companyId : null,
          assignedSiteIds: selectedSiteIds,
          googleLinked,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");

      setMessage({
        type: "success",
        text: `User account '${username}' created successfully with ${role} permissions!`,
      });

      setUsername("");
      setPassword("");
      setName("");
      setEmail("");
      setSelectedSiteIds([]);
      fetchData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleDeleteUser = async (userId: string, uname: string) => {
    if (!confirm(`Are you sure you want to delete user '${uname}'?`)) return;

    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: "DELETE" });
      if (res.ok) {
        setMessage({ type: "success", text: `User '${uname}' deleted.` });
        fetchData();
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleCreateRobot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!robotCode || !robotSiteId) return;

    try {
      const res = await fetch("/api/robots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: robotSiteId,
          code: robotCode,
          name: robotName,
          model: robotModel,
          type: robotType,
          lineZone: robotZone,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: `Robot '${robotCode}' added to fleet!` });
        setRobotCode("");
        setRobotName("");
        fetchData();
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Admin Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
              Super Admin Console
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Access Control & Fleet Management
          </h1>
          <p className="text-xs text-slate-500">
            Control who can see what data: provision customer credentials, intern accounts, and assign site access.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-lg text-xs flex items-center gap-2 border ${
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

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4 text-xs font-bold overflow-x-auto pb-1 sm:pb-0 scrollbar-none whitespace-nowrap">
        <button
          onClick={() => setActiveSubTab("users")}
          className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 ${
            activeSubTab === "users"
              ? "border-purple-600 text-purple-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Accounts & RBAC ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("sites")}
          className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 ${
            activeSubTab === "sites"
              ? "border-purple-600 text-purple-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Customer Sites ({sites.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("fleet")}
          className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 ${
            activeSubTab === "fleet"
              ? "border-purple-600 text-purple-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Robot Fleet Registry ({robots.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("portability")}
          className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 ${
            activeSubTab === "portability"
              ? "border-purple-600 text-purple-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Database Portability & Migration</span>
        </button>
      </div>

      {/* Tab 1: User Management */}
      {activeSubTab === "users" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create User Form */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm lg:col-span-1 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-purple-600" />
                Add User / Customer / Intern
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Example: ID: <code>customer1</code>, Password: <code>customer123</code>
              </p>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  User ID / Login Username *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. customer1 or engineer1"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="e.g. password123"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Full Name / Display Label
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Lead Engineer / Plant Manager"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Role *</label>
                  <select
                    value={role}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      setRole(newRole);
                      if (newRole === "ENGINEER") {
                        setSelectedSiteIds([]);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white focus:outline-none font-medium"
                  >
                    <option value="CUSTOMER">Customer</option>
                    <option value="ENGINEER">Engineer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Company</label>
                  <select
                    value={companyId}
                    onChange={(e) => {
                      const newCompId = e.target.value;
                      setCompanyId(newCompId);
                      setSelectedSiteIds((prev) => {
                        const validIds = sites
                          .filter((s) => s.companyId === newCompId || s.company?.id === newCompId)
                          .map((s) => s.id);
                        return prev.filter((id) => validIds.includes(id));
                      });
                    }}
                    disabled={role !== "CUSTOMER"}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white focus:outline-none disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {role === "ENGINEER" && (
                    <p className="text-[10px] text-blue-600 font-medium mt-0.5">DF Internal</p>
                  )}
                </div>
              </div>

              {/* Site Access Checkboxes */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Authorized Sites (Scope Constraint)
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab("sites")}
                    className="text-[10px] font-bold text-purple-600 hover:text-purple-800 underline"
                  >
                    + Add New Site
                  </button>
                </div>

                <div
                  className={`space-y-1.5 max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2 transition ${
                    role === "ENGINEER"
                      ? "bg-slate-100 opacity-40 pointer-events-none select-none cursor-not-allowed border-slate-300"
                      : "bg-slate-50"
                  }`}
                >
                  {role === "ENGINEER" ? (
                    sites.map((s) => (
                      <label
                        key={s.id}
                        className="flex items-center space-x-2 text-xs text-slate-400 cursor-not-allowed"
                      >
                        <input
                          type="checkbox"
                          checked={true}
                          disabled={true}
                          className="rounded text-purple-600 focus:ring-purple-500 disabled:text-slate-400"
                        />
                        <span className="truncate">
                          {s.company?.name} - {s.name}
                        </span>
                      </label>
                    ))
                  ) : (
                    (() => {
                      const companySites = sites.filter(
                        (s) => s.companyId === companyId || s.company?.id === companyId
                      );
                      if (companySites.length === 0) {
                        return (
                          <div className="text-center py-3 text-xs text-slate-400 italic">
                            No sites registered for this company. Please create a site in the &quot;Customer Sites&quot; tab first.
                          </div>
                        );
                      }
                      return companySites.map((s) => {
                        const checked = selectedSiteIds.includes(s.id);
                        return (
                          <label
                            key={s.id}
                            className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggleSite(s.id)}
                              className="rounded text-purple-600 focus:ring-purple-500"
                            />
                            <span className="truncate font-medium">
                              {s.name} {s.code ? `(${s.code})` : ""}
                            </span>
                          </label>
                        );
                      });
                    })()
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {role === "ENGINEER"
                    ? "Engineers have global access to all customer sites automatically."
                    : "Only sites registered under the selected company are available for selection."}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs py-2 rounded-lg shadow transition"
                >
                  Create User Account
                </button>
              </div>
            </form>
          </div>

          {/* User List Table */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm lg:col-span-2 space-y-3">
            <h2 className="text-sm font-bold text-slate-800">Existing Users & Site Scoping</h2>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse min-w-[620px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3">Username</th>
                    <th className="py-2.5 px-3">Display Name</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Company</th>
                    <th className="py-2.5 px-3">Authorized Sites</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.map((u) => {
                    const siteNames = sites
                      .filter((s) => (u.assignedSiteIds || []).includes(s.id))
                      .map((s) => s.name);

                    return (
                      <tr key={u.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 font-bold text-slate-800">
                          <code>{u.username}</code>
                        </td>
                        <td className="py-2.5 px-3">{u.name}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              u.role === "ADMIN"
                                ? "bg-purple-100 text-purple-800"
                                : u.role === "ENGINEER"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{u.companyName || "Internal DF"}</td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {u.role === "ADMIN" || u.role === "ENGINEER" ? (
                            <span className="text-blue-600 font-medium">All Sites (Unrestricted)</span>
                          ) : siteNames.length > 0 ? (
                            <span>{siteNames.join(", ")}</span>
                          ) : (
                            <span className="text-slate-400">None assigned</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {u.username !== "admin" && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              className="text-slate-400 hover:text-rose-600 transition"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Site Management (Provisioning New Sites) */}
      {activeSubTab === "sites" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Site Form */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm lg:col-span-1 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-purple-600" />
                Add New Customer Site
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Provision a new plant, warehouse, or facility for a customer.
              </p>
            </div>

            <form onSubmit={handleCreateSite} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Site / Facility Name *
                </label>
                <input
                  type="text"
                  required
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="e.g. Tanjung Malim Plant, Rawang DC"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Site Code (Optional)
                </label>
                <input
                  type="text"
                  value={siteCode}
                  onChange={(e) => setSiteCode(e.target.value.toUpperCase())}
                  placeholder="e.g. TJ_MALIM, RAWANG_DC"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:bg-white focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Leave empty to auto-generate from site name.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Company / Organization *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsNewCompany(!isNewCompany)}
                    className="text-[10px] font-bold text-purple-600 hover:text-purple-800 underline"
                  >
                    {isNewCompany ? "Choose Existing" : "+ New Company"}
                  </button>
                </div>

                {isNewCompany ? (
                  <input
                    type="text"
                    required
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder="Enter company name (e.g. Daikin, Inari)"
                    className="w-full bg-slate-50 border border-purple-300 rounded-lg px-3 py-1.5 text-xs focus:bg-white focus:outline-none"
                  />
                ) : (
                  <select
                    value={siteCompanyId}
                    onChange={(e) => setSiteCompanyId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white focus:outline-none font-medium"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Location / State (Optional)
                </label>
                <input
                  type="text"
                  value={siteLocation}
                  onChange={(e) => setSiteLocation(e.target.value)}
                  placeholder="e.g. Perak, Malaysia"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs py-2 rounded-lg shadow transition"
                >
                  Create Customer Site
                </button>
              </div>
            </form>
          </div>

          {/* Sites List Table */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">Existing Customer Sites ({sites.length})</h2>
              <span className="text-[11px] text-slate-500">Available across all modules & fleet filters</span>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse min-w-[620px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3">Company</th>
                    <th className="py-2.5 px-3">Site Name</th>
                    <th className="py-2.5 px-3">Site Code</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3 text-center">Fleet</th>
                    <th className="py-2.5 px-3 text-center">Stops Logged</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sites.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {s.company?.name || "Internal"}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{s.name}</td>
                      <td className="py-2.5 px-3">
                        <code className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold">
                          {s.code}
                        </code>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{s.location || "-"}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded text-[11px]">
                          {s.robots?.length ?? s._count?.robots ?? 0}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600 font-medium">
                        {s._count?.shortStops ?? 0}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleDeleteSite(s.id, s.name)}
                          className="text-slate-400 hover:text-rose-600 transition"
                          title="Delete site"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Fleet Management */}
      {activeSubTab === "fleet" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm lg:col-span-1 space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-purple-600" />
              Register Robot to Site
            </h2>

            <form onSubmit={handleCreateRobot} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Site *</label>
                <select
                  value={robotSiteId}
                  onChange={(e) => setRobotSiteId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white focus:outline-none"
                >
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.company?.name} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Robot Code *</label>
                  <input
                    type="text"
                    required
                    value={robotCode}
                    onChange={(e) => setRobotCode(e.target.value.toUpperCase())}
                    placeholder="AGV-11"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Type *</label>
                  <select
                    value={robotType}
                    onChange={(e) => setRobotType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white focus:outline-none"
                  >
                    <option value="AGV">AGV</option>
                    <option value="AMR">AMR</option>
                    <option value="ARV">ARV</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Model</label>
                <input
                  type="text"
                  value={robotModel}
                  onChange={(e) => setRobotModel(e.target.value)}
                  placeholder="Titan T-500"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Zone / Area</label>
                <input
                  type="text"
                  value={robotZone}
                  onChange={(e) => setRobotZone(e.target.value)}
                  placeholder="Zone A - Stamping"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 rounded-lg shadow transition"
                >
                  Add Robot
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm lg:col-span-2 space-y-3">
            <h2 className="text-sm font-bold text-slate-800">Fleet Inventory Across Sites</h2>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse min-w-[620px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3">Robot Code</th>
                    <th className="py-2.5 px-3">Type & Model</th>
                    <th className="py-2.5 px-3">Customer Site</th>
                    <th className="py-2.5 px-3">Zone</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {robots.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition">
                      <td className="py-2 px-3 font-bold text-slate-900">{r.code}</td>
                      <td className="py-2 px-3">
                        <span className="font-semibold text-slate-800">{r.type}</span>
                        <span className="text-slate-400 text-[11px] ml-1">({r.model})</span>
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {r.site?.company?.name} - {r.site?.name}
                      </td>
                      <td className="py-2 px-3 text-slate-600">{r.lineZone || "-"}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            r.status === "RUNNING"
                              ? "bg-emerald-100 text-emerald-800"
                              : r.status === "SHORT_STOP"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Portability & Separation */}
      {activeSubTab === "portability" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-600" />
              Program & Database Separation Architecture
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Your runtime database is completely decoupled from the application code, residing inside{" "}
              <code>Database/data/satellite.db</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
                <FolderDown className="w-4 h-4 text-blue-600" />
                1-Click Export Script (Linux & Windows)
              </h3>
              <p className="text-slate-600">
                To back up and migrate this entire platform to a customer server, laptop, or USB drive, run:
              </p>
              <div className="bg-slate-900 text-emerald-400 p-2.5 rounded font-mono text-[11px]">
                ./export.sh
              </div>
              <p className="text-slate-500 text-[11px]">
                This packages all operational records, short stop logs, and user credentials into a single
                timestamped <code>DF_Satellite_DB_YYYYMMDD_HHMMSS.zip</code> archive with SHA-256 validation.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-emerald-600" />
                1-Click Import / Restore Script
              </h3>
              <p className="text-slate-600">
                On the target PC or production server, restore your database instantly:
              </p>
              <div className="bg-slate-900 text-emerald-400 p-2.5 rounded font-mono text-[11px]">
                ./import.sh Database/backups/DF_Satellite_DB_*.zip
              </div>
              <p className="text-slate-500 text-[11px]">
                Safely backs up the pre-existing database before applying the restoration archive.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
