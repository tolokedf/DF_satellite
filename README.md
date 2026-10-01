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

## 📦 Database Portability & Sync (Development Laptop <-> Windows Desktop)

The SQLite database is decoupled from source control to protect production records. To manually transfer or synchronize your data between machines:

### Step 1: Export on Source Machine
- **Linux / Ubuntu**: Run `./export.sh`
- **Windows**: Double-click `export.bat`

This performs an atomic SQLite WAL checkpoint and outputs:
- `DF_Satellite_DB_latest.zip` (in project root)
- `Database/backups/DF_Satellite_DB_YYYYMMDD_HHMMSS.zip` (timestamped archive)

### Step 2: Transfer Archive
Copy `DF_Satellite_DB_latest.zip` via USB drive, local network share (SMB), or SCP/SFTP.

### Step 3: Import on Target Machine
- Place `DF_Satellite_DB_latest.zip` into the `DF_satellite` root directory.
- **Linux / Ubuntu**: Run `./import.sh`
- **Windows**: Double-click `import.bat`
- Start or restart the server (`./start.sh` or `start.bat`).

---

## 🛠️ Deployment Steps (Ubuntu PC & Windows PC)

Follow these instructions to deploy **DF Satellite** from scratch on any Ubuntu PC / Server or Windows PC, either from GitHub or an offline ZIP transfer.

### 📋 Prerequisites & Requirements

| Component | Minimum Requirement | Recommended | Check Command |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v18.17.0+` | `v20.x LTS` | `node -v` |
| **npm** | `v9.x+` | `v10.x+` | `npm -v` |
| **Git** | `v2.25+` (for GitHub clone) | Latest | `git --version` |
| **Network Port** | TCP `3001` open | TCP `3001` (configurable in `.env`) | `netstat -an` or `ss -tulpn` |
| **Hardware** | 2 CPU Cores, 2 GB RAM | 4 CPU Cores, 4 GB RAM | - |

---

### 🐧 Method 1: Deploy on Ubuntu / Debian Linux PC & Server

#### Option A: Clone from GitHub
```bash
# 1. Update system packages
sudo apt update && sudo apt install -y git curl

# 2. Install Node.js 20 LTS (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Clone repository
git clone https://github.com/DF-Automation/DF_satellite.git
cd DF_satellite
```

#### Option B: Deploy from ZIP / Offline Package
```bash
# 1. Unpack archive
unzip DF_satellite.zip -d DF_satellite
cd DF_satellite
```

#### Installation & Automated Launch (Ubuntu):
```bash
# 1. Grant execution permissions to management scripts
chmod +x *.sh scripts/*.sh

# 2. Run automated setup (generates .env, installs dependencies, syncs DB schema, builds Next.js)
./setup.sh

# 3. Launch DF Satellite production server
./start.sh
```

- **Stopping the server**:
  ```bash
  ./stop.sh
  ```
- **Checking logs**:
  ```bash
  tail -f .server.log
  ```
- **Accessing the web app**:
  - Local browser: `http://localhost:3001`
  - LAN / Wi-Fi tablets: `http://<UBUNTU_IP_ADDRESS>:3001`

#### Optional: Configure Ubuntu Systemd Auto-Start (Service Daemon)
To keep DF Satellite running persistently in the background across PC reboots:

1. Create a service file:
```bash
sudo nano /etc/systemd/system/df-satellite.service
```
2. Paste the following configuration (replace `/home/tinonn/DF_satellite` with your actual path):
```ini
[Unit]
Description=DF Satellite Field Operations Portal
After=network.target

[Service]
Type=simple
User=tinonn
WorkingDirectory=/home/tinonn/DF_satellite
Environment=NODE_ENV=production
Environment=PORT=3001
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```
3. Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable df-satellite
sudo systemctl start df-satellite
```

---

### 🪟 Method 2: Deploy on Windows PC / Industrial Laptop

#### Option A: Clone from GitHub
1. Install **Git for Windows** from [git-scm.com](https://git-scm.com/) if needed.
2. Install **Node.js 20 LTS** from [nodejs.org](https://nodejs.org/) (check the box to install npm).
3. Open **Command Prompt** (`cmd`) or **PowerShell**:
   ```cmd
   git clone https://github.com/DF-Automation/DF_satellite.git
   cd DF_satellite
   ```

#### Option B: Deploy from ZIP Package
1. Extract the downloaded `DF_satellite.zip` to a folder such as `C:\DF_satellite` or onto the Desktop.
2. Open the extracted `DF_satellite` folder.

#### Installation & Launch (Windows 1-Click):
1. **Initial Setup**:
   - Double-click **`setup.bat`**.
   - The script will automatically verify Node.js, create `.env`, run `npm install`, generate the Prisma client, restore/seed the database, and compile the production build.
2. **Launch Application**:
   - Double-click **`start.bat`**.
   - A Command Prompt window will open and confirm the server is running on `http://0.0.0.0:3001`.
   - Keep this window open while operating the app.
3. **Stop Application**:
   - Double-click **`stop.bat`** or close the running terminal window.

#### Opening Windows Defender Firewall for Factory Tablet Access:
If tablets on the factory Wi-Fi cannot access the Windows PC at `http://<PC_IP>:3001`, run this command in **PowerShell (Run as Administrator)**:
```powershell
New-NetFirewallRule -DisplayName "DF Satellite Web App" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

---

### 🏭 Method 3: Factory Air-Gapped / Intranet Deployment (Zero Internet Access)

For isolated manufacturing environments without internet connectivity:

1. **Prepare on an Online Machine**:
   ```bash
   git clone <repo_url> DF_satellite
   cd DF_satellite
   npm install
   npx prisma generate
   npm run build
   ./export.sh
   ```
2. **Package for USB Transfer**:
   - Zip the entire directory **including** `node_modules/`, `.next/`, `Database/data/satellite.db`, and `DF_Satellite_DB_latest.zip`.
3. **Deploy on Air-Gapped PC**:
   - Copy and extract the zip archive on the target factory PC.
   - Run `./start.sh` (Linux) or double-click `start.bat` (Windows).
   - The self-healing launch scripts detect existing builds and start immediately without requiring internet access or npm download steps.

---

### 🔍 Post-Deployment Verification Checklist

1. Open your browser and navigate to `http://localhost:3001` (or `http://<IP_ADDRESS>:3001`).
2. Log in using the default administrator credentials:
   - **Username**: `admin`
   - **Password**: `df`
3. Navigate to **Super Admin Console** (`/admin`) -> **Database Portability** (`/admin/database`):
   - Verify that **Database Integrity** displays `HEALTHY (WAL MODE)`.
   - Verify that the fleet counts (Robots, Sites, Companies, Short Stops) are populated.
4. Test the customer portal by logging out and logging in as:
   - `cus1` / `111` (Proton Site A view)
   - `cus2` / `111` (Perodua Site B & C view)
5. Test downloading a 1-click database backup directly from the web UI under **Database Operations**.

---

### ❓ Troubleshooting & FAQs

- **Error: `Port 3001 is already in use` (EADDRINUSE)**:
  - Linux: Run `./stop.sh` or `fuser -k 3001/tcp`.
  - Windows: Double-click `stop.bat` or run `netstat -ano | findstr :3001` and kill the PID with `taskkill /F /PID <PID>`.
- **Database lock or missing tables (`SQLite Error: no such table`)**:
  - Run `./setup.sh` (Linux) or `setup.bat` (Windows) to automatically apply schema migrations and restore seed records.
- **Prisma Client outdated or missing**:
  - Run `npx prisma generate`.
- **Latency / Slow page response on offline network**:
  - If the factory does not use a central Fleet Automation server, ensure `LIVE_FA_URL` in `.env` is omitted or left empty. The app will automatically run on instantaneous local telemetry without waiting for network timeouts.

