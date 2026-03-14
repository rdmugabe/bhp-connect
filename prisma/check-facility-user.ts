import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
  // Get facility user
  const facilityUser = await prisma.user.findFirst({
    where: { email: "facility@lucidbehavioral.com" },
    include: {
      bhrfProfile: {
        include: { facility: true }
      }
    }
  });

  console.log("=== Facility User ===");
  console.log("Email:", facilityUser?.email);
  console.log("User ID:", facilityUser?.id);
  console.log("BHRF Profile Facility ID:", facilityUser?.bhrfProfile?.facilityId);
  console.log("Facility Name:", facilityUser?.bhrfProfile?.facility?.name);

  // Get Maria's intake
  const maria = await prisma.intake.findFirst({
    where: { residentName: "Maria Hernandez" },
    include: { facility: true }
  });

  console.log("\n=== Maria's Intake ===");
  console.log("Facility ID:", maria?.facilityId);
  console.log("Facility Name:", maria?.facility?.name);

  // Compare
  console.log("\n=== Match Check ===");
  if (facilityUser?.bhrfProfile?.facilityId === maria?.facilityId) {
    console.log("MATCH: User and Maria are in the same facility");
  } else {
    console.log("MISMATCH: User facility:", facilityUser?.bhrfProfile?.facilityId);
    console.log("MISMATCH: Maria facility:", maria?.facilityId);
  }

  // Count all approved intakes for user's facility
  const approvedIntakes = await prisma.intake.findMany({
    where: {
      facilityId: facilityUser?.bhrfProfile?.facilityId,
      status: "APPROVED",
      dischargedAt: null
    },
    select: { id: true, residentName: true, status: true }
  });

  console.log("\n=== Approved Intakes (not discharged) for user's facility ===");
  approvedIntakes.forEach(i => {
    console.log("-", i.residentName, "| ID:", i.id);
  });

  await prisma.$disconnect();
}

check();
