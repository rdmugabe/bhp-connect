import { prisma } from "@/lib/prisma";
import { buildProgressNoteDocx } from "@/lib/progress-notes-docx";
import JSZip from "jszip";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const start = new Date("2026-09-13T00:00:00.000Z");
  const end = new Date("2026-09-19T23:59:59.999Z");

  const notes = await prisma.progressNote.findMany({
    where: {
      noteDate: { gte: start, lte: end },
      archivedAt: null,
    },
    include: {
      facility: true,
      intake: { select: { residentName: true, dateOfBirth: true, policyNumber: true } },
    },
    orderBy: [{ noteDate: "asc" }, { shift: "asc" }],
  });

  console.log(`Found ${notes.length} notes`);

  const zip = new JSZip();
  for (const n of notes) {
    const buf = await buildProgressNoteDocx({
      residentName: n.intake.residentName,
      dateOfBirth: n.intake.dateOfBirth,
      ahcccsId: n.intake.policyNumber,
      facilityName: n.facility.name,
      noteDate: n.noteDate,
      shift: n.shift,
      authorName: n.authorName,
      authorTitle: n.authorTitle,
      status: n.status,
      residentStatus: n.residentStatus,
      observedBehaviors: n.observedBehaviors,
      moodAffect: n.moodAffect,
      activityParticipation: n.activityParticipation,
      staffInteractions: n.staffInteractions,
      peerInteractions: n.peerInteractions,
      medicationCompliance: n.medicationCompliance,
      hygieneAdl: n.hygieneAdl,
      mealsAppetite: n.mealsAppetite,
      sleepPattern: n.sleepPattern,
      staffInterventions: n.staffInterventions,
      residentResponse: n.residentResponse,
      notableEvents: n.notableEvents,
      additionalNotes: n.additionalNotes,
      bhtSignature: n.bhtSignature,
      bhtCredentials: n.bhtCredentials,
      bhtSignatureDate: n.bhtSignatureDate,
    });
    const dateStr = n.noteDate.toISOString().slice(0, 10);
    const shortName = `${dateStr}_${n.shift || "SHIFT"}.docx`;
    zip.file(`${n.intake.residentName}/${shortName}`, buf);
  }

  const out = await zip.generateAsync({ type: "nodebuffer" });
  const outPath = path.join(process.env.HOME || "", "Downloads", "progress-notes_2026-09-13_to_2026-09-19.zip");
  fs.writeFileSync(outPath, out);
  console.log(`Wrote ${outPath} (${out.length} bytes)`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
