import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const asam = await prisma.aSAMAssessment.findUnique({
    where: { id: "cmme7cbit0007vpm8hbk67hk9" },
  });

  if (!asam) {
    console.log("No ASAM found");
    return;
  }

  console.log("Current summaryRationale:", typeof asam.summaryRationale, asam.summaryRationale);
  console.log("Current levelOfCareDetermination:", typeof asam.levelOfCareDetermination, asam.levelOfCareDetermination);

  // Fix these JSON fields to be proper objects
  const updated = await prisma.aSAMAssessment.update({
    where: { id: asam.id },
    data: {
      summaryRationale: {
        dimension1Rationale: "Severe - 40+ year history of severe alcohol use disorder with chronic heavy use",
        dimension2Rationale: "Mild - No acute medical concerns requiring intensive intervention",
        dimension3Rationale: "Severe - Significant co-occurring PTSD, depression, anxiety, and insomnia",
        dimension4Rationale: "Mild - High motivation and willingness to engage in treatment",
        dimension5Rationale: "Very Severe - High relapse risk due to persistent cravings and limited coping skills",
        dimension6Rationale: "Very Severe - Homeless, no support system, unemployed, socially isolated",
      },
      levelOfCareDetermination: {
        withdrawalManagement: "None required - no current withdrawal symptoms",
        treatmentServices: "3.1 - Clinically Managed Low-Intensity Residential Services",
        otp: false,
      },
    },
  });

  console.log("\nUpdated summaryRationale:", updated.summaryRationale);
  console.log("Updated levelOfCareDetermination:", updated.levelOfCareDetermination);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
