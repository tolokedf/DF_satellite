"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { 
  Plus, 
  List, 
  Target, 
  BarChart2, 
  QrCode, 
  Settings, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckSquare,
  FolderKanban,
  X,
  Building2,
  Layers
} from "lucide-react";
import { useSite } from "@/context/SiteContext";

interface SidebarProps {
  user: any;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);

  // Site & Customer Filter State
  const {
    currentCustomerId,
    setCurrentCustomerId,
    currentSiteId,
    setCurrentSiteId,
    availableCompanies,
    filteredSitesForCustomer,
    currentCustomerName,
    currentSiteName,
    isCustomer,
  } = useSite();

  // Project Sidebar State
  const [projects, setProjects] = useState<any[]>([]);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectCode, setNewProjectCode] = useState("");
  const [newProjectSiteId, setNewProjectSiteId] = useState("");
  const [sites, setSites] = useState<any[]>([]);
  const [creatingProject, setCreatingProject] = useState(false);

  const isIssueListSection = !pathname.startsWith("/current-status") &&
                             !pathname.startsWith("/task-overview") &&
                             !pathname.startsWith("/project") &&
                             !pathname.startsWith("/portfolio") &&
                             !pathname.startsWith("/projects") &&
                             !pathname.startsWith("/admin") &&
                             !pathname.startsWith("/my-role");

  const isProjectSection = pathname.startsWith("/project") ||
                           pathname.startsWith("/portfolio") ||
                           pathname.startsWith("/projects") ||
                           pathname.startsWith("/my-role");

  // Fetch projects when in project section
  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setProjects(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isProjectSection) {
      fetchProjects();
      fetch("/api/sites")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setSites(data);
          }
        })
        .catch(() => {});
    }

    const handleUpdate = () => fetchProjects();
    window.addEventListener("projects-updated", handleUpdate);
    return () => window.removeEventListener("projects-updated", handleUpdate);
  }, [isProjectSection]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setCreatingProject(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjectName.trim(),
          code: newProjectCode.trim() || undefined,
          siteId: newProjectSiteId || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to create project");
      const created = await res.json();

      setNewProjectName("");
      setNewProjectCode("");
      setNewProjectSiteId("");
      setShowAddProjectModal(false);
      window.dispatchEvent(new Event("projects-updated"));
      router.push(`/project?id=${created.id}`);
    } catch (err: any) {
      alert(err.message || "Failed to create project");
    } finally {
      setCreatingProject(false);
    }
  };

  // If neither section, hide the sidebar
  if (!isIssueListSection && !isProjectSection) {
    return null;
  }

  // =========================================================================
  // 1. PROJECT LEFT SIDEBAR ("My Task" and "Work")
  // =========================================================================
  if (isProjectSection) {
    const viewMode = searchParams.get("view");
    const currentProjectId = searchParams.get("id");
    const isMyTaskActive = viewMode === "my-task";

    return (
      <>
        {/* Mobile Sub-Navigation Pill Bar for Project (< md) */}
        <div className="md:hidden w-full bg-white border-b border-slate-200 px-2.5 py-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap shadow-[0_1px_2px_rgba(0,0,0,0.03)] shrink-0 select-none">
          <Link
            href="/project?view=my-task"
            className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition ${
              isMyTaskActive
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <CheckSquare className="w-3 h-3" />
            <span>My Task</span>
          </Link>

          <button
            onClick={() => setShowAddProjectModal(true)}
            className="h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition"
          >
            <Plus className="w-3 h-3" />
            <span>Add Project</span>
          </button>

          {projects.map((proj) => {
            const isProjActive = !isMyTaskActive && currentProjectId === proj.id;
            return (
              <Link
                key={proj.id}
                href={`/project?id=${proj.id}`}
                className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition ${
                  isProjActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <FolderKanban className="w-3 h-3" />
                <span className="max-w-[120px] truncate">{proj.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Desktop Left Sidebar (md and up) */}
        <aside
          className={`hidden md:flex ${
            collapsed ? "w-16" : "w-52"
          } bg-white border-r border-slate-200 flex-col justify-between shrink-0 min-h-[calc(100vh-3.5rem)] select-none transition-all duration-200`}
        >
          <div className="p-3 space-y-6">
            {/* Section 1: My Task */}
            <div>
              {!collapsed && (
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  My Task
                </div>
              )}
              <div className="space-y-0.5">
                <Link
                  href="/project?view=my-task"
                  className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                    isMyTaskActive
                      ? "bg-slate-900 text-white font-semibold shadow-xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  title="My Task"
                >
                  <CheckSquare className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>My Task</span>}
                </Link>
              </div>
            </div>

            {/* Section 2: Work (Projects list + Add Project button) */}
            <div>
              <div className="flex items-center justify-between px-3 mb-1.5">
                {!collapsed ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Work
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400">WORK</span>
                )}

                <button
                  onClick={() => setShowAddProjectModal(true)}
                  className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition flex items-center gap-1 text-[11px] font-semibold"
                  title="Add Project"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {!collapsed && <span>Add Project</span>}
                </button>
              </div>

              <div className="space-y-0.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
                {projects.map((proj) => {
                  const isProjActive = !isMyTaskActive && currentProjectId === proj.id;
                  return (
                    <Link
                      key={proj.id}
                      href={`/project?id=${proj.id}`}
                      className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                        isProjActive
                          ? "bg-slate-100 text-slate-900 font-bold shadow-2xs border border-slate-200/80"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                      title={proj.name}
                    >
                      <FolderKanban className="w-4 h-4 shrink-0 text-blue-600" />
                      {!collapsed && (
                        <span className="truncate max-w-[130px]">{proj.name}</span>
                      )}
                    </Link>
                  );
                })}

                {projects.length === 0 && !collapsed && (
                  <div className="px-3 py-2 text-[11px] text-slate-400 italic">
                    No projects yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Collapse Toggle */}
          <div className="p-3 border-t border-slate-100">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition w-full py-1.5 px-2 rounded-lg hover:bg-slate-50"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4 mx-auto" />
              ) : (
                <>
                  <span className="text-slate-400 font-bold">&laquo;</span>
                  <span>Collapse</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Add Project Modal */}
        {showAddProjectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Add New Project</h3>
                </div>
                <button
                  onClick={() => setShowAddProjectModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Factory AGV Deployment"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Project Code (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PRJ-01 (auto-generated if blank)"
                    value={newProjectCode}
                    onChange={(e) => setNewProjectCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {sites.length > 0 && (
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Customer Site (optional)
                    </label>
                    <select
                      value={newProjectSiteId}
                      onChange={(e) => setNewProjectSiteId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">No site (Internal / General)</option>
                      {sites.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.company?.name ? `${s.company.name} - ${s.name}` : s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddProjectModal(false)}
                    className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingProject || !newProjectName.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition disabled:opacity-50"
                  >
                    {creatingProject ? "Creating..." : "Create Project"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  // =========================================================================
  // 2. ISSUE LIST SIDEBAR (Existing 2nd Level Navigation)
  // =========================================================================
  const isActive = (href: string) => {
    const currentMode = searchParams.get("mode");
    const isIssueMode = currentMode === "issues" || pathname.startsWith("/issues");

    // If this is an issue-tracker specific link
    if (href.includes("mode=issues") || href.startsWith("/issues") || href.startsWith("/portal/issues") || href === "/portal/log-issue") {
      if (href === "/portal/log-issue") return pathname === "/portal/log-issue";
      if (href === "/portal/issues" || href === "/issues") return (pathname === "/portal/issues" || pathname === "/issues") && !currentMode;
      if (href.includes("focus")) return isIssueMode && pathname.includes("focus");
      if (href.includes("analytics")) return isIssueMode && pathname.includes("analytics");
      if (href.includes("qr")) return isIssueMode && pathname.includes("qr");
      if (href.includes("settings")) return isIssueMode && pathname.includes("settings");
      return false;
    }

    // Short stops links should NOT match when in issue mode
    if (isIssueMode) {
      return false;
    }

    if (href === "/form" || href === "/portal/log-stop") {
      return pathname === "/form" || pathname === "/portal/log-stop";
    }
    if (href === "/feed" || href === "/portal/feed") {
      return pathname === "/feed" || pathname === "/portal/feed";
    }
    if (href === "/focus" || href === "/portal/focus") {
      return (pathname === "/focus" || pathname === "/portal/focus") && !currentMode;
    }
    if (href === "/analytics" || href === "/portal/analytics") {
      return (pathname === "/analytics" || pathname === "/portal/analytics") && !currentMode;
    }
    if (href === "/qr" || href === "/portal/qr") {
      return (pathname === "/qr" || pathname === "/portal/qr") && !currentMode;
    }
    if (href === "/settings" || href === "/portal/settings") {
      return (pathname === "/settings" || pathname === "/portal/settings") && !currentMode;
    }
    return pathname === href;
  };

  const navItemClass = (href: string) => {
    const active = isActive(href);
    return `flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
      active
        ? "bg-slate-100 text-slate-900 font-semibold"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    }`;
  };

  return (
    <>
      {/* Mobile Sub-Navigation Pill Bar for Issue List (< md) */}
      <div className="md:hidden w-full bg-white border-b border-slate-200 p-2 space-y-2 shadow-[0_1px_2px_rgba(0,0,0,0.03)] shrink-0 select-none">
        {/* Customer & Site Filters */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="flex items-center text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
              <Building2 className="w-2.5 h-2.5 mr-0.5 text-slate-400" />
              <span>Customer</span>
            </label>
            <div className="relative">
              <select
                value={currentCustomerId}
                onChange={(e) => setCurrentCustomerId(e.target.value)}
                className="w-full appearance-none bg-slate-50 text-slate-800 text-xs font-semibold py-1 pl-2 pr-5 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer truncate"
              >
                <option value="ALL">All Customers</option>
                {availableCompanies.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="flex items-center text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
              <Layers className="w-2.5 h-2.5 mr-0.5 text-slate-400" />
              <span>Site</span>
            </label>
            <div className="relative">
              <select
                value={currentSiteId}
                onChange={(e) => setCurrentSiteId(e.target.value)}
                className="w-full appearance-none bg-slate-50 text-slate-800 text-xs font-semibold py-1 pl-2 pr-5 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer truncate"
              >
                <option value="ALL">All Sites</option>
                {filteredSitesForCustomer.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Sub-navigation Links */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap pt-1 border-t border-slate-100">
          <Link
            href="/form"
            className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition ${
              isActive("/form") ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Plus className="w-3 h-3" />
            <span>Log Stop</span>
          </Link>
          <Link
            href="/feed"
            className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition ${
              isActive("/feed") ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <List className="w-3 h-3" />
            <span>Feed</span>
          </Link>
          <Link
            href="/focus"
            className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition ${
              isActive("/focus") ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Target className="w-3 h-3" />
            <span>Focus Board</span>
          </Link>
          <Link
            href="/analytics"
            className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition ${
              isActive("/analytics") ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <BarChart2 className="w-3 h-3" />
            <span>Analytics</span>
          </Link>
          <Link
            href="/qr"
            className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition ${
              isActive("/qr") ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <QrCode className="w-3 h-3" />
            <span>QR Codes</span>
          </Link>
          <Link
            href="/settings"
            className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition ${
              isActive("/settings") ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Settings className="w-3 h-3" />
            <span>Settings</span>
          </Link>

          <span className="text-slate-300">|</span>

          <Link
            href="/portal/log-issue"
            className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition ${
              isActive("/portal/log-issue") ? "bg-rose-600 text-white shadow-xs" : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
            }`}
          >
            <Plus className="w-3 h-3" />
            <span>Log Issue</span>
          </Link>
          <Link
            href="/portal/issues"
            className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition ${
              isActive("/portal/issues") ? "bg-rose-600 text-white shadow-xs" : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Issues</span>
          </Link>
          <Link
            href="/focus?mode=issues"
            className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition ${
              isActive("/focus?mode=issues") ? "bg-rose-600 text-white shadow-xs" : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
            }`}
          >
            <Target className="w-3 h-3" />
            <span>Issue Focus</span>
          </Link>
          <Link
            href="/analytics?mode=issues"
            className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition ${
              isActive("/analytics?mode=issues") ? "bg-rose-600 text-white shadow-xs" : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
            }`}
          >
            <BarChart2 className="w-3 h-3" />
            <span>Issue Analytics</span>
          </Link>
          <Link
            href="/qr?mode=issues"
            className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition ${
              isActive("/qr?mode=issues") ? "bg-rose-600 text-white shadow-xs" : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
            }`}
          >
            <QrCode className="w-3 h-3" />
            <span>Issue QR</span>
          </Link>
          <Link
            href="/settings?mode=issues"
            className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition ${
              isActive("/settings?mode=issues") ? "bg-rose-600 text-white shadow-xs" : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
            }`}
          >
            <Settings className="w-3 h-3" />
            <span>Issue Settings</span>
          </Link>
        </div>
      </div>

      {/* Desktop Left Sidebar (md and up) */}
      <aside
        className={`hidden md:flex ${
          collapsed ? "w-16" : "w-52"
        } bg-white border-r border-slate-200 flex-col justify-between shrink-0 min-h-[calc(100vh-3.5rem)] select-none transition-all duration-200`}
      >
        <div className="p-3 space-y-6">
          {/* Customer & Site Cascading Filter in Left Sidebar */}
          {!collapsed ? (
            <div className="pb-4 border-b border-slate-100 space-y-3">
              <div>
                <label className="flex items-center text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  <Building2 className="w-3 h-3 mr-1 text-slate-400" />
                  <span>Customer</span>
                </label>
                <div className="relative">
                  <select
                    value={currentCustomerId}
                    onChange={(e) => setCurrentCustomerId(e.target.value)}
                    className="w-full appearance-none bg-slate-50 hover:bg-slate-100/80 text-slate-800 text-xs font-semibold py-1.5 pl-2 pr-6 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition truncate"
                  >
                    <option value="ALL">All Customers</option>
                    {availableCompanies.map((comp) => (
                      <option key={comp.id} value={comp.id}>
                        {comp.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="flex items-center text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  <Layers className="w-3 h-3 mr-1 text-slate-400" />
                  <span>Site</span>
                </label>
                <div className="relative">
                  <select
                    value={currentSiteId}
                    onChange={(e) => setCurrentSiteId(e.target.value)}
                    className="w-full appearance-none bg-slate-50 hover:bg-slate-100/80 text-slate-800 text-xs font-semibold py-1.5 pl-2 pr-6 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition truncate"
                  >
                    <option value="ALL">All Sites</option>
                    {filteredSitesForCustomer.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center pb-3 border-b border-slate-100">
              <button
                onClick={() => setCollapsed(false)}
                className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                title={`Customer: ${currentCustomerName}\nSite: ${currentSiteName} (Click to expand)`}
              >
                <Building2 className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          )}

          {/* SHORT STOPS Group */}
          <div>
            {!collapsed && (
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Short Stops
              </div>
            )}
            <div className="space-y-0.5">
              <Link
                href="/form"
                className={navItemClass("/form")}
                title="Log Stop"
              >
                <Plus className="w-4 h-4 shrink-0 text-slate-700" />
                {!collapsed && <span>Log Stop</span>}
              </Link>

              <Link
                href="/feed"
                className={navItemClass("/feed")}
                title="Feed View"
              >
                <List className="w-4 h-4 shrink-0 text-slate-700" />
                {!collapsed && <span>Feed</span>}
              </Link>

              <Link
                href="/focus"
                className={navItemClass("/focus")}
                title="Focus Board"
              >
                <Target className="w-4 h-4 shrink-0 text-slate-700" />
                {!collapsed && <span>Focus Board</span>}
              </Link>

              <Link
                href="/analytics"
                className={navItemClass("/analytics")}
                title="Analytics"
              >
                <BarChart2 className="w-4 h-4 shrink-0 text-slate-700" />
                {!collapsed && <span>Analytics</span>}
              </Link>

              <Link
                href="/qr"
                className={navItemClass("/qr")}
                title="QR Codes"
              >
                <QrCode className="w-4 h-4 shrink-0 text-slate-700" />
                {!collapsed && <span>QR Codes</span>}
              </Link>

              <Link
                href="/settings"
                className={navItemClass("/settings")}
                title="Settings"
              >
                <Settings className="w-4 h-4 shrink-0 text-slate-700" />
                {!collapsed && <span>Settings</span>}
              </Link>
            </div>
          </div>

          {/* ISSUE TRACKER Group */}
          <div>
            {!collapsed && (
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Issue Tracker
              </div>
            )}
            <div className="space-y-0.5">
              <Link
                href="/portal/log-issue"
                className={navItemClass("/portal/log-issue")}
                title="Log Issue"
              >
                <Plus className="w-4 h-4 shrink-0 text-slate-700" />
                {!collapsed && <span>Log Issue</span>}
              </Link>

              <Link
                href="/portal/issues"
                className={navItemClass("/portal/issues")}
                title="Issues"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 text-slate-700" />
                {!collapsed && <span>Issues</span>}
              </Link>

              <Link
                href="/focus?mode=issues"
                className={navItemClass("/focus?mode=issues")}
                title="Focus Board"
              >
                <Target className="w-4 h-4 shrink-0 text-slate-700" />
                {!collapsed && <span>Focus Board</span>}
              </Link>

              <Link
                href="/analytics?mode=issues"
                className={navItemClass("/analytics?mode=issues")}
                title="Analytics"
              >
                <BarChart2 className="w-4 h-4 shrink-0 text-slate-700" />
                {!collapsed && <span>Analytics</span>}
              </Link>

              <Link
                href="/qr?mode=issues"
                className={navItemClass("/qr?mode=issues")}
                title="QR Codes"
              >
                <QrCode className="w-4 h-4 shrink-0 text-slate-700" />
                {!collapsed && <span>QR Codes</span>}
              </Link>

              <Link
                href="/settings?mode=issues"
                className={navItemClass("/settings?mode=issues")}
                title="Settings"
              >
                <Settings className="w-4 h-4 shrink-0 text-slate-700" />
                {!collapsed && <span>Settings</span>}
              </Link>
            </div>
          </div>
        </div>

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition w-full py-1.5 px-2 rounded-lg hover:bg-slate-50"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 mx-auto" />
            ) : (
              <>
                <span className="text-slate-400 font-bold">&laquo;</span>
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
