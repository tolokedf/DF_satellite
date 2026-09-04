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
  - When accessing via a local network IP (e.g. `http://192.168.1.148:3000`), mobile and desktop browsers on other devices do not reject or drop the cookie, enabling seamless login and persistent sessions across any device on the LAN.

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
    - **Search Bar:** Completely removed from top bar.
    - **Top Bar Sections (Consistent Dimensions: `h-8 px-3 rounded-lg text-xs font-semibold`):**
      - **`issue list`** button (all roles, links to `/feed`): Activates the operational issue feed and reveals the 2nd-level issue list left sidebar.
      - **`task Overview`** button (Engineer & Admin, links to `/task-overview`): High-level consolidated task dashboard; **hides the left sidebar**.
      - **`project`** button (Engineer & Admin, links to `/project`): Project workspace; **reveals the Project left sidebar**.
      - **`Administration`** button (Admin only, links to `/admin`): Super Admin Console; **hides the left sidebar**.
      - User avatar & username badge + **Sign Out** button.
      - *Switch Persona feature is completely disabled.*
  - **Left Sidebar (Level 2 - Sub-Module Navigation):**
    - **Contextual Visibility:**
      - When in **`issue list`**: Shows the Issue List sidebar (`Log Stop`, `Feed`, `Focus Board`, `Analytics`, `QR Codes`, `Log Issue`, `Issues`, `Settings`).
      - When in **`project`**: Shows the Project left sidebar with 2 sections: **"My Task"** and **"Work"** (`+ Add Project` button and all created projects).
      - When clicking **`task Overview`** or **`Administration`**, the left sidebar is **strictly hidden**, giving full-width real estate to the dashboards.
  - **📱 Mobile Phone & Laptop Responsive Architecture:**
    - **Phone Mode (`< md` screens):**
      - **Header & Branding:** Compact DF icon mark + "DF satellite" + truncated Site selector to prevent horizontal overflow on small mobile screens.
      - **Mobile Navigation Drawer:** Tapping the hamburger button (`Menu`) slides out a navigation drawer with user role badge, Level 1 sections (`issue list`, `task Overview`, `project`, `Administration`), and Sign Out.
      - **1-Tap Quick-Pill Bar:** Positioned directly under the header on phones, providing instant 1-tap horizontal scrolling access to all Level 1 sections (`issue list`, `task Overview`, `project`, `Administration`).
      - **Mobile Sub-Navigation Bar:** Smooth horizontal pill bar for sub-navigation in both `issue list` and `project` (`[My Task] [+ Add Project] [Project 1] [Project 2]...`).
    - **Laptop / Desktop Mode (`md` and up screens):**
      - **Spacious Desktop Header:** Displays full DF Automation logo, full site dropdown, inline navigation buttons with icons and labels (`h-8 px-3 rounded-lg text-xs font-semibold`), user display name, and quick Sign Out button.
      - **Desktop Left Sidebar:** Fixed, collapsible (`w-52` / `w-16`) sidebar alongside the main workspace.
    - **Mobile Table & Modal Safeguards:**
      - All data tables (`FeedView`, `ProjectWorkspace`, `TaskOverviewView`, `AdminConsole`) have `overflow-x-auto` with minimum widths (`min-w-[700px]` to `min-w-[820px]`) and smooth touch scrolling so columns never compress into vertical slivers.
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
    3. **duedate:** Target completion date (editable via date picker).
    4. **actual finished data:** Actual completion date (editable date picker; auto-filled with current date when marked done).
    5. **delay:** Schedule variance calculation:
       - If no delay (completed on/before due date, or pending with due date in future, or custom note): note down **"no delay"** in an emerald badge.
       - If delayed (completed after due date or past due): notes down **"+X days delay"** in a rose/amber badge.

### 📡 Task Overview (`/task-overview`)
- **Aborted Structure:** The previous FA Dashboard structure (`192.168.0.148:8090` proxy, DFA/DFI teams, weekly allocation calendar, engineer scoreboards) is completely aborted and removed.
- **Full Milestone Gantt Chart (Top Prominent View):**
  - **Y-Axis:** Displays all current and dummy projects created in the "Project" module (e.g. CAG Project Phase 2, Honda Melaka AMR, Dyson Senai Carrier, Top Glove Banting AMR, Western Digital Wafer AGV, Proton Johor, etc.).
  - **Timeline (X-Axis):** Spans all project timelines with monthly/weekly ticks and a prominent vertical "Today" indicator line.
  - **Continuous Timeline Track:** Shows an unbroken continuous line starting from project initialization date (`startDate`) across each milestone's target due date.
  - **Dynamic Milestone Achievement Color Progression:**
    - **Light Color Segment:** The line begins as a soft light color (`bg-blue-100` / `border-blue-200`), signifying planned, pending, or future milestones.
    - **Dark Color Segment:** When a specific milestone is achieved / completed (`isDone: true`), the continuous line segment turns **dark color** (`bg-blue-700`), allowing engineers to immediately visualize at a glance which task is until which section.
    - **Milestone Nodes:** Completed milestones display a solid emerald node with a checkmark (`✓`), while upcoming milestones display a circular node with quick labels and interactive hover tooltips (Event, Assignee, Due Date, Actual Completion Date, and Delay).
- **Consolidated Fleet Task Dashboard:**
  - **KPI Metric Summary Cards:** Total Tasks, Open Actions, Milestones, Issues, Delayed Tasks, Completed Tasks.
  - **Cross-Project Unified Task Table:** Displays all tasks across all projects with Done/Undone checkboxes, The Event, Project badge (with quick link to project), Section badge, Assignee, Due Date, Actual Finished Date, and Delay ("no delay" / "+X days delay").
  - **Filters & Search:** Quick search by task or assignee, filter by Project, Section, and Status (All / Pending / Delayed / Done).

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
