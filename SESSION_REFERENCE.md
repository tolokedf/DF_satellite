# DF Satellite — Cross-Session Reference & Developer Directives

> **Document Purpose:** This document serves as the persistent cross-session operational, architectural, and development reference for Antigravity AI agents and developers working on the `DF_satelite` codebase.

---

## 🚨 1. Golden Rules & Directives

### ⚠️ Scope Constraint Directive
> **Do not add additional feature/button/text that did not mention in instruction.**
- **Strict Scope Adherence:** Only implement, edit, or remove the exact features, UI elements, text, or buttons explicitly stated by the user.
- **No Unrequested Widgets:** Do not invent auxiliary widgets, placeholder buttons, or unrequested layouts.
- **Preserve Existing Logic:** Always preserve existing endpoints, Prisma models, and role permissions unless explicitly asked to modify them.

---

## 👥 2. The 3 System Roles (RBAC & Multi-Tenancy)

The system differentiates access into exactly **3 user types**:

| Role | Access Scope & Key Workflows | Authentication |
| :--- | :--- | :--- |
| **CUSTOMER** | **Strictly Scoped Multi-Tenant Access:**<br/>• Customers only see robots and logs from their assigned sites.<br/>• *Example:* **Proton** only sees Johor (10 AGVs) and Penang (3 ARVs).<br/>• *Example:* **Perodua** only sees Rawang (4 AMRs).<br/>• Can log short stops via the quick-entry chip form.<br/>• Can submit breakdown issues and monitor monthly error analytics. | Username & Password (provisioned by Admin) |
| **ENGINEER** | **Field Deployment Management (Asana-Style):**<br/>• Oversees all customer sites, robots, and active field deployment projects.<br/>• Standardized project template across all deployments (OAL, Issues, Short Stops, MoM, DAR).<br/>• Interns and engineers share this exact same role.<br/>• Synced with Google Drive files/folders for viewing.<br/>• 1-Click HTML & Print-to-PDF export of standardized project dossiers. | Google Account / Gmail (or Username & Password) |
| **ADMIN** | **Access Control & Fleet Governance:**<br/>• Controls who sees what data.<br/>• Can provision new customer IDs/passwords (e.g. `id: perodua`, `password: perodua123`).<br/>• Can provision new engineers/interns (e.g. `id: intern`, `password: intern123`).<br/>• Maps customer users to specific plant sites.<br/>• Registers new AGV, AMR, and ARV fleet equipment. | Username & Password / Google Account |

---

## 📦 3. Program and Database Separation Architecture

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

## 🏗️ 4. Tech Stack & Workspace Topology

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
│   └── schema.prisma         # Relational schema (Company, Site, Robot, Project, ActionItem, Issue, ShortStopLog, MeetingMinute, DailyReport)
│
├── scripts/
│   ├── export_database.sh    # Database export & packaging script
│   ├── import_database.sh    # Database restore script
│   └── seed.ts               # Pre-seeded test data (Proton, Perodua, ST Muar)
│
├── src/
│   ├── app/
│   │   ├── (auth)/login/     # Login screen with Google OAuth and ID/Password options
│   │   ├── portfolio/        # Asana-style Portfolio overview of all field deployments
│   │   ├── projects/[id]/    # Standardized 5-section project workspace
│   │   ├── portal/log-stop/  # Customer quick-entry short stop form (chips & autosuggest)
│   │   ├── portal/log-issue/ # Customer breakdown issue reporting form
│   │   ├── portal/analytics/ # Customer site monthly error analytics & Pareto charts
│   │   ├── admin/            # Admin console (user credentials, site scoping, fleet registry)
│   │   └── api/              # Full-stack REST API and HTML/PDF export generator
│   ├── components/
│   │   ├── layout/           # Navbar (with fast Persona Switcher) & Sidebar
│   │   ├── customer/         # LogShortStopForm, LogIssueForm, CustomerAnalytics
│   │   ├── project/          # StandardProjectWorkspace (OAL, Issues, ShortStops, MoM, DAR)
│   │   ├── portfolio/        # PortfolioOverview
│   │   └── admin/            # AdminConsole
│   └── lib/
│       ├── auth.ts           # Session handling & getSiteFilterForUser() scoping helper
│       ├── prisma.ts         # PrismaClient singleton
│       └── types.ts          # Core TypeScript types (UserRole = ADMIN | ENGINEER | CUSTOMER)
│
├── export.sh / export.bat    # Quick database export shortcuts
├── import.sh / import.bat    # Quick database import shortcuts
├── start.sh / start.bat      # Launches production server on port 3000
├── stop.sh                   # Graceful shutdown script
├── PROJECT_CONTEXT.md        # Technical reference
├── SESSION_REFERENCE.md      # This file
└── README.md
```

---

## 📋 5. Standardized Project Template Structure (Engineer View)

Every field deployment project enforces the exact same 5 sections:

1. **Open Action List (OAL)**:
   - Fields: Item No (`OAL-001`), Title, Owner, Priority (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), Category (`HARDWARE`, `SOFTWARE`, `MECHANICAL`, `NETWORK`, `FACILITY`, `SAFETY`), Target Date, Status (`OPEN`, `IN_PROGRESS`, `BLOCKED`, `DONE`), Notes.
2. **Issue Tracker (RCA / 5-Why)**:
   - Fields: Issue No (`ISS-001`), Robot ID, Title, Severity, 5-Why Root Cause Analysis, Immediate Action, Permanent Countermeasure, Status (`OPEN`, `INVESTIGATING`, `COUNTERMEASURE_PROPOSED`, `VALIDATING`, `CLOSED`).
3. **Short Stop Logs**:
   - Real-time event log: Timestamp, Robot Code, Category, Zone/Location, Downtime Duration, Recovery Action, Resolved By.
4. **Minutes of Meeting (MoM)**:
   - Fields: Meeting Date, Attendees, Agenda, Key Decisions, Google Drive Synced Link.
5. **Daily Activity Reports (DAR)**:
   - Fields: Report Date, Lead Engineer, Shift (`DAY` / `NIGHT`), Activities Done, Blockers, Tomorrow's Plan, Google Drive Synced Link.

---

## 🔑 6. Default Demo Credentials

| Username | Password | Role | Assigned Sites / Permissions |
| :--- | :--- | :--- | :--- |
| `engineer` | `eng123` | **ENGINEER** | Google account linked (`engineer.lead@gmail.com`). Access to Asana Portfolio and all customer sites. |
| `intern` | `intern123` | **ENGINEER** | Field Intern Ahmad (Engineer role). Assigned to Johor & Rawang. |
| `admin` | `admin123` | **ADMIN** | System Administrator. User provisioning, site access assignment, fleet registry. |
| `proton` | `proton123` | **CUSTOMER** | Strictly Proton Johor (10 AGVs) & Penang (3 ARVs). |
| `perodua` | `perodua123` | **CUSTOMER** | Strictly Perodua Rawang (4 AMRs). |
| `stmuar` | `stmuar123` | **CUSTOMER** | Strictly ST Muar Cleanroom (6 AGVs/ARVs). |

---

## 🛠️ 7. Operational Commands Quick Reference

```bash
# Start the server (binds to 0.0.0.0:3000)
./start.sh

# Stop the server
./stop.sh

# Export / backup database (creates timestamped ZIP with SHA-256)
./export.sh

# Restore database from backup archive
./import.sh Database/backups/DF_Satellite_DB_<TIMESTAMP>.zip

# Re-seed database with sample customer & robot data
npm run prisma:seed

# Rebuild Next.js app
npm run build
```

---

## 🎨 8. Customer Site Reference UI Layouts (`customer site reference/`)

The repository includes visual benchmarks from previous field deployments in `customer site reference/`:

1. **Log Short Stop Form (`Pasted image.png` + reference)**:
   - Header with `Scan QR` button (lime green).
   - Dynamic Equipment/AGV and Zone dropdowns.
   - 10 Quick-Category chips + autosuggest field (`Tap a button above or type here...`).
   - Date, Start Time, Recovered Time (auto-calculating).
   - Downtime chips (`1 min`, `5 min`, `10 min`, `15 min`, `30 min`, `1 hr`, `Others`).
   - Specific Location input (`e.g. PIT DOCK CONSTRUCTION BHR APG BR-02`).
   - Problem summary, detailed description, and Action Taken chips (`Not resolved`, `Resolved`, `Restarted AGV`, `Cleared obstacle`, `Reset / power cycle`, `Pending engineering`).
   - Reported By email, Additional Notes, and Photo upload.
   - Full-width lime green `Submit Short Stop` button.

2. **Feed View (`Pasted image (2).png`)**:
   - Filter bar: AGV, Zone, Category, Source, From/To dates, with `Filter` and `Reset` buttons.
   - Live count badge (e.g. `4290 stops • live`), `Compact` and `Wrap text` toggles.
   - Quick `CSV` export button and `+ Add Row`.
   - High-density tabular columns: `ID`, `WHEN`, `AGV` (blue badge), `ZONE`, `CATEGORY` (purple pill), `LOCATION / STATION`, `PROBLEM`, `DESCRIPTION`.

3. **Focus Board (`Pasted image (3).png`)**:
   - Time-range selector: `7d`, `30d`, `90d`, `6mo`, `1yr`, `All`.
   - 3 Responsibility columns:
     1. **Field Team** (Onsite short-term resolution — every logged short stop).
     2. **R&D Team** (Permanent fix — software, firmware, algorithm, map).
     3. **Customer Team / ST** (Customer-side operation & equipment — visibility, not ownership).
   - Status indicators: `• Active`, `↑ Rising`, `↓ Fixed`.
   - Metric cards showing stop count, total downtime, recent count, sparkline trend, and last occurrence date.

