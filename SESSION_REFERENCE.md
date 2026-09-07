# DF Satellite — Cross-Session Reference & Developer Directives

> ⚠️ **CRITICAL DIRECTIVE FOR ALL AGENTS & DEVELOPERS:**
> **Please update this markdown file everytime there is changes in here.**
> Whenever any feature, code, UI component, database model, or configuration is added, removed, or modified, immediately update this reference file to keep it strictly synchronized with the codebase.

---

## 🚨 1. Golden Rules & Directives

### ⚠️ Scope Constraint Directive
> **Do not add additional feature/button/text that did not mention in instruction.**
- **Strict Scope Adherence:** Only implement, edit, or remove the exact features, UI elements, text, or buttons explicitly stated by the user.
- **No Unrequested Widgets:** Do not invent auxiliary widgets, placeholder buttons, or unrequested layouts.
- **Preserve Existing Logic:** Always preserve existing endpoints, Prisma models, and role permissions unless explicitly asked to modify them.

### 🔒 Single Device Login & Manual Account Switching
- **Single Device Active Session:** Only one device is allowed to be logged into an account at any one time. When a user logs in on a device, a unique `sessionToken` is generated and tracked in the database (`User.sessionToken`). If the account is logged into on another device, the previous device session is immediately invalidated.
- **Switch Persona Feature Disabled:** Fast persona switching is completely removed from both the UI and backend APIs.
- **Manual Logout Required:** If changing accounts is needed, the user must explicitly click the **Sign Out** button, which clears the session cookie and navigates to the login screen. The user must then manually enter their credentials (username and password) to log in with the other account.
- **Cross-Device LAN IP Access Support:**
  - Cookies are configured with `secure: process.env.SECURE_COOKIES === "true"` (default `false` over HTTP LAN deployments).
  - Explicit `credentials: "include"` is set on login requests, and the session cookie is dispatched across both `cookies().set(...)` and `NextResponse.cookies.set(...)`.
  - When accessing via a local network IP (e.g. `http://192.168.1.148:3001`), mobile and desktop browsers on other devices do not reject or drop the cookie, enabling seamless login and persistent sessions across any device on the LAN.

### 🛡️ Single Administrator Account
- **Master Admin Only:** Only one admin account exists in the system (`admin` / `df`).
- **No Additional Admins:** In the Super Admin Console, the role selection dropdown offers only **`Customer`** and **`Engineer`**. Creating additional `ADMIN` accounts or deleting the master admin account is strictly blocked by API guards.

### 🌐 Authorized Sites Scope Constraint for Admin User Provisioning
- In the Super Admin Console (`/admin`) User Accounts tab:
  - When provisioning an **`Engineer`** account, the Authorized Sites container is greyed out and engineers automatically receive global access across all sites.
  - When provisioning a **`Customer`** account and selecting a **Company**, the **Authorized Sites (Scope Constraint)** checklist dynamically filters to **only** allow selecting sites belonging to that specific company.
  - If the administrator changes the selected company, any currently selected site IDs that do not belong to the newly selected company are immediately and automatically pruned from state.

### 📅 Universal Date Format Directive (DD/MM/YYYY)
> **All dates across the entire application must strictly be in `DD/MM/YYYY` format (`dd/MM/yyyy`, e.g. 7 September 2026 is `07/09/2026`).**
- **Strict Format Requirement:** All dates displayed across all modules (Project Workspace, My Tasks, Task Overview, Gantt charts, Short Stop Analytics, Issue Tracker, Daily Reports, MoM, and exports) must strictly follow `DD/MM/YYYY` (`dd/MM/yyyy`).
- **Timestamps:** When time is included, the format is `DD/MM/YYYY HH:mm` (`dd/MM/yyyy HH:mm`, e.g. `07/09/2026 14:30`).
- **Date Inputs in Project Workspace:** Standard HTML `<input type="date">` is wrapped with a styled container displaying a visible `dd/MM/yyyy` formatted overlay (`format(new Date(...), "dd/MM/yyyy")`) so the date format is guaranteed regardless of client browser/OS locale.

### 🔴 Project Delay Coloring Directive
- **Schedule Variance Evaluation:** Whenever a task has a due date and an actual finished date (or is overdue today), if the actual finished date is later than the due date:
  - The **Delay** column must show **`delayed`** (with `+Xd` duration) in **bold red colour** (`bg-red-100 text-red-600 border border-red-200 font-bold`).
  - The **Actual Finished Date** field is styled in **red** (`text-red-600 bg-red-50 border-red-200 font-bold`).
  - If completed on or before the due date, it displays **`no delay`** in emerald green (`bg-emerald-50 text-emerald-700 border border-emerald-200`).

### 📁 Optional Project Site Selection
- **No Site Option:** When creating a project (via Sidebar modal or Portfolio Overview), site selection is optional. Users can select "No site (Internal / General)".
- **Backend & Schema Support:** `Project.siteId` and `Project.companyId` are nullable in the Prisma schema. If no site is selected, the project is created with `siteId: null` and `companyId: null`, and the backend does not force a fallback site.
- **Access Scope:** Projects without a site are treated as general/internal engineering projects and accessible to Engineers and Administrators.

---

## 🎨 2. App Branding, Visual Identity & Navigation

- **Brand Logo & Official Corporate Assets:**
  - **Company Logo Asset:** Official DF Automation & Robotics corporate emblem fetched directly from `dfautomation.com` (`/images/df-icon-192.png` and `/images/df-logo.png`).
  - **Navbar Top Brand:** Official stylized teal "dF" company logo mark (`/images/df-icon-192.png`) alongside "DF Automation and robotics" and "DF satellite".
  - **Login Screen Brand:** Official full corporate emblem (`/images/df-logo.png`).
  - **Favicon & App Icon:** Generated from official company logo mark (`src/app/icon.png`, `public/favicon.ico`).
- **App Title:** `DF satellite`
- **Navbar Top Compartment (Level 1 - High Level Navigation):**
  - **Left:** Official DF Automation logo mark + "DF Automation and robotics" label + "DF satellite" title. (Top site filter is removed from the navbar).
  - **Search Bar:** Completely removed from top bar.
  - **Top Bar Sections (Consistent Dimensions: `h-8 px-3 rounded-lg text-xs font-semibold`):**
    - **`issue list`** button (all roles, links to `/feed`): Activates the operational issue feed and reveals the 2nd-level issue list left sidebar. **Styling:** Styled with white background (`bg-white text-slate-700 hover:bg-slate-50 border border-slate-200`) when unselected (on `/task-overview`, `/project`, `/admin`, etc.), and solid black (`bg-slate-900 text-white`) strictly when inside the Issue List module.
    - **`task Overview`** button (Engineer & Admin, links to `/task-overview`): High-level consolidated task dashboard; **hides the left sidebar**.
    - **`project`** button (Engineer & Admin, links to `/project`): Project workspace; **reveals the Project left sidebar**.
    - **`Administration`** button (Admin only, links to `/admin`): Super Admin Console; **hides the left sidebar**.
    - User avatar & username badge + **Sign Out** button.
    - *Switch Persona feature is completely disabled.*
- **Left Sidebar (Level 2 - Sub-Module Navigation):**
  - **Contextual Visibility:**
    - When in **`issue list`**:
      - **Cascading Customer & Site Filters:**
        - **Customer Filter:** Dropdown at the top of the sidebar ("All Customers" + list of companies).
        - **Site Filter:** Dropdown positioned directly below Customer, cascading to only list sites for the selected customer (or all sites if "All Customers" is chosen).
        - **Active Output Filtering:** Selection immediately filters live outputs across Short Stops (`/feed`), Focus Board (`/focus`), QR codes (`/qr`), and Issue Tracker (`/issues` & `/portal/issues`).
      - **Distinct Short Stops vs Independent Issue Tracker Sub-Modules:**
        - **Short Stops Section:** `Log Stop` (`/form`), `Feed` (`/feed`), `Focus Board` (`/focus`), `Analytics` (`/analytics`), `QR Codes` (`/qr`), `Settings` (`/settings`).
          - Short Stop Analytics features a **"Management report"** executive printable report modal with KPI metrics, Pareto root cause table, period breakdown, and approval sign-offs, plus live period views (`Daily`, `Weekly`, `Monthly`, `Annually`) and range chips (`7d`, `30d`, `90d`, `6mo`, `1yr`, `All`) with a functioning **"Apply"** button.
        - **Issue Tracker Section:** `Log Issue` (`/portal/log-issue`), `Issues` (`/issues`), `Focus Board` (`/issues/focus`), `Analytics` (`/issues/analytics`), `QR Codes` (`/issues/qr`), `Settings` (`/issues/settings`).
          - Completely independent views dedicated to machine breakdown issues, severity Pareto charts, breakdown QR placards, SLA thresholds, and escalation routing.
    - When in **`project`**: Shows the Project left sidebar with 2 sections: **"My Task"** and **"Work"** (`+ Add Project` button and all created projects).
    - When clicking **`task Overview`** or **`Administration`**, the left sidebar is **strictly hidden**, giving full-width real estate to the dashboards.
- **📱 Mobile Phone & Laptop Responsive Architecture:**
  - **Phone Mode (`< md` screens):**
    - **Header & Branding:** Compact DF icon mark + "DF satellite".
    - **Mobile Navigation Drawer:** Tapping the hamburger button (`Menu`) slides out a navigation drawer with user role badge, Level 1 sections (`issue list`, `task Overview`, `project`, `Administration`), and Sign Out.
    - **1-Tap Quick-Pill Bar:** Positioned directly under the header on phones, providing instant 1-tap horizontal scrolling access to all Level 1 sections (`issue list`, `task Overview`, `project`, `Administration`).
    - **Mobile Sub-Navigation & Filters Bar:** In Issue List, includes Customer and Site cascading selectors right above the scrollable pill buttons (`[Log Stop] [Feed] [Focus Board]...`). In Project, includes `[My Task] [+ Add Project] [Project 1]...`.
  - **Laptop / Desktop Mode (`md` and up screens):**
    - **Spacious Desktop Header:** Displays full DF Automation logo, inline navigation buttons with icons and labels (`h-8 px-3 rounded-lg text-xs font-semibold`), user display name, and quick Sign Out button.
    - **Desktop Left Sidebar:** Fixed, collapsible (`w-52` / `w-16`) sidebar alongside the main workspace, featuring cascading Customer and Site filters in Issue List.
  - **Mobile Table & Modal Safeguards:**
    - All data tables (`FeedView`, `ProjectWorkspace`, `AdminConsole`) have `overflow-x-auto` with minimum widths (`min-w-[700px]` to `min-w-[820px]`) and smooth touch scrolling so columns never compress into vertical slivers.
    - All modals have responsive padding (`p-3 sm:p-4`), `max-h-[92vh]`, and scrollable form bodies to prevent virtual keyboard clipping on phones.
- **Logged-Out View & Authentication Guard:**
  - When logged out (or unauthenticated on `/login`), the left sidebar and top navbar compartment are completely hidden. Only the logo, title, and login card are visible.
  - Unauthenticated access to protected routes is guarded by [`src/middleware.ts`](file:///home/tinonn/DF_satelite/src/middleware.ts), redirecting unauthenticated requests to `/login`.

---

## 👥 3. The 3 System Roles (RBAC & Multi-Tenancy)

| Role | Access Scope & Key Workflows | Authentication |
| :--- | :--- | :--- |
| **CUSTOMER** | **Strictly Scoped Multi-Tenant Access:**<br/>• Customers only see robots and logs from their assigned sites.<br/>• Site Filter allows selecting specific authorized sites or "All Sites" (if 2+ sites assigned).<br/>• Top bar displays **`issue list`** with full 2nd-level left sidebar: Short Stop quick logging (`/form`), Feed view (`/feed`), Focus Board (`/focus`), Analytics (`/analytics`), QR codes (`/qr`), Settings (`/settings`). | Username & Password (provisioned by Admin) |
| **ENGINEER** | **Field Deployment Management, Task Overview, Project & My Task:**<br/>• Unrestricted visibility into all customer sites, robot fleets, and field deployment projects.<br/>• Top bar Level 1 includes **`issue list`** (reveals issue sidebar), **`task Overview`** (consolidated fleet task metrics; hides sidebar), and **`project`** (project management with dedicated left sidebar).<br/>• Site Filter includes all customer sites across the entire fleet + "All Sites". | Username & Password (provisioned by Admin) |
| **ADMIN** | **Access Control, Site Provisioning & Fleet Governance:**<br/>• Single master account (`admin` / password: `df`).<br/>• Access to Super Admin Console (`/admin`): User provisioning, Site creation & management, Robot fleet registration, and Database Portability.<br/>• Full access to Top Bar Level 1: **`issue list`** (reveals issue sidebar), **`task Overview`** (hides sidebar), **`project`** (reveals project sidebar), and **`Administration`** (hides sidebar). | Username & Password (`admin` / `df`) |

---

## 🏢 4. Customer Sites & Facilities Provisioning

In the Super Admin Console (`/admin`), a dedicated **Customer Sites** tab enables administrators to:
- **Add New Customer Sites:**
  - Site / Facility Name (e.g. `Rawang Plant 2`, `Tanjung Malim Plant`).
  - Site Code (e.g. `RAWANG_2`, `TJ_MALIM` — auto-generated if blank).
  - Organization / Company: Choose from existing companies or create a new company on the fly.
  - Location / State (e.g. `Rawang, Selangor`).
- **Live Synchronization:** Newly created sites immediately appear in:
  - Top bar Site Filter dropdown (`SiteContext`).
  - Robot fleet registration site dropdown.
  - Customer user Authorized Sites checklist.
- **Site Management Table:** Shows company, site name, site code, location, total robots deployed, and logged short stops, with deletion support.

## 📊 5. Project & Task Overview Modules

### 📁 Project (`/project`)
- **Left Sidebar Architecture (Just like issue list):**
  - Section 1: **"My Task"**
    - Moved from former top-bar "My role" section into the Project left sidebar.
    - Shows all tasks across all projects assigned to the current engineer.
    - Interactive 5-column table with Done/Undone checkboxes, filter pills (All / Pending / Delayed / Completed), and search.
  - Section 2: **"Work"**
    - Lists all created projects (e.g. CAG Project, Proton Johor, etc.).
    - `+ Add Project` button: Opens quick creation modal (Project Name, optional Code, optional Customer Site) which immediately updates the list and routes to the new project.
- **Inside Every Single Project (Always 3 Sections):**
  1. **"Open Action"** (top)
  2. **"Milestone"** (middle)
  3. **"Issue"** (bottom)
- **Customizable To-Do List in Each Section:**
  - Can add custom to-do tasks to any section via `+ Add Action`, `+ Add Milestone`, `+ Add Issue` buttons (e.g. in CAG project Milestone: `assembly AGV 1`, `Testing AGV 1`, `pakage and shipment AGV1`).
  - Allows engineer to click **done or undone** with immediate visual feedback (line-through, date recording, status change).
  - **Exact 5 Columns per Row (From Left to Right):**
    1. **the event:** Checkbox (Done/Undone) + event/task description.
    2. **assign:** Name of assigned engineer, with selector allowing to choose which engineer to do the task by name.
    3. **duedate:** Target completion date. Displayed with a guaranteed `DD/MM/YYYY` overlay container with calendar icon and native date picker.
    4. **actual finished data:** Actual completion date. Displayed with a guaranteed `DD/MM/YYYY` overlay container. When delayed (later than due date), it is highlighted in **bold red** (`text-red-600 bg-red-50 border-red-200 font-bold`).
    5. **delay:** Schedule variance calculation:
       - If no delay (completed on/before due date, or pending with due date in future, or custom note): notes down **`no delay`** in an emerald badge (`bg-emerald-50 text-emerald-700 border-emerald-200`).
       - If delayed (actual finished date is later than due date, or pending past due date): notes down **`delayed (+Xd)`** in **bold red colour** (`bg-red-100 text-red-600 border border-red-200 font-bold`).

### 📡 Task Overview (`/task-overview`)
- **Page Title:** **Task Overview** with descriptive subtitle.
- **Three-Tier Consolidated Architecture:**
  - **1. "Summary" Section:**
    - Explicit section heading: `Summary`.
    - 6 KPI summary cards: **Total Tasks**, **Open Actions**, **Milestones**, **Issues**, **Delayed**, and **Completed**.
  - **2. "Gantt Chart" Section:**
    - Explicit section heading: `Gantt Chart`.
    - Full interactive multi-project milestone Gantt chart with continuous progress track, milestone completion status progression (dark vs light segments), today indicator line, and milestone details modal.
  - **3. Lower Two-Column Section (Directly Below Gantt Chart):**
    - **Left Section — "Current Engineer Workload":**
      - Tracks active workloads across all field deployment engineers.
      - Each engineer card displays: avatar/initials, name, workload intensity badge (`Heavy Load`, `Moderate`, `Light`, `Available`), active vs completed vs overdue counts, visual completion progress bar (`emerald` for completed, `rose` for overdue), and category badges (Open Actions, Milestones, Issues).
    - **Right Section — "Overdue Task":**
      - High-visibility list of incomplete tasks that are past their due date (`!isDone` and schedule variance is delayed).
      - Displays: interactive Done checkbox (allowing 1-click completion directly from overview), event description, clickable project link (`/project?id=...`), section badge (Open Action, Milestone, Issue), assigned engineer, due date (strictly `d/M/yyyy`), and delay duration badge (`+X days delay`).
      - Clean empty state with checkmark illustration when no overdue tasks exist.

---

## 📦 6. Program and Database Separation Architecture

Matching DF Automation corporate standards, the runtime database is strictly decoupled from the source code:

1. **Database Location (`Database/data/satellite.db`)**:
   - The SQLite database lives exclusively in `Database/data/`.
   - `Database/data/` and `Database/backups/` are registered in `.gitignore` so operational data is never committed to Git.

2. **1-Click Export Tool (`./export.sh` / `export.bat`)**:
   - Packages `Database/data/` into a portable, timestamped archive: `Database/backups/DF_Satellite_DB_YYYYMMDD_HHMMSS.zip`.
   - Generates a SHA-256 checksum for verification before USB transfer to customer deployment machines.

3. **1-Click Restore Tool (`./import.sh` / `import.bat`)**:
   - Restores a backup ZIP file into `Database/data/` while automatically creating a safety backup of the prior database.

---

## 🏗️ 7. Tech Stack & Workspace Topology

* **Framework:** Next.js 14+ (App Router, TypeScript)
* **Styling:** Tailwind CSS + Lucide Icons
* **Charts:** Recharts (Monthly stoppage frequencies & Pareto category distribution)
* **Database ORM:** Prisma Client with SQLite (`Database/data/satellite.db`)
* **Network Binding:** Binds to `0.0.0.0` on port `3001` with automatic host LAN IP detection.

```
DF_satellite/
├── Database/
│   ├── data/                 # Isolated runtime SQLite DB (satellite.db)
│   └── backups/              # Exported ZIP backup archives
│
├── prisma/
│   └── schema.prisma         # Relational schema (Company, Site, Robot, User, Project, ActionItem, Issue, ShortStopLog, MeetingMinute, DailyReport)
│
├── scripts/
│   ├── export_database.sh    # Database export & packaging script
│   ├── import_database.sh    # Database restore script
│   └── seed.ts               # Database initialization (creates admin, 5 engineers: eng1-eng5, 3 customers: cus1-cus3, and siteA-siteF)
│
├── src/
│   ├── app/
│   │   ├── login/            # Dedicated login screen (only logo, title, and credentials form)
│   │   ├── feed/             # Customer Short Stop feed table & CSV export
│   │   ├── form/             # Customer Quick Stop entry chip form (matching benchmark)
│   │   ├── focus/            # Customer Focus Board (Field Team / R&D / Customer Team)
│   │   ├── analytics/        # Customer Pareto charts & stoppage duration trends
│   │   ├── qr/               # QR code generator for AGV quick reporting
│   │   ├── settings/         # Customer settings & preferences
│   │   ├── current-status/   # Engineer Current Satus dashboard (matching 192.168.0.148:8090)
│   │   ├── portfolio/        # Task overview with "my task" toggle across deployments
│   │   ├── projects/[id]/    # Standardized 5-section project workspace (OAL, Issues, Stops, MoM, DAR)
│   │   ├── admin/            # Super Admin Console (Users, Customer Sites, Fleet, Portability)
│   │   └── api/              # Full-stack REST APIs (auth, current-status, admin/users, sites, robots, short-stops, issues, projects)
│   ├── components/
│   │   ├── layout/           # Navbar (brand, site selector, action buttons, logout) & Sidebar
│   │   ├── customer/         # FeedView, LogShortStopForm, FocusBoardView, AnalyticsView, QrCodesView, SettingsView
│   │   ├── engineer/         # CurrentStatusView (FA Dashboard replication, KPIs, accordions, workload, scoreboard)
│   │   ├── project/          # StandardProjectWorkspace (OAL, Issues, ShortStops, MoM, DAR)
│   │   ├── portfolio/        # PortfolioOverview (Task overview & "my task" filter)
│   │   └── admin/            # AdminConsole
│   ├── context/
│   │   └── SiteContext.tsx   # Global site selection, multi-tenant scoping, and available sites
│   ├── middleware.ts         # Route-level authentication guard redirecting unauthenticated users to /login
│   └── lib/
│       ├── auth.ts           # Session validation, cookie management, single-device sessionToken verification
│       ├── prisma.ts         # PrismaClient singleton
│       └── types.ts          # Core TypeScript types (UserRole, SessionUser, etc.)
│
├── docs/
│   └── customer_site_reference/ # UI reference screenshots
├── export.sh / export.bat    # Quick database export shortcuts
├── import.sh / import.bat    # Quick database import shortcuts
├── start.sh / start.bat      # Launches production server on port 3001
├── stop.sh / stop.bat        # Graceful shutdown scripts (Linux & Windows)
├── SESSION_REFERENCE.md      # This file (Must be updated on every change!)
└── README.md
```

---

## 🔑 8. Initial Credentials & User Management

| Username | Password | Role | Permissions / Scoping |
| :--- | :--- | :--- | :--- |
| `admin` | `df` | **ADMIN** | System Administrator. Provisions Customer and Engineer accounts, customer sites, site scoping, and fleet. |
| `eng1` | `111` | **ENGINEER** | Field Engineer. Global access across all customer sites and projects. |
| `eng2` | `111` | **ENGINEER** | Field Engineer. Global access across all customer sites and projects. |
| `eng3` | `111` | **ENGINEER** | Field Engineer. Global access across all customer sites and projects. |
| `eng4` | `111` | **ENGINEER** | Field Engineer. Global access across all customer sites and projects. |
| `eng5` | `111` | **ENGINEER** | Field Engineer. Global access across all customer sites and projects. |
| `cus1` | `111` | **CUSTOMER** | Customer 1. Scoped to `siteA`. |
| `cus2` | `111` | **CUSTOMER** | Customer 2. Scoped to `siteB` and `siteC`. |
| `cus3` | `111` | **CUSTOMER** | Customer 3. Scoped to `siteD`, `siteE`, and `siteF`. |

> **Single Device & No Fast Switching:**
> - Switching persona without logging out is permanently disabled.
> - To change accounts, the user must click **Sign Out** and manually log in with username and password.
> - An account can only be logged in on one device at a time. If logged in on another device, previous device sessions are immediately revoked.

---

## 🛠️ 9. Operational Commands Quick Reference

```bash
# Start the server (binds to 0.0.0.0:3001)
# Start the server (binds to 0.0.0.0:3001)
./start.sh          # Linux
start.bat           # Windows

# Stop the server
./stop.sh

# Export database (creates timestamped ZIP & DF_Satellite_DB_latest.zip)
./export.sh         # Linux development laptop
export.bat          # Windows

# Import database (auto-detects latest backup, drag-and-drop, or specific file)
./import.sh                                           # Linux (auto-detects latest)
./import.sh Database/backups/DF_Satellite_DB_latest.zip # Linux (specific file)
import.bat                                            # Windows (double-click or drag-and-drop zip/db)

# Rebuild Next.js app
npm run build
```

---

## 🗄️ 10. Database Isolation & Manual Migration Workflow

- **Strictly Excluded from Git:** Database files (`Database/data/*`, `*.db`, `*.db-*`, `*.sqlite`, `*.zip`) are ignored by `.gitignore` and are never committed to GitHub.
- **Manual Export Workflow (Development Laptop -> Deployment Desktop):**
  1. **On Linux Dev Laptop:** Run `./export.sh`.
     - Creates `DF_Satellite_DB_latest.zip` and a timestamped backup in `Database/backups/`.
  2. **Transfer:** Copy `DF_Satellite_DB_latest.zip` to a USB flash drive or network share.
  3. **On Windows Deployment Desktop:**
     - Copy `DF_Satellite_DB_latest.zip` into the `DF_satellite` project folder.
     - Double-click `import.bat` (or drag and drop the zip file directly onto `import.bat`).
     - It safely backs up any existing database, extracts `satellite.db` into `Database\data\`, cleans stale WAL files, and verifies integrity.
  4. **Run on Windows:** Double-click `start.bat` to launch the application on port `3001`.

---

## 🔧 11. Troubleshooting Windows Fresh Clone Setup

If `npm run build` shows `Failed to type check` or `prisma schema validation error code: P1012`:
1. **Pull Latest Code:**
   ```cmd
   git pull origin master
   ```
2. **Ensure `.env` Exists:**
   ```cmd
   if not exist .env copy .env.example .env
   ```
3. **Generate Prisma Client Types:**
   ```cmd
   npx prisma generate
   ```
4. **Compile / Rebuild:**
   ```cmd
   npm run build
   ```
   *(Or inspect specific lines by running `npx tsc --noEmit`)*
