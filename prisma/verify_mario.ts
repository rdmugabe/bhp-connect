import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const m = await prisma.aRTMeeting.findUnique({ where: { id: 'cmo7t1fm40001tnco2lgqbs4u' } });
  if (!m) return console.log('NOT FOUND');
  const fields = ['resolutions','strengths','barriers','whatHasWorked','whatHasNotWorked','goals','concreteSteps','progressIndicators','medicalIssues','plan','summary'];
  for (const f of fields) {
    const v = (m as any)[f] || '';
    console.log(`\n=== ${f} (${v.length} chars) ===\n${v.slice(0, 200)}${v.length > 200 ? '…' : ''}`);
  }
}
main().finally(() => prisma.$disconnect());
