import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return new NextResponse("Project ID is required", { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        company: true,
        site: {
          include: { robots: true },
        },
        actionItems: { orderBy: { itemNo: "asc" } },
        issues: { include: { robot: true }, orderBy: { issueNo: "asc" } },
        meetingMinutes: { orderBy: { meetingDate: "desc" } },
        dailyReports: { orderBy: { reportDate: "desc" } },
      },
    });

    if (!project) {
      return new NextResponse("Project not found", { status: 404 });
    }

    if (user.role === "CUSTOMER") {
      if (!project.siteId || !user.assignedSiteIds.includes(project.siteId)) {
        return new NextResponse("Forbidden: Access denied to this project", { status: 403 });
      }
    }

    const shortStops = project.siteId
      ? await prisma.shortStopLog.findMany({
          where: { siteId: project.siteId },
          include: { robot: true },
          orderBy: { startTime: "desc" },
          take: 20,
        })
      : [];

    // Generate print-ready HTML
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${project.code} - ${project.name} | Field Deployment Report</title>
  <style>
    @page { size: A4; margin: 15mm 15mm 15mm 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.4; font-size: 11pt; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f52ba; padding-bottom: 12px; margin-bottom: 20px; }
    .brand { font-size: 20pt; font-weight: 800; color: #0f52ba; letter-spacing: -0.5px; }
    .brand span { color: #e11d48; }
    .doc-meta { text-align: right; font-size: 9pt; color: #64748b; }
    .title-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin-bottom: 24px; }
    .title-box h1 { margin: 0 0 8px 0; font-size: 16pt; color: #0f172a; }
    .grid-info { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; font-size: 9.5pt; margin-top: 10px; }
    .label { font-weight: bold; color: #475569; font-size: 8pt; text-transform: uppercase; }
    .val { font-weight: 600; color: #0f172a; }
    .section-heading { font-size: 13pt; font-weight: 700; color: #0f52ba; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin: 24px 0 10px 0; display: flex; justify-content: space-between; align-items: baseline; }
    .count { font-size: 10pt; color: #64748b; font-weight: normal; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 9pt; }
    th { background: #f1f5f9; text-align: left; padding: 8px; border: 1px solid #cbd5e1; font-weight: 600; }
    td { padding: 8px; border: 1px solid #e2e8f0; vertical-align: top; }
    tr:nth-child(even) td { background: #f8fafc; }
    .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 8pt; font-weight: 600; }
    .badge-crit { background: #fee2e2; color: #b91c1c; }
    .badge-high { background: #ffedd5; color: #c2410c; }
    .badge-med { background: #fef3c7; color: #b45309; }
    .badge-low { background: #f1f5f9; color: #475569; }
    .badge-done { background: #dcfce7; color: #15803d; }
    .badge-prog { background: #dbeafe; color: #1d4ed8; }
    .badge-open { background: #f3e8ff; color: #7e22ce; }
    .no-print-bar { background: #0f172a; color: white; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; border-radius: 8px; margin-bottom: 20px; }
    .btn { background: #0f52ba; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-weight: 600; cursor: pointer; text-decoration: none; }
    .btn:hover { background: #0c4194; }
    @media print {
      body { padding: 0; }
      .no-print-bar { display: none; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div>
      <strong>DF SATELLITE REPORT EXPORT</strong> — Standardized Field Deployment Dossier
    </div>
    <div>
      <button class="btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
      <button class="btn" style="background:#475569; margin-left: 8px;" onclick="window.close()">Close</button>
    </div>
  </div>

  <div class="header">
    <div class="brand">DF <span>SATELLITE</span> <small style="font-size: 10pt; color: #64748b; font-weight: normal;">| Field Robotics Operations</small></div>
    <div class="doc-meta">
      <div><strong>Report Code:</strong> ${project.code}</div>
      <div><strong>Generated:</strong> ${format(new Date(), "dd/MM/yyyy HH:mm")}</div>
    </div>
  </div>

  <div class="title-box">
    <h1>${project.name}</h1>
    <div>${project.description || "Field deployment and robotic commissioning management."}</div>
    <div class="grid-info">
      <div>
        <div class="label">Customer / Client</div>
        <div class="val">${project.company?.name || "General / Internal"}</div>
      </div>
      <div>
        <div class="label">Deployment Site</div>
        <div class="val">${project.site?.name || "No Site Assigned"}</div>
      </div>
      <div>
        <div class="label">Lead Engineer</div>
        <div class="val">${project.leadEngineer}</div>
      </div>
      <div>
        <div class="label">Target Go-Live</div>
        <div class="val">${project.targetGoLive ? format(new Date(project.targetGoLive), "dd/MM/yyyy") : "TBD"}</div>
      </div>
    </div>
  </div>

  <!-- Section 1: Open Action List (OAL) -->
  <div class="section-heading">
    <span>1. Open Action List (OAL)</span>
    <span class="count">${project.actionItems.length} Total Items</span>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 70px;">Item No</th>
        <th>Action Title & Description</th>
        <th style="width: 90px;">Category</th>
        <th style="width: 110px;">Owner</th>
        <th style="width: 70px;">Priority</th>
        <th style="width: 85px;">Target Date</th>
        <th style="width: 80px;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${project.actionItems.map(item => `
        <tr>
          <td><strong>${item.itemNo}</strong></td>
          <td>
            <div><strong>${item.title}</strong></div>
            ${item.notes ? `<div style="font-size: 8pt; color: #64748b; margin-top: 4px;">Update: ${item.notes}</div>` : ""}
          </td>
          <td><span class="badge badge-low">${item.category}</span></td>
          <td>${item.owner}</td>
          <td>
            <span class="badge ${item.priority === 'CRITICAL' ? 'badge-crit' : item.priority === 'HIGH' ? 'badge-high' : 'badge-med'}">
              ${item.priority}
            </span>
          </td>
          <td>${item.targetDate ? format(new Date(item.targetDate), "dd/MM/yyyy") : "-"}</td>
          <td>
            <span class="badge ${item.status === 'DONE' ? 'badge-done' : item.status === 'IN_PROGRESS' ? 'badge-prog' : 'badge-open'}">
              ${item.status}
            </span>
          </td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <!-- Section 2: Issue Tracker -->
  <div class="section-heading">
    <span>2. Robot Issues & Root Cause Analysis</span>
    <span class="count">${project.issues.length} Issues Logged</span>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 70px;">Issue No</th>
        <th style="width: 80px;">Robot</th>
        <th>Title & 5-Why Root Cause Analysis</th>
        <th>Countermeasure & Resolution</th>
        <th style="width: 70px;">Severity</th>
        <th style="width: 85px;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${project.issues.map(iss => `
        <tr>
          <td><strong>${iss.issueNo}</strong></td>
          <td><strong>${iss.robot?.code || "Site"}</strong></td>
          <td>
            <div><strong>${iss.title}</strong></div>
            ${iss.description ? `<div style="font-size: 8pt; color: #475569; margin-top: 2px;">${iss.description}</div>` : ""}
            ${iss.fiveWhyAnalysis ? `<div style="font-size: 8pt; color: #0284c7; background: #f0f9ff; padding: 4px; border-radius: 4px; margin-top: 4px;"><strong>RCA / 5-Why:</strong> ${iss.fiveWhyAnalysis}</div>` : ""}
          </td>
          <td>
            ${iss.immediateAction ? `<div style="font-size: 8pt;"><strong>Immediate:</strong> ${iss.immediateAction}</div>` : ""}
            ${iss.permanentCountermeasure ? `<div style="font-size: 8pt; color: #15803d; margin-top: 2px;"><strong>Permanent:</strong> ${iss.permanentCountermeasure}</div>` : ""}
          </td>
          <td>
            <span class="badge ${iss.severity === 'CRITICAL' ? 'badge-crit' : iss.severity === 'MAJOR' ? 'badge-high' : 'badge-med'}">
              ${iss.severity}
            </span>
          </td>
          <td>
            <span class="badge ${iss.status === 'CLOSED' ? 'badge-done' : 'badge-prog'}">
              ${iss.status}
            </span>
          </td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <!-- Section 3: Recent Short Stops -->
  <div class="section-heading page-break">
    <span>3. Robot Short Stop Event Log</span>
    <span class="count">Recent ${shortStops.length} Events</span>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 110px;">Date & Time</th>
        <th style="width: 80px;">Robot</th>
        <th>Category / Fault Trigger</th>
        <th>Location / Zone</th>
        <th style="width: 70px;">Downtime</th>
        <th>Recovery Action</th>
      </tr>
    </thead>
    <tbody>
      ${shortStops.map(stop => `
        <tr>
          <td>${format(new Date(stop.startTime), "dd/MM/yyyy HH:mm")}</td>
          <td><strong>${stop.robot?.code || "Site"}</strong></td>
          <td><strong>${stop.category}</strong></td>
          <td>${stop.specificLocation || stop.zone || "-"}</td>
          <td>${stop.durationMinutes} min</td>
          <td>${stop.recoveryAction || stop.resolvedBy || "Auto Reset"}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <!-- Section 4: Daily Activity Reports & MoM -->
  <div class="section-heading">
    <span>4. Minutes of Meeting & Field Activity Reports</span>
  </div>
  ${project.dailyReports.length > 0 ? `
    <div style="margin-bottom: 12px; font-size: 9.5pt;">
      <strong>Latest Daily Field Activity (${format(new Date(project.dailyReports[0].reportDate), "dd/MM/yyyy")} - ${project.dailyReports[0].engineerName}):</strong>
      <pre style="white-space: pre-wrap; font-family: inherit; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 4px; margin-top: 6px;">${project.dailyReports[0].activitiesDone}</pre>
    </div>
  ` : ""}

  <div style="margin-top: 40px; padding-top: 15px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; font-size: 9pt;">
    <div>
      <div><strong>DF Automation & Robotics Sdn Bhd</strong></div>
      <div>Prepared by: ${project.leadEngineer}</div>
      <div style="margin-top: 30px;">Signature: __________________________</div>
    </div>
    <div>
      <div><strong>Customer Acknowledged (${project.company?.name || "General"})</strong></div>
      <div>Site Operations Representative</div>
      <div style="margin-top: 30px;">Signature: __________________________</div>
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error: any) {
    return new NextResponse("Error generating report: " + error.message, { status: 500 });
  }
}
