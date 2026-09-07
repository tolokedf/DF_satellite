# 🛰️ DF Satellite — Field Deployment Management & Robot Issue Tracker

> **DF Automation & Robotics** — Unified operational platform for AGV, AMR, and ARV field deployments, consolidated project management, and customer robot issue tracking.

---

## 🚀 Key Features

1. **Role-Based Architecture & Multi-Tenant Scoping**:
   - **Customer Portal**: Strictly isolated to the customer's authorized sites.
     - *Example*: **Proton** only sees their 10 AGVs in Johor and 3 ARVs in Penang.
     - *Example*: **Perodua** only sees their 4 AMRs in Rawang.
     - **Quick Short Stop Form**: Rapid logging with 10 fault category chips (`Panel Transfer Stuck`, `Wheel Slippage`, `Docking`, etc.), downtime chips, and automatic recovery calculation.
     - **Breakdown Issue Tracker**: Report robot malfunctions directly to the DF engineering team.
     - **Telemetry & Analytics**: Monthly error frequency charts, Pareto category breakdowns, and MTTR/MTBF.
   - **Engineer Dashboard**:
     - **Asana-Style Portfolio**: Global overview of all active field deployments across all clients.
     - **Standardized Project Template**: Every project has an **Open Action List (OAL)**, **Issue Tracker (5-Why RCA)**, **Short Stop Logs**, **Minutes of Meeting (MoM)**, and **Daily Activity Reports (DAR)**.
     - **Google Drive Integration**: Direct links to synced Google Drive folders and files.
     - **HTML & Print-to-PDF Export**: One-click generation of official field deployment dossiers.
   - **Admin Console**:
     - Control who sees what data.
     - Provision customer credentials (`id: perodua`, `password: perodua123`).
     - Provision intern and engineer credentials (`id: intern`, `password: intern123`).
     - Assign granular site permissions and register AGV/AMR/ARV fleet equipment.

2. **Program and Database Separation Method**:
   - All runtime databases and telemetry records strictly reside in `Database/data/satellite.db`.
   - The `Database/data/` folder is excluded from Git, ensuring zero data loss during code updates.
   - **1-Click Backup & Export**: Run `./export.sh` (or `export.bat` on Windows) to create a timestamped `DF_Satellite_DB_YYYYMMDD_HHMMSS.zip` archive with SHA-256 verification.
   - **1-Click Restore**: Run `./import.sh <backup.zip>` (or `import.bat` on Windows) on any deployment PC or server to restore in seconds.

---

## 📂 System Topology

```
DF_satellite/
├── Database/
│   ├── data/                 # Isolated runtime SQLite database (Git ignored)
│   │   └── satellite.db
│   └── backups/              # Exported ZIP backup archives (Git ignored)
│
├── prisma/
│   └── schema.prisma         # Relational schema (Company, Site, Robot, Project, OAL, Issues, Short Stops)
│
├── scripts/
│   ├── export_database.sh    # 1-click DB backup and export tool
│   ├── import_database.sh    # 1-click DB restore tool
│   └── seed.ts               # Pre-configured seed data (Proton, Perodua, ST Muar)
│
├── src/
│   ├── app/
│   │   ├── (auth)/login/     # Google Sign-in & ID/Password login
│   │   ├── portfolio/        # Asana-style multi-project field overview
│   │   ├── projects/[id]/    # Standardized 5-tab field project workspace
│   │   ├── portal/log-stop/  # Fast operator short-stop form with chips
│   │   ├── portal/analytics/ # Monthly error and stoppage analytics
│   │   ├── admin/            # Access control, user provisioning & fleet registry
│   │   └── api/              # Full-stack REST API & HTML/PDF exporter
│   ├── components/           # UI components (Tailwind CSS, Lucide icons, Recharts)
│   └── lib/                  # Auth session engine, RBAC & Prisma client
│
├── export.sh / export.bat    # Quick database export shortcuts
├── import.sh / import.bat    # Quick database import shortcuts
├── start.sh / start.bat      # Production launch script binding to 0.0.0.0
└── package.json
```

---

## ⚡ Quick Start & Run

### 1. Launch the Application
```bash
./start.sh
```
Or for local development:
```bash
npm run dev
```

The web application binds to `0.0.0.0` on port `3001`, making it immediately accessible to any tablet or laptop on the local Wi-Fi / LAN (`http://<YOUR_LAN_IP>:3001`).

---

## 🔑 System Accounts & Credentials

| Role | Username | Password | Notes & Scope Constraint |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin` | `df` | Master System Administrator. Full access to Super Admin Console (`/admin`), site management, and user provisioning. |
| **Field Engineer** | `eng1` – `eng5` | `111` | Engineers with global access across all customer sites and projects. |
| **Customer: cus1** | `cus1` | `111` | Scoped to `siteA`. |
| **Customer: cus2** | `cus2` | `111` | Scoped to `siteB` and `siteC`. |
| **Customer: cus3** | `cus3` | `111` | Scoped to `siteD`, `siteE`, and `siteF`. |

---

## 📦 Database Backup & Server Migration

To transfer this application to a USB drive or migrate to another deployment machine:

1. **Export Database**:
   ```bash
   ./export.sh
   ```
   *(Creates `DF_Satellite_DB_YYYYMMDD_HHMMSS.zip` with SHA-256 checksum).*

2. **Restore Database on New Machine**:
   ```bash
   ./import.sh Database/backups/DF_Satellite_DB_<TIMESTAMP>.zip
   ```
