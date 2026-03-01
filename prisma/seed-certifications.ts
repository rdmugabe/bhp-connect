import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const requiredCertifications = [
  {
    id: "sys_cpr_cert",
    name: "CPR Certification",
    description:
      "Current CPR certification from an approved provider (American Heart Association, Red Cross, etc.)",
    expirationRequired: true,
    expirationMonths: 24,
    isDefault: true,
    isRequired: true,
    isActive: true,
  },
  {
    id: "sys_first_aid",
    name: "First Aid Certification",
    description: "Current First Aid certification from an approved provider",
    expirationRequired: true,
    expirationMonths: 24,
    isDefault: true,
    isRequired: true,
    isActive: true,
  },
  {
    id: "sys_fingerprint",
    name: "Fingerprint Clearance Card",
    description: "Valid Arizona DPS Fingerprint Clearance Card",
    expirationRequired: true,
    expirationMonths: 72, // 6 years
    isDefault: true,
    isRequired: true,
    isActive: true,
  },
  {
    id: "sys_tb_test",
    name: "TB Test Results",
    description:
      "Current tuberculosis test results (Mantoux skin test or written statement from medical practitioner)",
    expirationRequired: true,
    expirationMonths: 12,
    isDefault: true,
    isRequired: true,
    isActive: true,
  },
  {
    id: "sys_tb_training",
    name: "TB Training Documentation",
    description: "Tuberculosis infection control training documentation",
    expirationRequired: true,
    expirationMonths: 12,
    isDefault: true,
    isRequired: true,
    isActive: true,
  },
  {
    id: "sys_fall_prevention",
    name: "Fall Prevention Training",
    description: "Fall prevention and recovery training documentation",
    expirationRequired: true,
    expirationMonths: 12,
    isDefault: true,
    isRequired: true,
    isActive: true,
  },
];

async function main() {
  console.log("Seeding required employee certifications...");

  for (const cert of requiredCertifications) {
    await prisma.employeeDocumentType.upsert({
      where: { id: cert.id },
      update: {
        name: cert.name,
        description: cert.description,
        expirationRequired: cert.expirationRequired,
        expirationMonths: cert.expirationMonths,
        isDefault: cert.isDefault,
        isRequired: cert.isRequired,
        isActive: cert.isActive,
      },
      create: cert,
    });
    console.log(`  ✓ ${cert.name}`);
  }

  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
