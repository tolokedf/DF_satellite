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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
