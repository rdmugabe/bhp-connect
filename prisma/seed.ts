import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultDocumentTypes = [
  { name: "Clearance Card", expirationRequired: true },
  { name: "CPR & First Aid", expirationRequired: true },
  { name: "TB Test", expirationRequired: true },
  { name: "Fall Prevention Training", expirationRequired: true },
  { name: "TB Training", expirationRequired: true },
];

async function main() {
  console.log("Seeding default employee document types...");

  for (const docType of defaultDocumentTypes) {
    // Check if default document type exists (where facilityId is null)
    const existing = await prisma.employeeDocumentType.findFirst({
      where: {
        name: docType.name,
        facilityId: null,
        isDefault: true,
      },
    });

    if (!existing) {
      await prisma.employeeDocumentType.create({
        data: {
          name: docType.name,
          expirationRequired: docType.expirationRequired,
          isDefault: true,
          facilityId: null,
        },
      });
      console.log(`  Created: ${docType.name}`);
    } else {
      console.log(`  Already exists: ${docType.name}`);
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
