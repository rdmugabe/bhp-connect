import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
  const intake = await prisma.intake.findFirst({
    where: { residentName: "Maria Hernandez" },
    include: {
      facility: true,
      asamAssessments: true
    }
  });

  if (!intake) {
    console.log("ERROR: Maria Hernandez intake NOT FOUND");
    return;
  }

  console.log("=== Maria Hernandez Record ===");
  console.log("Intake ID:", intake.id);
  console.log("Facility:", intake.facility.name, "(ID:", intake.facilityId + ")");
  console.log("Status:", intake.status);
  console.log("Created:", intake.createdAt);
  console.log("ASAM Count:", intake.asamAssessments.length);

  // Check all intakes for this facility
  const allIntakes = await prisma.intake.findMany({
    where: { facilityId: intake.facilityId },
    select: { id: true, residentName: true, status: true }
  });

  console.log("\n=== All Intakes for", intake.facility.name, "===");
  allIntakes.forEach(i => {
    console.log("-", i.residentName, "| Status:", i.status, "| ID:", i.id);
  });

  await prisma.$disconnect();
}

check();
