import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find Dwayne's ASAM assessment
  const intake = await prisma.intake.findFirst({
    where: {
      OR: [
        { residentName: { contains: "Dwayne", mode: "insensitive" } },
        { residentName: { contains: "Hunt", mode: "insensitive" } },
      ],
    },
  });

  if (!intake) {
    console.log("No intake found");
    return;
  }

  const asam = await prisma.aSAMAssessment.findFirst({
    where: { intakeId: intake.id },
  });

  if (!asam) {
    console.log("No ASAM found");
    return;
  }

  console.log("=== ASAM Assessment for Dwayne ===\n");

  // Check required fields
  console.log("--- Required Fields (Step 1) ---");
  console.log("patientName:", asam.patientName || "MISSING!");
  console.log("dateOfBirth:", asam.dateOfBirth || "MISSING!");

  console.log("\n--- Step 8 Summary Fields ---");
  console.log("recommendedLevelOfCare:", asam.recommendedLevelOfCare || "(empty)");
  console.log("levelOfCareProvided:", asam.levelOfCareProvided || "(empty)");
  console.log("discrepancyReason:", asam.discrepancyReason || "(empty)");
  console.log("counselorName:", asam.counselorName || "(empty)");
  console.log("counselorSignatureDate:", asam.counselorSignatureDate || "(empty)");
  console.log("dsm5Diagnoses:", asam.dsm5Diagnoses ? "has content" : "(empty)");

  console.log("\n--- Dimension Severity Ratings ---");
  console.log("dimension1Severity:", asam.dimension1Severity ?? "NOT SET");
  console.log("dimension2Severity:", asam.dimension2Severity ?? "NOT SET");
  console.log("dimension3Severity:", asam.dimension3Severity ?? "NOT SET");
  console.log("dimension4Severity:", asam.dimension4Severity ?? "NOT SET");
  console.log("dimension5Severity:", asam.dimension5Severity ?? "NOT SET");
  console.log("dimension6Severity:", asam.dimension6Severity ?? "NOT SET");

  console.log("\n--- Key Content Fields ---");
  console.log("reasonForTreatment:", asam.reasonForTreatment ? "has content" : "(empty)");
  console.log("currentSymptoms:", asam.currentSymptoms ? "has content" : "(empty)");
  console.log("substanceUseHistory:", asam.substanceUseHistory ? "has content" : "(empty)");
  console.log("traumaticEvents:", asam.traumaticEvents ? "has content" : "(empty)");

  console.log("\n--- Status ---");
  console.log("status:", asam.status);
  console.log("draftStep:", asam.draftStep);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
