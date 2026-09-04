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

### 🛡️ Single Administrator Account
- **Master Admin Only:** Only one admin account exists in the system (`admin` / `df`).
- **No Additional Admins:** In the Super Admin Console, the role selection dropdown offers only **`Customer`** and **`Engineer`**. Creating additional `ADMIN` accounts or deleting the master admin account is strictly blocked by API guards.

### 🌐 Automatic Site Scoping for Engineers
- When provisioning an **`Engineer`** account in the Admin Console, the **Authorized Sites** container is automatically greyed out and all site checkboxes are disabled. Engineers automatically have global, unrestricted access across all customer sites in the fleet.

---

## 🎨 2. App Branding, Visual Identity & Navigation

- **Brand Logo & Official Corporate Assets:**
  - **Company Logo Asset:** Official DF Automation & Robotics corporate emblem fetched directly from `dfautomation.com` (`/images/df-icon-192.png` and `/images/df-logo.png`).
  - **Navbar Top Brand:** Official stylized teal "dF" company logo mark (`/images/df-icon-192.png`) alongside "DF Automation and robotics" and "DF satellite".
  - **Login Screen Brand:** Official full corporate emblem (`/images/df-logo.png`).
  - **Favicon & App Icon:** Generated from official company logo mark (`src/app/icon.png`, `public/favicon.ico`).
- **App Title:** `DF satellite`
- **Navbar Top Compartment (Level 1 - High Level Navigation):**
  - **Left:** Official DF Automation logo mark + "DF Automation and robotics" label + "DF satellite" title + dynamic Site Filter dropdown (beside the logo).
    - **Search Bar:** Completely removed from top bar and task overview.
    - **Top Bar Sections (Consistent Dimensions: `h-8 px-3 rounded-lg text-xs font-semibold`):**
      - **`issue list`** button (all roles, links to `/feed`): Activates the operational issue feed and **reveals the 2nd-level left sidebar**.
      - **`current status`** button (Engineer & Admin, links to `/current-status`): Field engineering status dashboard; **hides the left sidebar**.
      - **`task overview`** button (Engineer & Admin, links to `/portfolio`): Multi-project field dossier overview; **hides the left sidebar**.
      - **`My role`** button (Engineer only, links to `/my-role`): Milestone tracking dashboard (name, assignee, due date, actual completion date, delay); **hides the left sidebar**.
      - **`Administration`** button (Admin only, links to `/admin`): Super Admin Console; **hides the left sidebar**.
      - User avatar & username badge + **Sign Out** button.
      - *Switch Persona feature is completely disabled.*
  - **Left Sidebar (Level 2 - Sub-Module Navigation):**
    - **Contextual Visibility:** The left sidebar **only shows when in the `issue list` section** (`/feed`, `/form`, `/focus`, `/analytics`, `/qr`, `/settings`, `/portal/*`).
    - When clicking **`task overview`**, **`current status`**, **`My role`**, or **`Administration`**, the left sidebar is **strictly hidden**, giving full-width real estate to the dashboard and project dossiers.
  - **📱 Mobile Phone & Laptop Responsive Architecture:**
    - **Phone Mode (`< md` screens):**
      - **Header & Branding:** Compact DF icon mark + "DF satellite" + truncated Site selector to prevent horizontal overflow on small mobile screens.
      - **Mobile Navigation Drawer:** Tapping the hamburger button (`Menu`) slides out a navigation drawer with user role badge, Level 1 sections, 2nd-level issue list links, and Sign Out.
      - **1-Tap Quick-Pill Bar:** Positioned directly under the header on phones, providing instant 1-tap horizontal scrolling access to all Level 1 sections (`issue list`, `current status`, `task overview`, `My role`, `Administration`).
      - **Mobile Sub-Navigation Bar:** When in `issue list`, the fixed 208px desktop sidebar is hidden (`hidden md:flex`) so data tables receive 100% full screen width on phones. Instead, a smooth horizontal pill bar (`[+ Log Stop] [Feed] [Focus Board] [Analytics] [QR Codes] [+ Log Issue] [Issues] [Settings]`) sits on top of the content area.
    - **Laptop / Desktop Mode (`md` and up screens):**
      - **Spacious Desktop Header:** Displays full DF Automation logo, full site dropdown, inline navigation buttons with icons and labels (`h-8 px-3 rounded-lg text-xs font-semibold`), user display name, and quick Sign Out button.
      - **Desktop Left Sidebar:** Fixed, collapsible (`w-52` / `w-16`) sidebar alongside the main workspace.
    - **Mobile Table & Modal Safeguards:**
      - All data tables (`FeedView`, `MyRoleView`, `AdminConsole`, `CurrentStatusView`) have `overflow-x-auto` with minimum widths (`min-w-[620px]` to `min-w-[760px]`) and smooth touch scrolling so columns never compress into vertical slivers.
      - All modals have responsive padding (`p-3 sm:p-4`), `max-h-[92vh]`, and scrollable form bodies to prevent virtual keyboard clipping on phones.
  - **Logged-Out View & Authentication Guard:**
    - When logged out (or unauthenticated on `/login`), the left sidebar and top navbar compartment are completely hidden. Only the logo, title, and login card are visible.
    - Unauthenticated access to protected routes is guarded by [`src/middleware.ts`](file:///home/tinonn/DF_satelite/src/middleware.ts), redirecting unauthenticated requests to `/login`.
    - To prevent redirect flickering loops on session expiration or multi-device invalidation, `/login` never bounces back to `/feed` via middleware, and [`src/context/SiteContext.tsx`](file:///home/tinonn/DF_satelite/src/context/SiteContext.tsx) automatically purges stale cookies before redirecting to `/login`.

---

## 👥 3. The 3 System Roles (RBAC & Multi-Tenancy)

| Role | Access Scope & Key Workflows | Authentication |
| :--- | :--- | :--- |
| **CUSTOMER** | **Strictly Scoped Multi-Tenant Access:**<br/>• Customers only see robots and logs from their assigned sites.<br/>• Site Filter allows selecting specific authorized sites or "All Sites" (if 2+ sites assigned).<br/>• Top bar displays **`issue list`** with full 2nd-level left sidebar: Short Stop quick logging (`/form`), Feed view (`/feed`), Focus Board (`/focus`), Analytics (`/analytics`), QR codes (`/qr`), Settings (`/settings`). | Username & Password (provisioned by Admin) |
| **ENGINEER** | **Field Deployment Management, Current Status, Task Overview & My Role:**<br/>• Unrestricted visibility into all customer sites, robot fleets, and field deployment projects.<br/>• Top bar Level 1 includes **`issue list`** (reveals 2nd level sidebar), **`current status`** (FA dashboard, hides sidebar), **`task overview`** (field dossiers, hides sidebar), and **`My role`** (milestone tracking: name, assignee, due date, actual completion date, delay; hides sidebar).<br/>• Site Filter includes all customer sites across the entire fleet + "All Sites". | Username & Password (provisioned by Admin) |
| **ADMIN** | **Access Control, Site Provisioning & Fleet Governance:**<br/>• Single master account (`admin` / password: `df`).<br/>• Access to Super Admin Console (`/admin`): User provisioning, Site creation & management, Robot fleet registration, and Database Portability.<br/>• Full access to Top Bar Level 1: **`issue list`** (reveals 2nd level sidebar), **`current status`** (hides sidebar), **`task overview`** (hides sidebar), and **`Administration`** (hides sidebar). | Username & Password (`admin` / `df`) |

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

## 📊 5. Current Task & Task Overview Modules (Top Bar Exclusive)

### 📡 Current Task (`/current-status`)
- **Placement:** Accessible exclusively via the top bar button; strictly omitted from the left sidebar.
- **Visual Design Reference:** Faithfully models the internal FA Dashboard (`http://192.168.0.148:8090/`).
- **Team Switcher:** Toggle between **DFA** (DF Automation) and **DFI** (DF International) teams.
- **KPI Metrics:**
  - Active FA Deployments count
  - Total Weightage (Engineering Hours)
  - Total Overdue Tasks
  - Tasks In Progress
- **Dual Tabbed Navigation:**
  - **Overview Tab:** Grouped FA project accordions showing customer, priority, target dates, progress bars, open Asana tasks, and engineer workload cards.
  - **Workload & Scoreboard Tab:** Weekly engineer allocation calendar (Mon–Fri) and Engineer Performance Scoreboard tracking completed weightage, in-progress tasks, and on-time completion rates.
- **Backend Bridge & LAN Resiliency:**
  - Proxy route: [`src/app/api/current-status/route.ts`](file:///home/tinonn/DF_satelite/src/app/api/current-status/route.ts)
  - Live query: Polls `http://192.168.0.148:8090/api/field?team={team}` with a 3.5-second timeout.
  - Automatic Fallback: If offline or outside the local office LAN, it seamlessly queries the local SQLite `Project`, `ActionItem`, and `User` tables to prevent any disruption or error screens.

### 📋 Task Overview (`/portfolio`)
- **Header:** Cleaned up to "Task" with overview subtitle.
- **Removed Elements:**
  - "Asana Portfolio Standardized Template" badge completely removed.
  - Search bar input completely removed.
  - "Customer:" prefix label removed in front of the company selection dropdown.
  - **"my task" filter toggle & urgent tasks card removed:** In accordance with user directives, the "my task" filter list and toggle button are removed from Task overview, replaced by the dedicated top-level **`My role`** section.

### 🎯 My Role Milestone Management (`/my-role`)
- **Exclusivity:** Strictly accessible **only for Engineer accounts** (`currentUser?.role === "ENGINEER"`). Hidden for Customer and Admin accounts. Unauthenticated or non-engineer visits are automatically redirected to `/feed`.
- **Top-Level Navigation:** Accessible via the top bar `My role` button with identical dimensions (`h-8 px-3 rounded-lg text-xs font-semibold`). Clicking `My role` **strictly hides the 2nd-level left sidebar**.
- **Exact Milestone Table Columns:**
  1. **name:** Milestone description (e.g. Factory Acceptance Test, Rigging, SLAM Mapping, SAT) with optional project badge.
  2. **assignee:** Assigned robotics field engineer.
  3. **due date:** Target completion date.
  4. **actual completion date:** Actual verified completion date with quick "Mark Complete" date-picker modal for pending tasks.
  5. **delay (days):** Mathematically calculated schedule variance:
     - When completed: `differenceInDays(actualCompletionDate, dueDate)`
     - When pending/in-progress: `differenceInDays(today, dueDate)`
     - Color coding: `0 days` (emerald on-time/early badge), `+X days` (rose/amber delay badge).
- **Interactive Management:** Add milestone, edit milestone, delete milestone, quick completion, search by name/assignee, and filter pills (All / My Milestones / Delayed / Completed).

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
* **Network Binding:** Binds to `0.0.0.0` on port `3000` with automatic host LAN IP detection.

```
DF_satelite/
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
│   └── seed.ts               # Pre-seeded test data (Proton, Perodua, ST Muar, admin account)
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
├── export.sh / export.bat    # Quick database export shortcuts
├── import.sh / import.bat    # Quick database import shortcuts
├── start.sh / start.bat      # Launches production server on port 3000
├── stop.sh                   # Graceful shutdown script
├── PROJECT_CONTEXT.md        # Technical reference
├── SESSION_REFERENCE.md      # This file (Must be updated on every change!)
└── README.md
```

---

## 🔑 8. Initial Credentials & User Management

| Username | Password | Role | Permissions |
| :--- | :--- | :--- | :--- |
| `admin` | `df` | **ADMIN** | System Administrator. Only master account. Provisions Customer and Engineer accounts, provisions Customer Sites, assigns site scoping, registers fleet equipment. |

> **Single Device & No Fast Switching:**
> - Switching persona without logging out is permanently disabled.
> - To change accounts, the user must click **Sign Out** and manually log in with username and password.
> - An account can only be logged in on one device at a time. If logged in on another device, previous device sessions are immediately revoked.

---

## 🛠️ 9. Operational Commands Quick Reference

```bash
# Start the server (binds to 0.0.0.0:3000)
./start.sh

# Stop the server
./stop.sh

# Export / backup database (creates timestamped ZIP with SHA-256)
./export.sh

# Restore database from backup archive
./import.sh Database/backups/DF_Satellite_DB_<TIMESTAMP>.zip

# Rebuild Next.js app
npm run build
```
