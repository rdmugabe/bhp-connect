import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find Dwayne's intake
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

  // Find the ASAM assessment
  const asam = await prisma.aSAMAssessment.findFirst({
    where: { intakeId: intake.id },
  });

  if (!asam) {
    console.log("No ASAM found");
    return;
  }

  console.log("Found ASAM:", asam.id);
  console.log("\nCurrent values:");
  console.log("- recommendedLevelOfCare:", asam.recommendedLevelOfCare || "(empty)");
  console.log("- levelOfCareProvided:", asam.levelOfCareProvided || "(empty)");

  // Update ALL missing fields for submission
  const updated = await prisma.aSAMAssessment.update({
    where: { id: asam.id },
    data: {
      // Level of Care fields - FORCE update these
      recommendedLevelOfCare: "3.1",
      levelOfCareProvided: "3.1",
      discrepancyReason: "Not Applicable",

      // Designated location/provider
      designatedTreatmentLocation: "ASAM Level 3.1 - Clinically Managed Low-Intensity Residential Services (Behavioral Health Residential Facility)",
      designatedProviderName: "Lucid Behavioral Health",

      // Signature fields
      counselorName: "Adebukola Aladesanmi, DNP, PMHNP-BC",
      counselorSignatureDate: new Date("2026-02-23"),
    },
  });

  console.log("\nUpdated ASAM assessment:");
  console.log("- recommendedLevelOfCare:", updated.recommendedLevelOfCare);
  console.log("- levelOfCareProvided:", updated.levelOfCareProvided);
  console.log("- discrepancyReason:", updated.discrepancyReason);
  console.log("- designatedTreatmentLocation:", updated.designatedTreatmentLocation?.substring(0, 50) + "...");
  console.log("- designatedProviderName:", updated.designatedProviderName);
  console.log("- counselorName:", updated.counselorName);
  console.log("- counselorSignatureDate:", updated.counselorSignatureDate);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
