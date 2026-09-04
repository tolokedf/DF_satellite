import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding DF Satellite database...");

  // Clean existing data
  await prisma.dailyReport.deleteMany();
  await prisma.meetingMinute.deleteMany();
  await prisma.shortStopLog.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.actionItem.deleteMany();
  await prisma.project.deleteMany();
  await prisma.robot.deleteMany();
  await prisma.user.deleteMany();
  await prisma.site.deleteMany();
  await prisma.company.deleteMany();

  console.log("Cleared old records.");

  // Passwords
  const hash = (pwd: string) => bcrypt.hashSync(pwd, 10);

  // 1. Companies
  const proton = await prisma.company.create({
    data: {
      name: "Proton Holdings",
      code: "PROTON",
      description: "Automotive assembly & robotic component delivery line",
    },
  });

  const perodua = await prisma.company.create({
    data: {
      name: "Perodua Manufacturing",
      code: "PERODUA",
      description: "Vehicle manufacturing and smart warehouse logistics",
    },
  });

  const stMuar = await prisma.company.create({
    data: {
      name: "ST Microelectronics Muar",
      code: "ST_MUAR",
      description: "Semiconductor cleanroom wafer & cassette transfer automation",
    },
  });

  // 2. Sites
  // Proton Sites
  const protonJohor = await prisma.site.create({
    data: {
      companyId: proton.id,
      name: "Proton Johor Plant",
      code: "PROTON-JHR",
      location: "Johor Bahru, Johor",
    },
  });

  const protonPenang = await prisma.site.create({
    data: {
      companyId: proton.id,
      name: "Proton Penang Facility",
      code: "PROTON-PNG",
      location: "Bayan Lepas, Penang",
    },
  });

  // Perodua Site
  const peroduaRawang = await prisma.site.create({
    data: {
      companyId: perodua.id,
      name: "Perodua Rawang Plant",
      code: "PERODUA-RWG",
      location: "Rawang, Selangor",
    },
  });

  // ST Muar Site
  const stMuarSite = await prisma.site.create({
    data: {
      companyId: stMuar.id,
      name: "ST Muar Main Facility",
      code: "STM-MUAR",
      location: "Tanjung Agas Industrial Estate, Muar, Johor",
    },
  });

  // 3. Robots
  // Proton Johor: 10 AGVs
  const protonJohorRobots = [];
  for (let i = 1; i <= 10; i++) {
    const code = `AGV-${i.toString().padStart(2, "0")}`;
    const robot = await prisma.robot.create({
      data: {
        siteId: protonJohor.id,
        code,
        name: `Titan Towing AGV #${i}`,
        model: "Titan T-500",
        type: "AGV",
        status: i === 3 ? "SHORT_STOP" : i === 8 ? "MAINTENANCE" : "RUNNING",
        lineZone: i <= 5 ? "Zone A - Stamping & Subassembly" : "Zone B - Final Trim Line",
        ipAddress: `192.168.10.${100 + i}`,
      },
    });
    protonJohorRobots.push(robot);
  }

  // Proton Penang: 3 ARVs
  const protonPenangRobots = [];
  for (let i = 1; i <= 3; i++) {
    const code = `ARV-${i.toString().padStart(2, "0")}`;
    const robot = await prisma.robot.create({
      data: {
        siteId: protonPenang.id,
        code,
        name: `Autonomous Rail/Reach Vehicle #${i}`,
        model: "NavWiz ARV-200",
        type: "ARV",
        status: i === 2 ? "SHORT_STOP" : "RUNNING",
        lineZone: "Zone C - High-bay Storage Transfer",
        ipAddress: `192.168.20.${100 + i}`,
      },
    });
    protonPenangRobots.push(robot);
  }

  // Perodua Rawang: 4 AMRs
  const peroduaRobots = [];
  for (let i = 1; i <= 4; i++) {
    const code = `AMR-${i.toString().padStart(2, "0")}`;
    const robot = await prisma.robot.create({
      data: {
        siteId: peroduaRawang.id,
        code,
        name: `Zeta Heavy-payload AMR #${i}`,
        model: "Zeta AMR-1000",
        type: "AMR",
        status: "RUNNING",
        lineZone: "Engine Logistics Corridor",
        ipAddress: `192.168.30.${100 + i}`,
      },
    });
    peroduaRobots.push(robot);
  }

  // ST Muar: 6 mixed AGV/AMR
  const stMuarRobots = [];
  for (let i = 1; i <= 6; i++) {
    const isArv = i > 4;
    const code = `${isArv ? "ARV" : "AGV"}-${i.toString().padStart(2, "0")}`;
    const robot = await prisma.robot.create({
      data: {
        siteId: stMuarSite.id,
        code,
        name: `${isArv ? "Cleanroom ARV" : "Substrate Transfer AGV"} #${i}`,
        model: isArv ? "ARV Clean-50" : "Titan T-300",
        type: isArv ? "ARV" : "AGV",
        status: i === 1 ? "SHORT_STOP" : "RUNNING",
        lineZone: i <= 3 ? "Cleanroom Zone 1 (Photolithography)" : "Zone 2 (Assembly & Test)",
        ipAddress: `192.168.40.${100 + i}`,
      },
    });
    stMuarRobots.push(robot);
  }

  console.log(`Created ${protonJohorRobots.length + protonPenangRobots.length + peroduaRobots.length + stMuarRobots.length} robots across 4 sites.`);

  // 4. Users & Access Control
  // Admin
  await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@dfautomation.com",
      passwordHash: hash("admin123"),
      name: "DF System Administrator",
      role: "ADMIN",
      googleLinked: true,
      assignedSiteIds: JSON.stringify([protonJohor.id, protonPenang.id, peroduaRawang.id, stMuarSite.id]),
    },
  });

  // Engineer
  await prisma.user.create({
    data: {
      username: "engineer",
      email: "engineer.lead@gmail.com",
      passwordHash: hash("eng123"),
      name: "Senior Field Robotics Engineer",
      role: "ENGINEER",
      googleLinked: true,
      assignedSiteIds: JSON.stringify([protonJohor.id, protonPenang.id, peroduaRawang.id, stMuarSite.id]),
    },
  });

  // Intern
  await prisma.user.create({
    data: {
      username: "intern",
      email: "intern@dfautomation.com",
      passwordHash: hash("intern123"),
      name: "Field Deployment Intern (Ahmad)",
      role: "ENGINEER",
      assignedSiteIds: JSON.stringify([protonJohor.id, peroduaRawang.id]),
    },
  });

  // Customers
  // Proton Customer: Can ONLY see Proton Johor & Proton Penang sites!
  await prisma.user.create({
    data: {
      username: "proton",
      email: "ops@proton.com",
      passwordHash: hash("proton123"),
      name: "Proton Operations Team",
      role: "CUSTOMER",
      companyId: proton.id,
      assignedSiteIds: JSON.stringify([protonJohor.id, protonPenang.id]),
    },
  });

  // Perodua Customer: Can ONLY see Perodua Rawang site!
  await prisma.user.create({
    data: {
      username: "perodua",
      email: "logistics@perodua.com.my",
      passwordHash: hash("perodua123"),
      name: "Perodua Factory Automation",
      role: "CUSTOMER",
      companyId: perodua.id,
      assignedSiteIds: JSON.stringify([peroduaRawang.id]),
    },
  });

  // ST Muar Customer: Can ONLY see ST Muar site!
  await prisma.user.create({
    data: {
      username: "stmuar",
      email: "site.lead@st.com",
      passwordHash: hash("stmuar123"),
      name: "ST Muar Automation Eng",
      role: "CUSTOMER",
      companyId: stMuar.id,
      assignedSiteIds: JSON.stringify([stMuarSite.id]),
    },
  });

  console.log("Created users with scoped multi-tenant permissions.");

  // 5. Field Deployment Projects (Standardized template for Engineers)
  const projProton = await prisma.project.create({
    data: {
      name: "Proton Johor 10-AGV Fleet Line Integration",
      code: "PRJ-PTN-JHR-01",
      companyId: proton.id,
      siteId: protonJohor.id,
      status: "ACTIVE",
      health: "ON_TRACK",
      leadEngineer: "Ir. Razak (DF Robotics)",
      targetGoLive: new Date("2026-10-15"),
      description: "Full turnkey deployment of 10 Titan T-500 towing AGVs replacing manual tugger routes between Stamping and Main Assembly.",
      gdriveFolderUrl: "https://drive.google.com/drive/folders/proton-johor-deployment-docs",
    },
  });

  const projPenang = await prisma.project.create({
    data: {
      name: "Proton Penang ARV High-Bay Storage Transfer",
      code: "PRJ-PTN-PNG-02",
      companyId: proton.id,
      siteId: protonPenang.id,
      status: "ACTIVE",
      health: "AT_RISK",
      leadEngineer: "Chong W.K. (DF Robotics)",
      targetGoLive: new Date("2026-11-30"),
      description: "Commissioning of 3 Autonomous Rail/Reach Vehicles for automated warehouse buffer replenishment.",
      gdriveFolderUrl: "https://drive.google.com/drive/folders/proton-penang-arv-docs",
    },
  });

  const projPerodua = await prisma.project.create({
    data: {
      name: "Perodua Rawang AMR Engine Delivery",
      code: "PRJ-PRD-RWG-01",
      companyId: perodua.id,
      siteId: peroduaRawang.id,
      status: "ACTIVE",
      health: "ON_TRACK",
      leadEngineer: "Kevin Lee (DF Robotics)",
      targetGoLive: new Date("2026-12-01"),
      description: "Integration of 4 Zeta AMR units with factory PLC and traffic management server.",
      gdriveFolderUrl: "https://drive.google.com/drive/folders/perodua-amr-rawang",
    },
  });

  const projSTMuar = await prisma.project.create({
    data: {
      name: "ST Muar Cleanroom Cassette Automation",
      code: "PRJ-STM-001",
      companyId: stMuar.id,
      siteId: stMuarSite.id,
      status: "ACTIVE",
      health: "ON_TRACK",
      leadEngineer: "Nurul Aina (DF Robotics)",
      targetGoLive: new Date("2026-09-30"),
      description: "Automated guided vehicle fleet for ISO Class 4 cleanroom substrate and wafer carrier transfer.",
      gdriveFolderUrl: "https://drive.google.com/drive/folders/st-muar-cleanroom-docs",
    },
  });

  // 6. Open Action List (OAL) Items
  await prisma.actionItem.createMany({
    data: [
      {
        projectId: projProton.id,
        itemNo: "OAL-001",
        title: "Calibrate magnetic tape sensor polarity at Station 4 intersection",
        owner: "Razak / Ahmad (Intern)",
        priority: "HIGH",
        category: "HARDWARE",
        status: "DONE",
        targetDate: new Date("2026-09-02"),
        completedDate: new Date("2026-09-02"),
        notes: "Polarity verified with handheld multimeter and test run cleared.",
      },
      {
        projectId: projProton.id,
        itemNo: "OAL-002",
        title: "Deploy NavWiz 4.0 route map update for Zone B bypass",
        owner: "Kevin (Software)",
        priority: "HIGH",
        category: "SOFTWARE",
        status: "IN_PROGRESS",
        targetDate: new Date("2026-09-06"),
        notes: "Drafted path in NavWiz Studio; awaiting client approval on safety clearance.",
      },
      {
        projectId: projProton.id,
        itemNo: "OAL-003",
        title: "Test automatic battery fast-charge docking interlock with PLC",
        owner: "Chong W.K.",
        priority: "CRITICAL",
        category: "FACILITY",
        status: "OPEN",
        targetDate: new Date("2026-09-08"),
        notes: "Proton electrical team confirmed charge contact shoe delivery by Friday.",
      },
      {
        projectId: projPenang.id,
        itemNo: "OAL-001",
        title: "Resolve ARV-02 optical rail alignment deviation (+12mm)",
        owner: "Nurul Aina",
        priority: "CRITICAL",
        category: "MECHANICAL",
        status: "OPEN",
        targetDate: new Date("2026-09-07"),
        notes: "Laser guide bracket loose; scheduled mechanical realignment with customer facility.",
      },
      {
        projectId: projPerodua.id,
        itemNo: "OAL-001",
        title: "5GHz Industrial Wi-Fi signal drop investigation along Bay 3 aisle",
        owner: "Chong W.K. / Perodua IT",
        priority: "HIGH",
        category: "NETWORK",
        status: "IN_PROGRESS",
        targetDate: new Date("2026-09-10"),
        notes: "Adding 1 additional access point recommended by wireless site survey.",
      },
    ],
  });

  // 7. Issues (Issue Tracker with 5-Why & Countermeasure)
  await prisma.issue.createMany({
    data: [
      {
        issueNo: "ISS-001",
        projectId: projProton.id,
        siteId: protonJohor.id,
        robotId: protonJohorRobots[2].id, // AGV-03
        title: "AGV-03 intermittent wheel slippage on oily expansion joint",
        description: "Robot lost trajectory alignment and paused on safety warning when traversing joint J-12 near Stamping Press 3.",
        severity: "MAJOR",
        rootCauseCategory: "WHEEL_SLIPPAGE",
        fiveWhyAnalysis: "1. Why stopped? Lost magnetic guide signal. 2. Why lost signal? Drive wheel slipped laterally by 35mm. 3. Why slipped? Hydraulic oil mist film on metal floor plate. 4. Why oily? Leakage from Press 3 overhead piping. 5. Countermeasure: Installed drip tray and degreased route.",
        immediateAction: "Cleaned floor section with industrial degreaser; calibrated steering servo damping.",
        permanentCountermeasure: "Client maintenance sealed oil fitting; DF team applied high-grip polyurethane polyurethane traction sleeve.",
        status: "VALIDATING",
        loggedBy: "Razak (DF Lead)",
        assignedTo: "Razak",
      },
      {
        issueNo: "ISS-002",
        projectId: projProton.id,
        siteId: protonJohor.id,
        robotId: protonJohorRobots[7].id, // AGV-08
        title: "Safety LiDAR protective zone trigger by dangling plastic wrap",
        description: "AGV-08 triggered protective field stop near pallet staging area.",
        severity: "MODERATE",
        rootCauseCategory: "OBSTACLE_DETECT",
        fiveWhyAnalysis: "Safety LiDAR detects transparent stretch film fluttering in industrial exhaust airflow within 0.8m protective contour.",
        immediateAction: "Removed loose shrink film from aisle.",
        permanentCountermeasure: "Configured LiDAR mute zone window during staging transit and notified floor supervisors on 5S standard.",
        status: "CLOSED",
        loggedBy: "Proton Shift Supv",
        assignedTo: "Kevin",
        closedAt: new Date("2026-09-03"),
      },
      {
        issueNo: "ISS-003",
        projectId: projPenang.id,
        siteId: protonPenang.id,
        robotId: protonPenangRobots[1].id, // ARV-02
        title: "ARV-02 Cassette Transfer Height Mismatch at Station 2",
        description: "Lifter table stopped with E-Stop due to height sensor mismatch (+8mm higher than docking dock).",
        severity: "CRITICAL",
        rootCauseCategory: "PANEL_TRANSFER",
        fiveWhyAnalysis: "Proximity limit sensor bracket slipped during heavy pallet loading.",
        immediateAction: "Manual recovery mode activated, pallet disengaged.",
        permanentCountermeasure: "Replaced bracket with pinned heavy-duty mounting and recalibrated laser height datum.",
        status: "INVESTIGATING",
        loggedBy: "Chong W.K.",
        assignedTo: "Nurul Aina",
      },
      {
        issueNo: "ISS-004",
        projectId: projSTMuar.id,
        siteId: stMuarSite.id,
        robotId: stMuarRobots[0].id,
        title: "Substrate gripper failed barcode read on batch 804",
        description: "Barcode scanner failed decoding reflecting label on high-spec wafer carrier.",
        severity: "MODERATE",
        rootCauseCategory: "BARCODE_READ_FAIL",
        status: "OPEN",
        loggedBy: "ST Muar Shift Supv",
      },
    ],
  });

  // 8. Short Stop Logs (Matching the ST Muar Screenshot categories & fields!)
  const categories = [
    "Panel Transfer Stuck",
    "Wheel Slippage",
    "Cassette Stuck When Transfer",
    "Machine Issue",
    "TM (Robot Arm)",
    "Obstacle Detect",
    "Gripper Issue",
    "Barcode Read Fail",
    "Docking",
    "Panel Transfer Height Issue",
  ];

  // Populate realistic short stops for Proton Johor
  const now = new Date();
  for (let i = 0; i < 15; i++) {
    const daysAgo = Math.floor(i * 1.5);
    const stopTime = new Date(now.getTime() - daysAgo * 24 * 3600 * 1000 - (i * 45) * 60 * 1000);
    const duration = [1, 2, 5, 10, 15, 3][i % 6];
    const recTime = new Date(stopTime.getTime() + duration * 60 * 1000);
    const robot = protonJohorRobots[i % protonJohorRobots.length];
    const cat = categories[i % categories.length];

    await prisma.shortStopLog.create({
      data: {
        siteId: protonJohor.id,
        robotId: robot.id,
        category: cat,
        zone: robot.lineZone || "Zone A",
        specificLocation: `BAY-${(i % 5) + 1} TRANSFER CONVEYOR TR-0${(i % 3) + 1}`,
        startTime: stopTime,
        recoveryTime: recTime,
        durationMinutes: duration,
        resolvedBy: i % 2 === 0 ? "Operator Reset" : "Auto Resume",
        recoveryAction: i % 2 === 0 ? "Operator Reset" : "Auto Resume",
        notes: `Quick resolution; clear route and restarted cycle.`,
        createdAt: stopTime,
      },
    });
  }

  // Populate short stops for Proton Penang
  for (let i = 0; i < 6; i++) {
    const stopTime = new Date(now.getTime() - (i + 1) * 36 * 3600 * 1000);
    const duration = [2, 5, 12, 1][i % 4];
    const robot = protonPenangRobots[i % protonPenangRobots.length];

    await prisma.shortStopLog.create({
      data: {
        siteId: protonPenang.id,
        robotId: robot.id,
        category: i % 2 === 0 ? "Docking" : "Panel Transfer Height Issue",
        zone: "Zone C - High-bay Storage",
        specificLocation: `RACK-LEVEL-${(i % 3) + 1} DOCK-02`,
        startTime: stopTime,
        recoveryTime: new Date(stopTime.getTime() + duration * 60 * 1000),
        durationMinutes: duration,
        resolvedBy: "Manual Reset",
        recoveryAction: "Manual Reset",
        notes: "Docking limit switch re-engaged.",
        createdAt: stopTime,
      },
    });
  }

  // Populate short stops for ST Muar
  for (let i = 0; i < 10; i++) {
    const stopTime = new Date(now.getTime() - i * 18 * 3600 * 1000);
    const duration = [1, 5, 3, 10][i % 4];
    const robot = stMuarRobots[i % stMuarRobots.length];

    await prisma.shortStopLog.create({
      data: {
        siteId: stMuarSite.id,
        robotId: robot.id,
        category: categories[i % categories.length],
        zone: robot.lineZone || "Cleanroom Zone 1",
        specificLocation: `PIT DOCK CONSTRUCTION BHR APG BR-0${(i % 3) + 1}`,
        startTime: stopTime,
        recoveryTime: new Date(stopTime.getTime() + duration * 60 * 1000),
        durationMinutes: duration,
        resolvedBy: "Operator Reset",
        recoveryAction: "Operator Reset",
        notes: "Cleanroom standard procedure followed.",
        createdAt: stopTime,
      },
    });
  }

  // 9. Minutes of Meeting (MoM)
  await prisma.meetingMinute.create({
    data: {
      projectId: projProton.id,
      title: "Weekly Field Deployment Sync #12 - Proton & DF Automation",
      meetingDate: new Date("2026-09-02"),
      attendees: "Razak (DF Lead), Kevin (DF Software), Mr. Farhan (Proton Plant Mgr), En. Azman (Proton Maintenance)",
      agenda: "1. 10 AGV commissioning milestone review\n2. Magnetic tape maintenance schedule\n3. Safety sign-off review",
      keyDecisions: "1. Agreed to freeze route modifications after this Friday.\n2. Proton maintenance will inspect oil traps weekly to prevent floor slippage.\n3. Target SAT (Site Acceptance Test) confirmed for Oct 10.",
      driveLink: "https://drive.google.com/open?id=12345-proton-mom-week12",
    },
  });

  // 10. Daily Activity Reports (DAR)
  await prisma.dailyReport.create({
    data: {
      projectId: projProton.id,
      reportDate: new Date("2026-09-03"),
      engineerName: "Ir. Razak",
      shift: "DAY",
      activitiesDone: "• Completed AGV-01 to AGV-05 48-hour continuous loop endurance test.\n• Verified docking accuracy on Battery Charging Station 1 (tolerance within ±3mm).\n• Trained 4 floor operators on manual teach pendant controls.",
      blockers: "Minor floor unevenness at Expansion Joint 4 causing occasional low-speed vibration.",
      nextPlan: "• Commission AGV-06 through AGV-10 payload towing attachments.\n• Finalize interlock communication with Siemens S7-1500 line PLC.",
      driveLink: "https://drive.google.com/open?id=dar-proton-20260903",
    },
  });

  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
