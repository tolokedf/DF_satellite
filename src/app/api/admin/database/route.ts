import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const download = searchParams.get("download");

    const baseDir = process.cwd();
    const dbPath = path.join(baseDir, "Database", "data", "satellite.db");
    const latestZipPath = path.join(baseDir, "Database", "backups", "DF_Satellite_DB_latest.zip");
    const rootZipPath = path.join(baseDir, "DF_Satellite_DB_latest.zip");

    // Handle direct download request
    if (download === "1") {
      const targetZip = fs.existsSync(latestZipPath)
        ? latestZipPath
        : fs.existsSync(rootZipPath)
        ? rootZipPath
        : null;

      if (!targetZip) {
        return NextResponse.json({ error: "No backup archive found. Please export first." }, { status: 404 });
      }

      const fileBuffer = fs.readFileSync(targetZip);
      const filename = path.basename(targetZip);

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    const dbExists = fs.existsSync(dbPath);
    let dbSize = "0 KB";
    let dbMtime = null;

    if (dbExists) {
      const stats = fs.statSync(dbPath);
      dbSize = (stats.size / 1024).toFixed(1) + " KB";
      dbMtime = stats.mtime.toISOString();
    }

    // SQLite Journal Mode
    let journalMode = "unknown";
    try {
      const res: any = await prisma.$queryRawUnsafe("PRAGMA journal_mode;");
      if (Array.isArray(res) && res[0]?.journal_mode) {
        journalMode = res[0].journal_mode;
      }
    } catch {
      // ignore
    }

    // Counts
    const [
      usersCount,
      companiesCount,
      sitesCount,
      robotsCount,
      projectsCount,
      issuesCount,
      shortStopsCount,
    ] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.company.count().catch(() => 0),
      prisma.site.count().catch(() => 0),
      prisma.robot.count().catch(() => 0),
      prisma.project.count().catch(() => 0),
      prisma.issue.count().catch(() => 0),
      prisma.shortStopLog.count().catch(() => 0),
    ]);

    // Check backups
    let backupInfo = null;
    const backupTarget = fs.existsSync(latestZipPath) ? latestZipPath : fs.existsSync(rootZipPath) ? rootZipPath : null;
    if (backupTarget) {
      const bStats = fs.statSync(backupTarget);
      backupInfo = {
        exists: true,
        size: (bStats.size / 1024).toFixed(1) + " KB",
        timestamp: bStats.mtime.toISOString(),
      };
    }

    return NextResponse.json({
      dbExists,
      dbPath: "Database/data/satellite.db",
      dbSize,
      dbMtime,
      journalMode,
      counts: {
        users: usersCount,
        companies: companiesCount,
        sites: sitesCount,
        robots: robotsCount,
        projects: projectsCount,
        issues: issuesCount,
        shortStops: shortStopsCount,
      },
      backup: backupInfo,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { action } = await req.json();

    if (action === "export") {
      const baseDir = process.cwd();
      const exportScript = path.join(baseDir, "scripts", "export_database.sh");
      const { stdout, stderr } = await execAsync(`bash "${exportScript}"`, { cwd: baseDir });
      return NextResponse.json({ success: true, message: "Database exported successfully", output: stdout });
    }

    if (action === "seed") {
      const baseDir = process.cwd();
      const { stdout } = await execAsync("npm run prisma:seed", { cwd: baseDir });
      return NextResponse.json({ success: true, message: "Database re-seeded successfully", output: stdout });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
