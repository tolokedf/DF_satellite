import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Provisioning requested engineers, customers, companies, and sites...");

  // Clean all existing data across all perspectives
  await prisma.projectTask.deleteMany();
  await prisma.dailyReport.deleteMany();
  await prisma.meetingMinute.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.shortStopLog.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.actionItem.deleteMany();
  await prisma.project.deleteMany();
  await prisma.robot.deleteMany();
  await prisma.site.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  console.log("Cleared old records.");

  const hash = (pwd: string) => bcrypt.hashSync(pwd, 10);
  const password111 = hash("111");

  // 1. Master System Administrator (admin / df)
  await prisma.user.create({
    data: {
      username: "admin",
      passwordHash: hash("df"),
      name: "DF Administrator",
      role: "ADMIN",
      email: "admin@dfautomation.com",
      assignedSiteIds: "[]",
    },
  });
  console.log("✅ Master admin account created (admin / df)");

  // 2. 5 Engineers (eng1, eng2, eng3, eng4, eng5) - password: 111
  const engineerList = ["eng1", "eng2", "eng3", "eng4", "eng5"];
  for (const eng of engineerList) {
    await prisma.user.create({
      data: {
        username: eng,
        passwordHash: password111,
        name: eng,
        role: "ENGINEER",
        email: `${eng}@dfautomation.com`,
        assignedSiteIds: "[]",
      },
    });
    console.log(`✅ Engineer created: ${eng} (password: 111)`);
  }

  // 3. Customer Companies & Sites
  // cus1: siteA
  const comp1 = await prisma.company.create({
    data: {
      name: "cus1",
      code: "CUS1",
    },
  });
  const siteA = await prisma.site.create({
    data: {
      name: "siteA",
      code: "SITE_A",
      companyId: comp1.id,
    },
  });

  // cus2: siteB, siteC
  const comp2 = await prisma.company.create({
    data: {
      name: "cus2",
      code: "CUS2",
    },
  });
  const siteB = await prisma.site.create({
    data: {
      name: "siteB",
      code: "SITE_B",
      companyId: comp2.id,
    },
  });
  const siteC = await prisma.site.create({
    data: {
      name: "siteC",
      code: "SITE_C",
      companyId: comp2.id,
    },
  });

  // cus3: siteD, siteE, siteF
  const comp3 = await prisma.company.create({
    data: {
      name: "cus3",
      code: "CUS3",
    },
  });
  const siteD = await prisma.site.create({
    data: {
      name: "siteD",
      code: "SITE_D",
      companyId: comp3.id,
    },
  });
  const siteE = await prisma.site.create({
    data: {
      name: "siteE",
      code: "SITE_E",
      companyId: comp3.id,
    },
  });
  const siteF = await prisma.site.create({
    data: {
      name: "siteF",
      code: "SITE_F",
      companyId: comp3.id,
    },
  });

  console.log("✅ Customer companies & sites created:");
  console.log("   • cus1: siteA");
  console.log("   • cus2: siteB, siteC");
  console.log("   • cus3: siteD, siteE, siteF");

  // 4. Customer Accounts (cus1, cus2, cus3) - password: 111
  await prisma.user.create({
    data: {
      username: "cus1",
      passwordHash: password111,
      name: "cus1",
      role: "CUSTOMER",
      companyId: comp1.id,
      assignedSiteIds: JSON.stringify([siteA.id]),
      email: "cus1@customer.com",
    },
  });

  await prisma.user.create({
    data: {
      username: "cus2",
      passwordHash: password111,
      name: "cus2",
      role: "CUSTOMER",
      companyId: comp2.id,
      assignedSiteIds: JSON.stringify([siteB.id, siteC.id]),
      email: "cus2@customer.com",
    },
  });

  await prisma.user.create({
    data: {
      username: "cus3",
      passwordHash: password111,
      name: "cus3",
      role: "CUSTOMER",
      companyId: comp3.id,
      assignedSiteIds: JSON.stringify([siteD.id, siteE.id, siteF.id]),
      email: "cus3@customer.com",
    },
  });

  console.log("✅ Customer accounts created (password: 111 for all):");
  console.log("   • cus1 -> [siteA]");
  console.log("   • cus2 -> [siteB, siteC]");
  console.log("   • cus3 -> [siteD, siteE, siteF]");

  // 5. Robots for sites
  const robotsSiteA = await Promise.all([
    prisma.robot.create({ data: { siteId: siteA.id, code: "AGV-01", model: "Titan 500", status: "ONLINE" } }),
    prisma.robot.create({ data: { siteId: siteA.id, code: "AGV-02", model: "Titan 500", status: "ONLINE" } }),
    prisma.robot.create({ data: { siteId: siteA.id, code: "AGV-03", model: "Z100 Lifter", status: "MAINTENANCE" } }),
    prisma.robot.create({ data: { siteId: siteA.id, code: "AGV-04", model: "Z50 Tugger", status: "ONLINE" } }),
  ]);

  const robotsSiteB = await Promise.all([
    prisma.robot.create({ data: { siteId: siteB.id, code: "AGV-05", model: "Titan 1000", status: "ONLINE" } }),
    prisma.robot.create({ data: { siteId: siteB.id, code: "AGV-06", model: "Titan 1000", status: "ONLINE" } }),
  ]);

  const robotsSiteC = await Promise.all([
    prisma.robot.create({ data: { siteId: siteC.id, code: "AMR-01", model: "NavWiz SLAM", status: "ONLINE" } }),
    prisma.robot.create({ data: { siteId: siteC.id, code: "AMR-02", model: "NavWiz SLAM", status: "OFFLINE" } }),
  ]);

  await prisma.robot.create({ data: { siteId: siteD.id, code: "AMR-03", model: "NavWiz SLAM", status: "ONLINE" } });
  await prisma.robot.create({ data: { siteId: siteE.id, code: "AGV-07", model: "Z100 Lifter", status: "ONLINE" } });
  await prisma.robot.create({ data: { siteId: siteF.id, code: "AGV-08", model: "Titan 500", status: "ONLINE" } });
  console.log("✅ Seeded robots across all sites.");

  // 6. Projects
  const p1 = await prisma.project.create({
    data: {
      name: "Site A Logistics Automation",
      code: "PRJ-SITA-01",
      companyId: comp1.id,
      siteId: siteA.id,
      leadEngineer: "eng1",
      status: "ACTIVE",
      health: "ON_TRACK",
      targetGoLive: new Date("2026-10-15T00:00:00.000Z"),
      startDate: new Date("2026-07-01T00:00:00.000Z"),
    },
  });

  const p2 = await prisma.project.create({
    data: {
      name: "Site B Fleet Expansion",
      code: "PRJ-SITB-01",
      companyId: comp2.id,
      siteId: siteB.id,
      leadEngineer: "eng2",
      status: "ACTIVE",
      health: "AT_RISK",
      targetGoLive: new Date("2026-11-01T00:00:00.000Z"),
      startDate: new Date("2026-08-01T00:00:00.000Z"),
    },
  });

  const p3 = await prisma.project.create({
    data: {
      name: "Site C High-Bay Sorting AMR",
      code: "PRJ-SITC-01",
      companyId: comp2.id,
      siteId: siteC.id,
      leadEngineer: "eng3",
      status: "PLANNING",
      health: "OFF_TRACK",
      targetGoLive: new Date("2026-12-15T00:00:00.000Z"),
      startDate: new Date("2026-08-15T00:00:00.000Z"),
    },
  });
  console.log("✅ Seeded projects for Site A, Site B, and Site C.");

  // 7. Project Tasks & Milestones
  await prisma.milestone.createMany({
    data: [
      {
        name: "Factory Acceptance Test (FAT)",
        assignee: "eng1",
        dueDate: new Date("2026-08-15T00:00:00.000Z"),
        actualCompletionDate: new Date("2026-08-15T00:00:00.000Z"),
        status: "COMPLETED",
        projectId: p1.id,
        notes: "Passed FAT with customer QA team.",
      },
      {
        name: "Site Delivery & Mechanical Rigging",
        assignee: "eng1",
        dueDate: new Date("2026-08-25T00:00:00.000Z"),
        actualCompletionDate: new Date("2026-08-26T00:00:00.000Z"),
        status: "COMPLETED",
        projectId: p1.id,
        notes: "Delivered to warehouse dock 4.",
      },
      {
        name: "Site Acceptance Test (SAT)",
        assignee: "eng1",
        dueDate: new Date("2026-09-20T00:00:00.000Z"),
        actualCompletionDate: null,
        status: "IN_PROGRESS",
        projectId: p1.id,
        notes: "48-hour continuous payload test.",
      },
      {
        name: "PLC Interlock & Conveyor Handshake",
        assignee: "eng2",
        dueDate: new Date("2026-09-10T00:00:00.000Z"),
        actualCompletionDate: null,
        status: "DELAYED",
        projectId: p2.id,
        notes: "Waiting for Siemens PLC IO card update.",
      },
      {
        name: "NavWiz 2D Grid SLAM Mapping",
        assignee: "eng3",
        dueDate: new Date("2026-09-18T00:00:00.000Z"),
        actualCompletionDate: null,
        status: "IN_PROGRESS",
        projectId: p3.id,
        notes: "Aisle 1 to 12 laser reflectance scanned.",
      },
    ],
  });

  await prisma.projectTask.createMany({
    data: [
      {
        projectId: p1.id,
        section: "MILESTONE",
        event: "Delivery & Unboxing of Titan 500 units",
        assignee: "eng1",
        dueDate: new Date("2026-08-25T00:00:00.000Z"),
        actualFinishedDate: new Date("2026-08-25T00:00:00.000Z"),
        isDone: true,
        orderIndex: 1,
      },
      {
        projectId: p1.id,
        section: "OPEN_ACTION",
        event: "Calibrate magnetic tape sensors on Line 1",
        assignee: "eng1",
        dueDate: new Date("2026-09-12T00:00:00.000Z"),
        actualFinishedDate: null,
        isDone: false,
        orderIndex: 2,
        delayNote: "Pending tape replenishment from facility team.",
      },
      {
        projectId: p1.id,
        section: "ISSUE",
        event: "Resolve optical safety bumper blindspot on turn",
        assignee: "eng4",
        dueDate: new Date("2026-09-14T00:00:00.000Z"),
        actualFinishedDate: null,
        isDone: false,
        orderIndex: 3,
      },
      {
        projectId: p2.id,
        section: "OPEN_ACTION",
        event: "Configure Wi-Fi roaming threshold on access points",
        assignee: "eng2",
        dueDate: new Date("2026-09-11T00:00:00.000Z"),
        actualFinishedDate: null,
        isDone: false,
        orderIndex: 1,
      },
    ],
  });
  console.log("✅ Seeded milestones and project tasks.");

  // 8. Action Items
  await prisma.actionItem.createMany({
    data: [
      {
        projectId: p1.id,
        itemNo: "OAL-001",
        title: "Install fast-charging contact plates at charging pad 2",
        owner: "eng1",
        priority: "HIGH",
        category: "HARDWARE",
        status: "OPEN",
        targetDate: new Date("2026-09-15T00:00:00.000Z"),
      },
      {
        projectId: p1.id,
        itemNo: "OAL-002",
        title: "Test emergency stop integration with plant fire alarm",
        owner: "eng1",
        priority: "CRITICAL",
        category: "SAFETY",
        status: "IN_PROGRESS",
        targetDate: new Date("2026-09-10T00:00:00.000Z"),
      },
      {
        projectId: p2.id,
        itemNo: "OAL-001",
        title: "Calibrate turn radius at Bay 3 intersection",
        owner: "eng2",
        priority: "MEDIUM",
        category: "NAVIGATION",
        status: "OPEN",
        targetDate: new Date("2026-09-20T00:00:00.000Z"),
      },
    ],
  });

  // 9. Issues
  await prisma.issue.createMany({
    data: [
      {
        issueNo: "ISS-001",
        siteId: siteA.id,
        projectId: p1.id,
        robotId: robotsSiteA[2].id, // AGV-03
        title: "Laser scanner false obstacle detection under direct sunlight",
        description: "Front LiDAR reports obstacle when exiting aisle into dock area around 2 PM.",
        severity: "MAJOR",
        status: "INVESTIGATING",
        rootCauseCategory: "SENSOR",
        loggedBy: "cus1",
      },
      {
        issueNo: "ISS-002",
        siteId: siteA.id,
        projectId: p1.id,
        robotId: robotsSiteA[0].id, // AGV-01
        title: "Charging contact pin intermittent connection",
        description: "Robot occasionally fails to seat onto floor charger on attempt 1.",
        severity: "MODERATE",
        status: "OPEN",
        rootCauseCategory: "MECHANICAL",
        loggedBy: "cus1",
      },
      {
        issueNo: "ISS-003",
        siteId: siteB.id,
        projectId: p2.id,
        robotId: robotsSiteB[0].id, // AGV-05
        title: "High wheel motor temperature alert during pallet ascent",
        description: "Motor temp exceeded 68C on 3-degree ramp.",
        severity: "CRITICAL",
        status: "CLOSED",
        rootCauseCategory: "DRIVE_MOTOR",
        loggedBy: "cus2",
        permanentCountermeasure: "Adjusted acceleration ramp profile in drive controller.",
        closedAt: new Date("2026-09-05T10:00:00.000Z"),
      },
    ],
  });
  console.log("✅ Seeded issues for Site A and Site B.");

  // 10. Sample Short Stops across the past 7 days
  const now = Date.now();
  const oneHour = 3600 * 1000;
  const oneDay = 24 * oneHour;

  await prisma.shortStopLog.createMany({
    data: [
      {
        siteId: siteA.id,
        robotId: robotsSiteA[0].id,
        category: "Obstacle",
        zone: "Aisle 4",
        specificLocation: "Rack 4-B",
        problemSummary: "Worker pallet jack left in transit path",
        description: "LiDAR field triggered emergency deceleration.",
        actionTaken: "Moved pallet jack and resumed via pendant.",
        source: "Manual",
        startTime: new Date(now - 2 * oneDay),
        recoveryTime: new Date(now - 2 * oneDay + 4 * 60 * 1000),
        durationMinutes: 4,
        resolvedBy: "Site Operator A",
        recoveryAction: "Manual Clear",
      },
      {
        siteId: siteA.id,
        robotId: robotsSiteA[1].id,
        category: "Network Disconnect",
        zone: "Palletizer 1",
        specificLocation: "Column 18",
        problemSummary: "AP roaming latency spike",
        description: "Robot dropped MQTT heartbeat for 90 seconds.",
        actionTaken: "Robot auto-reconnected once roaming completed.",
        source: "NavWiz",
        startTime: new Date(now - 1 * oneDay - 4 * oneHour),
        recoveryTime: new Date(now - 1 * oneDay - 4 * oneHour + 2 * 60 * 1000),
        durationMinutes: 2,
        resolvedBy: "eng1",
        recoveryAction: "Auto-Recover",
      },
      {
        siteId: siteA.id,
        robotId: robotsSiteA[2].id,
        category: "Emergency Stop",
        zone: "Staging Area",
        specificLocation: "Gate 2",
        problemSummary: "E-stop button pressed by floor personnel",
        description: "Floor technician pressed E-stop to safely cross line.",
        actionTaken: "Released button, twist-reset, confirmed area clear.",
        source: "Manual",
        startTime: new Date(now - 8 * oneHour),
        recoveryTime: new Date(now - 8 * oneHour + 6 * 60 * 1000),
        durationMinutes: 6,
        resolvedBy: "Supervisor Tan",
        recoveryAction: "Operator Reset",
      },
      {
        siteId: siteB.id,
        robotId: robotsSiteB[0].id,
        category: "Navigation Lost",
        zone: "Inbound Dock",
        specificLocation: "Dock 1",
        problemSummary: "SLAM confidence dropped below threshold",
        description: "Rear dynamic scenery shifted during truck unloading.",
        actionTaken: "Re-localized robot position using handheld tablet.",
        source: "Manual",
        startTime: new Date(now - 3 * oneDay),
        recoveryTime: new Date(now - 3 * oneDay + 12 * 60 * 1000),
        durationMinutes: 12,
        resolvedBy: "eng2",
        recoveryAction: "Manual Relocalize",
      },
      {
        siteId: siteC.id,
        robotId: robotsSiteC[0].id,
        category: "Mechanical Jam",
        zone: "Conveyor Transfer",
        specificLocation: "Transfer Roller 2",
        problemSummary: "Tote skew triggered photo-eye interlock",
        description: "Tote misaligned on transfer belt.",
        actionTaken: "Straightened tote orientation and reset conveyor.",
        source: "Manual",
        startTime: new Date(now - 12 * oneHour),
        recoveryTime: new Date(now - 12 * oneHour + 5 * 60 * 1000),
        durationMinutes: 5,
        resolvedBy: "Operator Lee",
        recoveryAction: "Mechanical Reset",
      },
    ],
  });
  console.log("✅ Seeded short stops for Site A, Site B, and Site C.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
