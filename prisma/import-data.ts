import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface ExportedData {
  users: Array<Record<string, unknown>>;
  bhpProfiles: Array<Record<string, unknown>>;
  facilities: Array<Record<string, unknown>>;
  bhrfProfiles: Array<Record<string, unknown>>;
  facilityApplications: Array<Record<string, unknown>>;
  credentials: Array<Record<string, unknown>>;
  documentCategories: Array<Record<string, unknown>>;
  intakes: Array<Record<string, unknown>>;
  intakeMedications: Array<Record<string, unknown>>;
  asamAssessments: Array<Record<string, unknown>>;
  documents: Array<Record<string, unknown>>;
  documentVersions: Array<Record<string, unknown>>;
  employees: Array<Record<string, unknown>>;
  employeeDocumentTypes: Array<Record<string, unknown>>;
  employeeDocuments: Array<Record<string, unknown>>;
  messages: Array<Record<string, unknown>>;
  meetings: Array<Record<string, unknown>>;
  auditLogs: Array<Record<string, unknown>>;
}

async function importData(filename?: string) {
  const backupDir = path.join(__dirname, "backups");
  const importFile = filename || path.join(backupDir, "data-export-latest.json");

  if (!fs.existsSync(importFile)) {
    console.error(`Import file not found: ${importFile}`);
    console.log("\nAvailable backups:");
    if (fs.existsSync(backupDir)) {
      fs.readdirSync(backupDir).forEach((file) => console.log(`  - ${file}`));
    }
    process.exit(1);
  }

  console.log(`Importing data from: ${importFile}\n`);

  const data: ExportedData = JSON.parse(fs.readFileSync(importFile, "utf-8"));

  // Helper to convert date strings back to Date objects
  const parseDates = (obj: Record<string, unknown>): Record<string, unknown> => {
    const dateFields = [
      "createdAt", "updatedAt", "approvedAt", "decidedAt", "expirationDate",
      "dateOfBirth", "admissionDate", "assessmentDate", "startDate",
      "counselorSignatureDate", "bhpLphaSignatureDate", "date", "timestamp"
    ];
    const result = { ...obj };
    for (const field of dateFields) {
      if (result[field] && typeof result[field] === "string") {
        result[field] = new Date(result[field] as string);
      }
    }
    return result;
  };

  // Import in dependency order with upsert to handle existing data
  console.log("Importing users...");
  for (const user of data.users) {
    const userData = parseDates(user);
    await prisma.user.upsert({
      where: { id: userData.id as string },
      update: userData as Parameters<typeof prisma.user.update>["0"]["data"],
      create: userData as Parameters<typeof prisma.user.create>["0"]["data"],
    });
  }
  console.log(`  Imported ${data.users.length} users`);

  console.log("Importing BHP profiles...");
  for (const profile of data.bhpProfiles) {
    const profileData = parseDates(profile);
    await prisma.bHPProfile.upsert({
      where: { id: profileData.id as string },
      update: profileData as Parameters<typeof prisma.bHPProfile.update>["0"]["data"],
      create: profileData as Parameters<typeof prisma.bHPProfile.create>["0"]["data"],
    });
  }
  console.log(`  Imported ${data.bhpProfiles.length} BHP profiles`);

  console.log("Importing facilities...");
  for (const facility of data.facilities) {
    const facilityData = parseDates(facility);
    await prisma.facility.upsert({
      where: { id: facilityData.id as string },
      update: facilityData as Parameters<typeof prisma.facility.update>["0"]["data"],
      create: facilityData as Parameters<typeof prisma.facility.create>["0"]["data"],
    });
  }
  console.log(`  Imported ${data.facilities.length} facilities`);

  console.log("Importing BHRF profiles...");
  for (const profile of data.bhrfProfiles) {
    const profileData = parseDates(profile);
    await prisma.bHRFProfile.upsert({
      where: { id: profileData.id as string },
      update: profileData as Parameters<typeof prisma.bHRFProfile.update>["0"]["data"],
      create: profileData as Parameters<typeof prisma.bHRFProfile.create>["0"]["data"],
    });
  }
  console.log(`  Imported ${data.bhrfProfiles.length} BHRF profiles`);

  console.log("Importing facility applications...");
  for (const app of data.facilityApplications || []) {
    const appData = parseDates(app);
    await prisma.facilityApplication.upsert({
      where: { id: appData.id as string },
      update: appData as Parameters<typeof prisma.facilityApplication.update>["0"]["data"],
      create: appData as Parameters<typeof prisma.facilityApplication.create>["0"]["data"],
    });
  }
  console.log(`  Imported ${data.facilityApplications?.length || 0} facility applications`);

  console.log("Importing credentials...");
  for (const cred of data.credentials || []) {
    const credData = parseDates(cred);
    await prisma.credential.upsert({
      where: { id: credData.id as string },
      update: credData as Parameters<typeof prisma.credential.update>["0"]["data"],
      create: credData as Parameters<typeof prisma.credential.create>["0"]["data"],
    });
  }
  console.log(`  Imported ${data.credentials?.length || 0} credentials`);

  console.log("Importing document categories...");
  for (const cat of data.documentCategories) {
    const catData = parseDates(cat);
    await prisma.documentCategory.upsert({
      where: { id: catData.id as string },
      update: catData as Parameters<typeof prisma.documentCategory.update>["0"]["data"],
      create: catData as Parameters<typeof prisma.documentCategory.create>["0"]["data"],
    });
  }
  console.log(`  Imported ${data.documentCategories.length} document categories`);

  console.log("Importing intakes...");
  for (const intake of data.intakes) {
    const intakeData = parseDates(intake);
    await prisma.intake.upsert({
      where: { id: intakeData.id as string },
      update: intakeData as Parameters<typeof prisma.intake.update>["0"]["data"],
      create: intakeData as Parameters<typeof prisma.intake.create>["0"]["data"],
    });
  }
  console.log(`  Imported ${data.intakes.length} intakes`);

  console.log("Importing intake medications...");
  for (const med of data.intakeMedications) {
    const medData = parseDates(med);
    await prisma.intakeMedication.upsert({
      where: { id: medData.id as string },
      update: medData as Parameters<typeof prisma.intakeMedication.update>["0"]["data"],
      create: medData as Parameters<typeof prisma.intakeMedication.create>["0"]["data"],
    });
  }
  console.log(`  Imported ${data.intakeMedications.length} intake medications`);

  console.log("Importing ASAM assessments...");
  for (const asam of data.asamAssessments) {
    const asamData = parseDates(asam);
    await prisma.aSAMAssessment.upsert({
      where: { id: asamData.id as string },
      update: asamData as Parameters<typeof prisma.aSAMAssessment.update>["0"]["data"],
      create: asamData as Parameters<typeof prisma.aSAMAssessment.create>["0"]["data"],
    });
  }
  console.log(`  Imported ${data.asamAssessments.length} ASAM assessments`);

  console.log("Importing documents...");
  for (const doc of data.documents || []) {
    const docData = parseDates(doc);
    await prisma.document.upsert({
      where: { id: docData.id as string },
      update: docData as Parameters<typeof prisma.document.update>["0"]["data"],
      create: docData as Parameters<typeof prisma.document.create>["0"]["data"],
    });
  }
  console.log(`  Imported ${data.documents?.length || 0} documents`);

  console.log("Importing document versions...");
  for (const ver of data.documentVersions || []) {
    const verData = parseDates(ver);
    await prisma.documentVersion.upsert({
      where: { id: verData.id as string },
      update: verData as Parameters<typeof prisma.documentVersion.update>["0"]["data"],
      create: verData as Parameters<typeof prisma.documentVersion.create>["0"]["data"],
    });
  }
  console.log(`  Imported ${data.documentVersions?.length || 0} document versions`);

  console.log("Importing employees...");
  for (const emp of data.employees) {
    const empData = parseDates(emp);
    await prisma.employee.upsert({
      where: { id: empData.id as string },
      update: empData as Parameters<typeof prisma.employee.update>["0"]["data"],
      create: empData as Parameters<typeof prisma.employee.create>["0"]["data"],
    });
  }
  console.log(`  Imported ${data.employees.length} employees`);

  console.log("Importing employee document types...");
  for (const edt of data.employeeDocumentTypes) {
    const edtData = parseDates(edt);
    await prisma.employeeDocumentType.upsert({
      where: { id: edtData.id as string },
      update: edtData as Parameters<typeof prisma.employeeDocumentType.update>["0"]["data"],
      create: edtData as Parameters<typeof prisma.employeeDocumentType.create>["0"]["data"],
    });
  }
  console.log(`  Imported ${data.employeeDocumentTypes.length} employee document types`);

  console.log("Importing employee documents...");
  for (const ed of data.employeeDocuments) {
    const edData = parseDates(ed);
    await prisma.employeeDocument.upsert({
      where: { id: edData.id as string },
      update: edData as Parameters<typeof prisma.employeeDocument.update>["0"]["data"],
      create: edData as Parameters<typeof prisma.employeeDocument.create>["0"]["data"],
    });
  }
  console.log(`  Imported ${data.employeeDocuments.length} employee documents`);

  console.log("Importing messages...");
  for (const msg of data.messages) {
    const msgData = parseDates(msg);
    await prisma.message.upsert({
      where: { id: msgData.id as string },
      update: msgData as Parameters<typeof prisma.message.update>["0"]["data"],
      create: msgData as Parameters<typeof prisma.message.create>["0"]["data"],
    });
  }
  console.log(`  Imported ${data.messages.length} messages`);

  console.log("Importing meetings...");
  for (const meeting of data.meetings) {
    const meetingData = parseDates(meeting);
    await prisma.meeting.upsert({
      where: { id: meetingData.id as string },
      update: meetingData as Parameters<typeof prisma.meeting.update>["0"]["data"],
      create: meetingData as Parameters<typeof prisma.meeting.create>["0"]["data"],
    });
  }
  console.log(`  Imported ${data.meetings.length} meetings`);

  // Skip audit logs for now as they're historical records
  console.log(`\nSkipped ${data.auditLogs?.length || 0} audit logs (historical records)`);

  console.log("\n✓ Data import complete!");
}

// Get filename from command line args
const filename = process.argv[2];
importData(filename)
  .catch((e) => {
    console.error("Import error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
