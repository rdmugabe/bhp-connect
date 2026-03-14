import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
  const orders = await prisma.medicationOrder.count();
  const schedules = await prisma.medicationSchedule.count();
  const patients = await prisma.intake.count();

  console.log("=== eMAR Data Status ===");
  console.log("Medication Orders:", orders);
  console.log("Medication Schedules:", schedules);
  console.log("Total Patients:", patients);

  if (orders > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySchedules = await prisma.medicationSchedule.count({
      where: {
        scheduledDate: {
          gte: today,
          lt: tomorrow,
        },
      },
    });
    console.log("Today's Schedules:", todaySchedules);
  } else {
    console.log("\nNo medication orders exist yet.");
    console.log("To get started:");
    console.log("1. Go to eMAR → Patients");
    console.log("2. Select a patient");
    console.log("3. Click 'Add Medication Order'");
    console.log("4. Fill in medication details");
    console.log("5. Schedules will be auto-generated");
  }

  await prisma.$disconnect();
}

check().catch(console.error);
