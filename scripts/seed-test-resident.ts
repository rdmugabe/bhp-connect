import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Get the first facility with its BHRF user
  const bhrfProfile = await prisma.bHRFProfile.findFirst({
    include: {
      facility: true,
      user: true
    }
  });

  if (!bhrfProfile) {
    console.log("No BHRF profile found");
    return;
  }

  console.log("Using facility:", bhrfProfile.facility.name);
  console.log("Using user:", bhrfProfile.user.email);

  // Create a test intake (resident) with APPROVED status
  const intake = await prisma.intake.create({
    data: {
      facilityId: bhrfProfile.facilityId,
      residentName: "Test Resident for Discharge",
      dateOfBirth: new Date("1985-06-15"),
      admissionDate: new Date("2025-01-15"),
      ssn: "1234",
      sex: "Male",
      ethnicity: "Not Hispanic/Latino",
      language: "English",
      religion: "None",
      patientPhone: "555-123-4567",
      patientEmail: "test.resident@example.com",
      patientAddress: "123 Test Street, Phoenix, AZ 85001",
      insuranceProvider: "AHCCCS",
      policyNumber: "AHC123456789",
      ahcccsHealthPlan: "Mercy Care",
      emergencyContactName: "Jane Doe",
      emergencyContactPhone: "555-987-6543",
      emergencyContactRelationship: "Spouse",
      referralSource: "Hospital Discharge",
      diagnosis: "Major Depressive Disorder, Generalized Anxiety Disorder",
      treatmentRecommendation: "Residential treatment with individual and group therapy",
      status: "APPROVED",
      decidedAt: new Date(),
      submittedBy: bhrfProfile.userId,
    },
  });

  console.log("Created test resident:", intake.id, "-", intake.residentName);
  console.log("You can now view this resident at: /facility/residents/" + intake.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
