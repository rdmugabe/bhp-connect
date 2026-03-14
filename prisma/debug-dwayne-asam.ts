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
  const assessment = await prisma.aSAMAssessment.findUnique({
    where: { id: "cmme7cbit0007vpm8hbk67hk9" },
  });

  if (!assessment) {
    console.log("No ASAM found");
    return;
  }

  // Simulate the transformation done in the edit page
  const initialData = Object.fromEntries(
    Object.entries(assessment).map(([key, value]) => [
      key,
      value === null ? undefined :
      value instanceof Date ? value.toISOString().split("T")[0] :
      value
    ])
  );

  console.log("=== Data as it would be passed to the form ===\n");

  // Check Step 8 fields specifically
  const step8Fields = [
    'recommendedLevelOfCare',
    'levelOfCareProvided',
    'discrepancyReason',
    'discrepancyExplanation',
    'designatedTreatmentLocation',
    'designatedProviderName',
    'counselorName',
    'counselorSignatureDate',
    'bhpLphaName',
    'bhpLphaSignatureDate',
    'dsm5Diagnoses',
    'matInterested',
    'matDetails',
  ];

  console.log("Step 8 Summary Fields:");
  step8Fields.forEach(field => {
    const value = initialData[field];
    const displayValue = value === undefined ? "(undefined)" :
                         value === null ? "(null)" :
                         value === "" ? "(empty string)" :
                         typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + "..." :
                         String(value);
    console.log(`  ${field}: ${displayValue}`);
  });

  console.log("\nDimension Severities:");
  for (let i = 1; i <= 6; i++) {
    const field = `dimension${i}Severity`;
    console.log(`  ${field}: ${initialData[field] ?? "(not set)"}`);
  }
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
