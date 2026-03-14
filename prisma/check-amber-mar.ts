import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const intake = await prisma.intake.findFirst({
    where: {
      residentName: { contains: 'Amber', mode: 'insensitive' }
    },
    select: { id: true, residentName: true }
  });

  if (!intake) {
    console.log('Intake not found');
    return;
  }

  console.log('Patient:', intake.residentName, 'ID:', intake.id);

  const startDate = new Date('2026-03-11T00:00:00');
  const endDate = new Date('2026-03-11T23:59:59');

  const administrations = await prisma.medicationAdministration.findMany({
    where: {
      medicationOrder: { intakeId: intake.id },
      administeredAt: { gte: startDate, lte: endDate },
    },
    include: {
      medicationOrder: { select: { medicationName: true, scheduleTimes: true, isPRN: true } },
      schedule: true,
    },
    orderBy: { administeredAt: 'asc' }
  });

  console.log('\nAdministrations on March 11:', administrations.length);
  for (const a of administrations) {
    console.log('- ' + a.medicationOrder.medicationName + ': ' + a.status);
    console.log('  Administered at:', a.administeredAt.toISOString());
    console.log('  Schedule times:', a.medicationOrder.scheduleTimes);
    if (a.schedule) {
      console.log('  Schedule ID:', a.schedule.id);
      console.log('  Scheduled time:', a.schedule.scheduledTime);
    }
    if (a.refusedReason) console.log('  Refused Reason:', a.refusedReason);
  }

  const schedules = await prisma.medicationSchedule.findMany({
    where: {
      medicationOrder: { intakeId: intake.id },
      scheduledDateTime: { gte: startDate, lte: endDate },
    },
    include: {
      medicationOrder: { select: { medicationName: true, scheduleTimes: true } },
      administration: true,
    },
    orderBy: { scheduledDateTime: 'asc' }
  });

  console.log('\nSchedules on March 11:', schedules.length);
  for (const s of schedules) {
    const adminStatus = s.administration ? s.administration.status : 'No admin record';
    console.log('- ' + s.medicationOrder.medicationName);
    console.log('  Scheduled time:', s.scheduledTime);
    console.log('  Scheduled DateTime:', s.scheduledDateTime.toISOString());
    console.log('  Schedule Status:', s.status);
    console.log('  Administration:', adminStatus);
    if (s.administration) {
      console.log('  Admin time:', s.administration.administeredAt.toISOString());
    }
  }

  await prisma.$disconnect();
}

check().catch(e => { console.error(e); process.exit(1); });
