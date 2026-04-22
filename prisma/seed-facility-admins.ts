/**
 * One-off migration: for each Facility, promote the earliest-created BHRFProfile
 * to isFacilityAdmin = true so existing facilities have at least one admin who
 * can manage staff logins.
 *
 * Safe to run multiple times — skips facilities that already have an admin.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const facilities = await prisma.facility.findMany({
    select: { id: true, name: true },
  });

  let promoted = 0;
  let alreadyAdmin = 0;
  let noStaff = 0;

  for (const facility of facilities) {
    const existingAdmin = await prisma.bHRFProfile.findFirst({
      where: { facilityId: facility.id, isFacilityAdmin: true },
    });

    if (existingAdmin) {
      alreadyAdmin++;
      continue;
    }

    // Earliest-created BHRFProfile at this facility (by the user's createdAt)
    const earliest = await prisma.bHRFProfile.findFirst({
      where: { facilityId: facility.id },
      include: { user: { select: { name: true, email: true, createdAt: true } } },
      orderBy: { user: { createdAt: "asc" } },
    });

    if (!earliest) {
      console.log(`  [skip] ${facility.name}: no BHRF staff`);
      noStaff++;
      continue;
    }

    await prisma.bHRFProfile.update({
      where: { id: earliest.id },
      data: { isFacilityAdmin: true },
    });

    console.log(
      `  [promoted] ${facility.name}: ${earliest.user.name} (${earliest.user.email})`
    );
    promoted++;
  }

  console.log(
    `\nDone. Promoted ${promoted}, already had admin ${alreadyAdmin}, no staff ${noStaff}.`
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
