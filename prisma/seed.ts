import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create BHP user
  const bhpPassword = await bcrypt.hash("password123", 10);
  const bhpUser = await prisma.user.upsert({
    where: { email: "bhp@lucidbehavioral.com" },
    update: {},
    create: {
      email: "bhp@lucidbehavioral.com",
      name: "Lucid BHP Admin",
      passwordHash: bhpPassword,
      role: "BHP",
      approvalStatus: "APPROVED",
    },
  });
  console.log("Created BHP user:", bhpUser.email);

  // Create BHP profile
  const bhpProfile = await prisma.bHPProfile.upsert({
    where: { userId: bhpUser.id },
    update: {},
    create: {
      userId: bhpUser.id,
      phone: "(602) 555-0100",
      address: "123 Main Street, Phoenix, AZ 85001",
      bio: "Lucid Behavioral Health Provider",
    },
  });
  console.log("Created BHP profile");

  // Create Facility
  const facility = await prisma.facility.upsert({
    where: { id: "lucid-behavioral-health" },
    update: {},
    create: {
      id: "lucid-behavioral-health",
      name: "Lucid Behavioral Health",
      address: "123 Main Street, Phoenix, AZ 85001",
      phone: "(602) 555-0123",
      bhpId: bhpProfile.id,
    },
  });
  console.log("Created facility:", facility.name);

  // Create BHRF user
  const bhrfPassword = await bcrypt.hash("password123", 10);
  const bhrfUser = await prisma.user.upsert({
    where: { email: "facility@lucidbehavioral.com" },
    update: {},
    create: {
      email: "facility@lucidbehavioral.com",
      name: "Lucid Facility Admin",
      passwordHash: bhrfPassword,
      role: "BHRF",
      approvalStatus: "APPROVED",
    },
  });
  console.log("Created BHRF user:", bhrfUser.email);

  // Create BHRF profile
  const bhrfProfile = await prisma.bHRFProfile.upsert({
    where: { userId: bhrfUser.id },
    update: {},
    create: {
      userId: bhrfUser.id,
      facilityId: facility.id,
    },
  });
  console.log("Created BHRF profile linked to facility");

  // Create Admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@bhpconnect.com" },
    update: {},
    create: {
      email: "admin@bhpconnect.com",
      name: "System Admin",
      passwordHash: adminPassword,
      role: "ADMIN",
      approvalStatus: "APPROVED",
    },
  });
  console.log("Created Admin user:", adminUser.email);

  console.log("\n✅ Seeding complete!");
  console.log("\nTest accounts:");
  console.log("  BHP:      bhp@lucidbehavioral.com / password123");
  console.log("  BHRF:     facility@lucidbehavioral.com / password123");
  console.log("  Admin:    admin@bhpconnect.com / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
