import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const intakes = await prisma.intake.findMany({
    where: { residentName: { contains: 'Mario', mode: 'insensitive' } },
    select: { id: true, residentName: true, facilityId: true, dateOfBirth: true, admissionDate: true,
              facility: { select: { name: true } } }
  });
  console.log('INTAKES:', JSON.stringify(intakes, null, 2));
  for (const i of intakes) {
    const meetings = await prisma.aRTMeeting.findMany({
      where: { intakeId: i.id },
      orderBy: [{ meetingYear: 'desc' }, { meetingMonth: 'desc' }]
    });
    console.log(`\nMEETINGS for ${i.residentName}:`, JSON.stringify(meetings, null, 2));
  }
}
main().finally(() => prisma.$disconnect());
