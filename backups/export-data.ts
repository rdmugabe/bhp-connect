import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function exportAllData() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, `backup_${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });

  console.log(`Exporting data to ${backupDir}...`);

  // Export all tables
  const tables = [
    { name: 'users', query: () => prisma.user.findMany() },
    { name: 'facilities', query: () => prisma.facility.findMany() },
    { name: 'bhpProfiles', query: () => prisma.bHPProfile.findMany() },
    { name: 'bhrfProfiles', query: () => prisma.bHRFProfile.findMany() },
    { name: 'intakes', query: () => prisma.intake.findMany() },
    { name: 'documents', query: () => prisma.document.findMany() },
    { name: 'incidentReports', query: () => prisma.incidentReport.findMany() },
    { name: 'dischargeSummaries', query: () => prisma.dischargeSummary.findMany() },
    { name: 'medicationOrders', query: () => prisma.medicationOrder.findMany() },
    { name: 'medicationSchedules', query: () => prisma.medicationSchedule.findMany() },
    { name: 'medicationAdministrations', query: () => prisma.medicationAdministration.findMany() },
    { name: 'medicationAlerts', query: () => prisma.medicationAlert.findMany() },
    { name: 'progressNotes', query: () => prisma.progressNote.findMany() },
    { name: 'artMeetings', query: () => prisma.aRTMeeting.findMany() },
    { name: 'meetings', query: () => prisma.meeting.findMany() },
    { name: 'messages', query: () => prisma.message.findMany() },
    { name: 'employees', query: () => prisma.employee.findMany() },
    { name: 'employeeDocuments', query: () => prisma.employeeDocument.findMany() },
    { name: 'employeeDocumentTypes', query: () => prisma.employeeDocumentType.findMany() },
    { name: 'fireDrillReports', query: () => prisma.fireDrillReport.findMany() },
    { name: 'evacuationDrillReports', query: () => prisma.evacuationDrillReport.findMany() },
    { name: 'oversightTrainingReports', query: () => prisma.oversightTrainingReport.findMany() },
    { name: 'calendarEvents', query: () => prisma.calendarEvent.findMany() },
    { name: 'calendarReminders', query: () => prisma.calendarReminder.findMany() },
    { name: 'auditLogs', query: () => prisma.auditLog.findMany() },
    { name: 'documentCategories', query: () => prisma.documentCategory.findMany() },
  ];

  for (const table of tables) {
    try {
      console.log(`Exporting ${table.name}...`);
      const data = await table.query();
      const filePath = path.join(backupDir, `${table.name}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`  ✓ ${table.name}: ${data.length} records`);
    } catch (error) {
      console.error(`  ✗ ${table.name}: ${error}`);
    }
  }

  console.log(`\nBackup complete! Files saved to: ${backupDir}`);
}

exportAllData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
