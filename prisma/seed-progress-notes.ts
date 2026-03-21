import { PrismaClient } from "@prisma/client";
import progressNotesData from "../progress_notes_export.json";

const prisma = new PrismaClient();

// Map JSON field names to database field names
function mapNoteToDbFields(note: (typeof progressNotesData.progress_notes)[0]) {
  // Determine author based on shift
  const isAMShift = note.shift === "AM";
  const authorName = isAMShift ? "Richard Mugabe" : "Dorine Nikuze";

  return {
    noteDate: new Date(note.note_date),
    shift: note.shift,
    authorName: authorName,
    authorTitle: "BHT",
    residentStatus: note.resident_status || null,
    observedBehaviors: note.observed_behaviors || null,
    moodAffect: note.mood_affect || null,
    activityParticipation: note.activity_participation || null,
    staffInteractions: note.staff_interactions || null,
    peerInteractions: note.peer_interactions || null,
    medicationCompliance: note.medication_compliance || null,
    hygieneAdl: note.hygiene_adls || null,
    mealsAppetite: note.meals_appetite || null,
    sleepPattern: note.sleep_pattern || null,
    staffInterventions: note.staff_interventions || null,
    residentResponse: note.resident_response || null,
    notableEvents: note.notable_events || null,
    additionalNotes: note.additional_notes || null,
    status: "FINAL",
    bhtSignature: authorName,
    bhtCredentials: "BHT",
    bhtSignatureDate: new Date(note.note_date),
    submittedAt: new Date(note.note_date),
  };
}

async function main() {
  console.log("Starting progress notes import...\n");

  // Get the facility
  const facility = await prisma.facility.findFirst({
    where: {
      name: { contains: "Lucid" },
    },
  });

  if (!facility) {
    console.error("Facility not found!");
    return;
  }

  console.log(`Found facility: ${facility.name} (${facility.id})\n`);

  // Get a staff user for submittedBy field
  const staffUser = await prisma.user.findFirst({
    where: {
      role: "BHRF",
    },
  });

  if (!staffUser) {
    console.error("No staff user found!");
    return;
  }

  // Get all active intakes (APPROVED and not discharged)
  const intakes = await prisma.intake.findMany({
    where: {
      facilityId: facility.id,
      status: "APPROVED",
      dischargedAt: null,
    },
  });

  console.log(`Found ${intakes.length} active intakes\n`);

  // Create a map of resident names to intakes
  const residentMap = new Map<string, typeof intakes[0]>();

  for (const intake of intakes) {
    // Match by various name patterns
    const name = intake.residentName.toLowerCase();
    residentMap.set(name, intake);

    // Also map by first name for partial matching
    const firstName = name.split(" ")[0];
    if (!residentMap.has(firstName)) {
      residentMap.set(firstName, intake);
    }
  }

  // Group notes by resident
  const notesByResident = new Map<string, typeof progressNotesData.progress_notes>();

  for (const note of progressNotesData.progress_notes) {
    const residentName = note.resident_name.toLowerCase();
    if (!notesByResident.has(residentName)) {
      notesByResident.set(residentName, []);
    }
    notesByResident.get(residentName)!.push(note);
  }

  let totalCreated = 0;
  let totalSkipped = 0;

  // Process each resident's notes
  for (const [residentName, notes] of notesByResident) {
    // Find matching intake
    let intake = residentMap.get(residentName);

    // Try partial matching
    if (!intake) {
      const firstName = residentName.split(" ")[0];
      intake = residentMap.get(firstName);
    }

    // Try matching by contains
    if (!intake) {
      for (const [key, value] of residentMap) {
        if (key.includes(residentName.split(" ")[0]) || residentName.includes(key.split(" ")[0])) {
          intake = value;
          break;
        }
      }
    }

    if (!intake) {
      console.log(`❌ Could not find intake for: ${residentName}`);
      totalSkipped += notes.length;
      continue;
    }

    console.log(`\n📝 Processing ${notes.length} notes for ${intake.residentName}...`);

    for (const note of notes) {
      const dbFields = mapNoteToDbFields(note);

      // Check if note already exists for this date/shift
      const existingNote = await prisma.progressNote.findFirst({
        where: {
          intakeId: intake.id,
          noteDate: new Date(note.note_date),
          shift: note.shift,
        },
      });

      if (existingNote) {
        // Update existing note with correct author name and signature
        await prisma.progressNote.update({
          where: { id: existingNote.id },
          data: {
            authorName: dbFields.authorName,
            bhtSignature: dbFields.bhtSignature,
            residentStatus: dbFields.residentStatus,
            observedBehaviors: dbFields.observedBehaviors,
            moodAffect: dbFields.moodAffect,
            activityParticipation: dbFields.activityParticipation,
            staffInteractions: dbFields.staffInteractions,
            peerInteractions: dbFields.peerInteractions,
            medicationCompliance: dbFields.medicationCompliance,
            hygieneAdl: dbFields.hygieneAdl,
            mealsAppetite: dbFields.mealsAppetite,
            sleepPattern: dbFields.sleepPattern,
            staffInterventions: dbFields.staffInterventions,
            residentResponse: dbFields.residentResponse,
            notableEvents: dbFields.notableEvents,
            additionalNotes: dbFields.additionalNotes,
          },
        });
        console.log(`  ✏️  Updated note: ${note.note_date} ${note.shift} - ${dbFields.authorName}`);
        totalSkipped++;
        continue;
      }

      await prisma.progressNote.create({
        data: {
          ...dbFields,
          intakeId: intake.id,
          facilityId: facility.id,
          submittedBy: staffUser.id,
        },
      });

      console.log(`  ✅ Created note: ${note.note_date} ${note.shift} - ${dbFields.authorName}`);
      totalCreated++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Import complete!`);
  console.log(`  Created: ${totalCreated} progress notes`);
  console.log(`  Updated: ${totalSkipped} existing notes`);
  console.log(`========================================\n`);
  console.log(`Authors:`);
  console.log(`  AM Shift: Richard Mugabe`);
  console.log(`  PM Shift: Dorine Nikuze`);
  console.log(`========================================\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
