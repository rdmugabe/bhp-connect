import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function backfillOversightDocuments() {
  console.log("Starting backfill of oversight training documents...\n");

  // Find all oversight training reports without a linked document
  const reportsWithoutDocuments = await prisma.oversightTrainingReport.findMany({
    where: {
      documentId: null,
    },
    include: {
      facility: true,
    },
  });

  console.log(`Found ${reportsWithoutDocuments.length} oversight training reports without linked documents.\n`);

  if (reportsWithoutDocuments.length === 0) {
    console.log("No reports to backfill. Exiting.");
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const report of reportsWithoutDocuments) {
    try {
      // Create Document record and link it to the report in a transaction
      await prisma.$transaction(async (tx) => {
        // Create Document record
        const document = await tx.document.create({
          data: {
            facilityId: report.facilityId,
            name: `Oversight Training - Bi-Week ${report.biWeek}, ${report.year}`,
            type: "Oversight Training",
            fileUrl: report.documentUrl,
            ownerType: "FACILITY",
            status: "UPLOADED",
            uploadedBy: report.submittedBy,
            uploadedAt: report.createdAt,
          },
        });

        // Link document to oversight training report
        await tx.oversightTrainingReport.update({
          where: { id: report.id },
          data: { documentId: document.id },
        });

        console.log(`✓ Backfilled: ${report.facility.name} - Bi-Week ${report.biWeek}, ${report.year}`);
      });

      successCount++;
    } catch (error) {
      console.error(`✗ Error backfilling report ${report.id}:`, error);
      errorCount++;
    }
  }

  console.log("\n--- Backfill Complete ---");
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
}

backfillOversightDocuments()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
