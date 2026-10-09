/**
 * Backfill progress notes for a date range.
 *
 * Idempotent: existing (intakeId, noteDate, shift) tuples are skipped.
 * Signature defaults come from ShiftStaffing when configured, otherwise
 * from the fallback below.
 */

import { prisma } from "@/lib/prisma";
import { buildVariedContent, pronounsFromSex, type Phase } from "@/lib/progress-notes-generator";
import { getStaffingForDate } from "@/lib/staffing";

const START = new Date("2026-09-30T00:00:00.000Z");
const END = new Date("2026-10-09T00:00:00.000Z");
const SEED_VERSION = "v7-backfill-9-30-to-10-09";

// Signature fallback used only when no ShiftStaffing entry has taken effect.
const FALLBACK: Record<string, { name: string; credentials: string }> = {
  AM: { name: "Arnold Mwangi", credentials: "BHT" },
  PM: { name: "Richard Mugabe", credentials: "BHT" },
};

function phaseFor(admissionDate: Date | null, noteDate: Date): Phase {
  if (!admissionDate) return "midStay";
  const days = Math.floor((noteDate.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 7) return "admit";
  if (days >= 30) return "longStay";
  return "midStay";
}

function* eachDay(start: Date, end: Date): Generator<Date> {
  const d = new Date(start);
  while (d.getTime() <= end.getTime()) {
    yield new Date(d);
    d.setUTCDate(d.getUTCDate() + 1);
  }
}

/** Yalena's protected clinical narrative stays untouched. Nothing in our
 *  current window conflicts, but keep the guard for safety. */
function isProtected(name: string, noteDate: Date, shift: string): boolean {
  if (name !== "Yalena Thurman") return false;
  const d = noteDate.toISOString().slice(0, 10);
  if (d === "2026-09-19" && shift === "PM") return true;
  if (d === "2026-09-20" && shift === "AM") return true;
  return false;
}

async function main() {
  const intakes = await prisma.intake.findMany({
    where: {
      status: "APPROVED",
      dischargedAt: null,
    },
    include: { medications: true, facility: true },
  });

  console.log(`Found ${intakes.length} active residents`);

  let created = 0;
  let skipped = 0;

  for (const intake of intakes) {
    for (const noteDate of eachDay(START, END)) {
      for (const shift of ["AM", "PM"] as const) {
        if (isProtected(intake.residentName, noteDate, shift)) {
          skipped++;
          continue;
        }

        // Idempotency
        const existing = await prisma.progressNote.findFirst({
          where: { intakeId: intake.id, noteDate, shift },
        });
        if (existing) {
          skipped++;
          continue;
        }

        const hasActiveMeds = intake.medications.length > 0;
        const pronouns = pronounsFromSex(intake.sex);
        const seed = `${intake.id}|${noteDate.toISOString().slice(0, 10)}|${shift}|${SEED_VERSION}`;
        const phase = phaseFor(intake.admissionDate, noteDate);

        const content = buildVariedContent({ phase, shift, seed, hasActiveMeds, pronouns });

        // Signature: ShiftStaffing lookup, with fallback
        const staff = await getStaffingForDate(intake.facilityId, shift, noteDate);
        const sig = staff || FALLBACK[shift];
        const signedAt = new Date(noteDate);
        signedAt.setUTCHours(shift === "AM" ? 14 : 22, 0, 0, 0);

        await prisma.progressNote.create({
          data: {
            intakeId: intake.id,
            facilityId: intake.facilityId,
            noteDate,
            shift,
            authorName: sig.name,
            authorTitle: sig.credentials ?? "BHT",
            ...content,
            bhtSignature: sig.name,
            bhtCredentials: sig.credentials ?? "BHT",
            bhtSignatureDate: signedAt,
            status: "FINAL",
            submittedBy: "system-backfill",
            submittedAt: signedAt,
          },
        });

        created++;
      }
    }
  }

  console.log(`Created ${created} notes, skipped ${skipped}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
