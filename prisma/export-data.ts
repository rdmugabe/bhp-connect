import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function exportData() {
  console.log("Exporting database data...\n");

  const data: Record<string, unknown[]> = {};

  // Export all tables in dependency order
  data.users = await prisma.user.findMany();
  console.log(`Exported ${data.users.length} users`);

  data.bhpProfiles = await prisma.bHPProfile.findMany();
  console.log(`Exported ${data.bhpProfiles.length} BHP profiles`);

  data.facilities = await prisma.facility.findMany();
  console.log(`Exported ${data.facilities.length} facilities`);

  data.bhrfProfiles = await prisma.bHRFProfile.findMany();
  console.log(`Exported ${data.bhrfProfiles.length} BHRF profiles`);

  data.facilityApplications = await prisma.facilityApplication.findMany();
  console.log(`Exported ${data.facilityApplications.length} facility applications`);

  data.facilityInvitations = await prisma.facilityInvitation.findMany();
  console.log(`Exported ${data.facilityInvitations.length} facility invitations`);

  data.credentials = await prisma.credential.findMany();
  console.log(`Exported ${data.credentials.length} credentials`);

  data.documentCategories = await prisma.documentCategory.findMany();
  console.log(`Exported ${data.documentCategories.length} document categories`);

  data.intakes = await prisma.intake.findMany();
  console.log(`Exported ${data.intakes.length} intakes`);

  data.intakeMedications = await prisma.intakeMedication.findMany();
  console.log(`Exported ${data.intakeMedications.length} intake medications`);

  data.asamAssessments = await prisma.aSAMAssessment.findMany();
  console.log(`Exported ${data.asamAssessments.length} ASAM assessments`);

  data.documents = await prisma.document.findMany();
  console.log(`Exported ${data.documents.length} documents`);

  data.documentVersions = await prisma.documentVersion.findMany();
  console.log(`Exported ${data.documentVersions.length} document versions`);

  data.employees = await prisma.employee.findMany();
  console.log(`Exported ${data.employees.length} employees`);

  data.employeeDocumentTypes = await prisma.employeeDocumentType.findMany();
  console.log(`Exported ${data.employeeDocumentTypes.length} employee document types`);

  data.employeeDocuments = await prisma.employeeDocument.findMany();
  console.log(`Exported ${data.employeeDocuments.length} employee documents`);

  data.messages = await prisma.message.findMany();
  console.log(`Exported ${data.messages.length} messages`);

  data.meetings = await prisma.meeting.findMany();
  console.log(`Exported ${data.meetings.length} meetings`);

  data.fireDrillReports = await prisma.fireDrillReport.findMany();
  console.log(`Exported ${data.fireDrillReports.length} fire drill reports`);

  data.evacuationDrillReports = await prisma.evacuationDrillReport.findMany();
  console.log(`Exported ${data.evacuationDrillReports.length} evacuation drill reports`);

  data.oversightTrainingReports = await prisma.oversightTrainingReport.findMany();
  console.log(`Exported ${data.oversightTrainingReports.length} oversight training reports`);

  data.artMeetings = await prisma.aRTMeeting.findMany();
  console.log(`Exported ${data.artMeetings.length} ART meetings`);

  data.dischargeSummaries = await prisma.dischargeSummary.findMany();
  console.log(`Exported ${data.dischargeSummaries.length} discharge summaries`);

  data.incidentReports = await prisma.incidentReport.findMany();
  console.log(`Exported ${data.incidentReports.length} incident reports`);

  data.medicationOrders = await prisma.medicationOrder.findMany();
  console.log(`Exported ${data.medicationOrders.length} medication orders`);

  data.medicationSchedules = await prisma.medicationSchedule.findMany();
  console.log(`Exported ${data.medicationSchedules.length} medication schedules`);

  data.medicationAdministrations = await prisma.medicationAdministration.findMany();
  console.log(`Exported ${data.medicationAdministrations.length} medication administrations`);

  data.medicationAlerts = await prisma.medicationAlert.findMany();
  console.log(`Exported ${data.medicationAlerts.length} medication alerts`);

  data.progressNotes = await prisma.progressNote.findMany();
  console.log(`Exported ${data.progressNotes.length} progress notes`);

  data.calendarEvents = await prisma.calendarEvent.findMany();
  console.log(`Exported ${data.calendarEvents.length} calendar events`);

  data.calendarReminders = await prisma.calendarReminder.findMany();
  console.log(`Exported ${data.calendarReminders.length} calendar reminders`);

  data.auditLogs = await prisma.auditLog.findMany();
  console.log(`Exported ${data.auditLogs.length} audit logs`);

  // Create backups directory if it doesn't exist
  const backupDir = path.join(__dirname, "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Write to file with timestamp
  const now = new Date();
  const timestamp = `${now.toISOString().split("T")[0]}-${now.toTimeString().slice(0, 8).replace(/:/g, "")}`;
  const filename = path.join(backupDir, `data-export-${timestamp}.json`);

  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
  console.log(`\nData exported to: ${filename}`);

  // Also create a "latest" symlink/copy for easy access
  const latestFile = path.join(backupDir, "data-export-latest.json");
  fs.writeFileSync(latestFile, JSON.stringify(data, null, 2));
  console.log(`Latest backup: ${latestFile}`);
}

exportData()
  .catch((e) => {
    console.error("Export error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
