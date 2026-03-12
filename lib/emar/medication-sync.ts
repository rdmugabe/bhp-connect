import { prisma } from "@/lib/prisma";
import { MedicationFrequency, MedicationRoute } from "@prisma/client";
import { generateSchedules } from "./schedule-generator";

/**
 * Map frequency strings from intake/ASAM to MedicationFrequency enum
 */
function parseFrequency(frequency?: string | null): MedicationFrequency {
  if (!frequency) return "DAILY";

  const freq = frequency.toUpperCase().trim();

  // Direct enum matches
  if (Object.values(MedicationFrequency).includes(freq as MedicationFrequency)) {
    return freq as MedicationFrequency;
  }

  // Common variations
  if (freq.includes("TWICE") || freq.includes("2X") || freq === "2 TIMES DAILY") return "BID";
  if (freq.includes("THREE") || freq.includes("3X") || freq === "3 TIMES DAILY") return "TID";
  if (freq.includes("FOUR") || freq.includes("4X") || freq === "4 TIMES DAILY") return "QID";
  if (freq.includes("EVERY 4") || freq === "Q4") return "Q4H";
  if (freq.includes("EVERY 6") || freq === "Q6") return "Q6H";
  if (freq.includes("EVERY 8") || freq === "Q8") return "Q8H";
  if (freq.includes("EVERY 12") || freq === "Q12") return "Q12H";
  if (freq.includes("BEDTIME") || freq.includes("NIGHT") || freq === "HS" || freq === "AT NIGHT") return "QHS";
  if (freq.includes("MORNING") || freq === "AM" || freq === "IN THE MORNING") return "QAM";
  if (freq.includes("AS NEEDED") || freq.includes("PRN")) return "PRN";
  if (freq.includes("WEEKLY") || freq.includes("ONCE A WEEK")) return "WEEKLY";
  if (freq.includes("ONCE") || freq === "SINGLE") return "ONCE";
  if (freq.includes("DAILY") || freq.includes("ONCE DAILY") || freq === "QD" || freq === "1X DAILY") return "DAILY";

  return "DAILY"; // Default
}

/**
 * Map route strings from intake/ASAM to MedicationRoute enum
 */
function parseRoute(route?: string | null): MedicationRoute {
  if (!route) return "PO";

  const r = route.toUpperCase().trim();

  // Direct enum matches
  if (Object.values(MedicationRoute).includes(r as MedicationRoute)) {
    return r as MedicationRoute;
  }

  // Common variations
  if (r.includes("ORAL") || r.includes("BY MOUTH") || r.includes("MOUTH")) return "PO";
  if (r.includes("SUBLINGUAL") || r.includes("UNDER TONGUE")) return "SL";
  if (r.includes("INTRAMUSCULAR")) return "IM";
  if (r.includes("INTRAVENOUS")) return "IV";
  if (r.includes("SUBCUTANEOUS") || r.includes("SUB-Q") || r.includes("SUBQ")) return "SC";
  if (r.includes("TOPICAL") || r.includes("SKIN") || r.includes("EXTERNAL")) return "TOPICAL";
  if (r.includes("INHALE") || r.includes("INHALATION")) return "INHALED";
  if (r.includes("OPHTHALMIC") || r.includes("EYE")) return "OPHTHALMIC";
  if (r.includes("OTIC") || r.includes("EAR")) return "OTIC";
  if (r.includes("NASAL") || r.includes("NOSE")) return "NASAL";
  if (r.includes("RECTAL")) return "RECTAL";
  if (r.includes("TRANSDERMAL") || r.includes("PATCH")) return "TRANSDERMAL";

  return "PO"; // Default
}

/**
 * Parse dosage string to extract strength and dose
 */
function parseDosage(dosage?: string | null): { strength: string; dose: string } {
  if (!dosage) {
    return { strength: "As prescribed", dose: "As prescribed" };
  }

  // Common patterns: "10mg", "100 mg", "1 tablet", "2 tabs", etc.
  const match = dosage.match(/^(\d+\.?\d*)\s*(mg|mcg|g|ml|units?|tab(?:let)?s?|caps?(?:ule)?s?)?(.*)$/i);

  if (match) {
    const amount = match[1];
    const unit = match[2]?.toLowerCase() || "";
    const rest = match[3]?.trim() || "";

    // If it's a measurement unit (mg, ml, etc.), that's the strength
    if (["mg", "mcg", "g", "ml", "units", "unit"].includes(unit)) {
      return {
        strength: `${amount}${unit}`,
        dose: rest || `${amount}${unit}`,
      };
    }

    // If it's tablets/capsules, use dosage as dose
    return {
      strength: "As prescribed",
      dose: dosage,
    };
  }

  return { strength: dosage, dose: dosage };
}

interface IntakeMedication {
  name: string;
  dosage?: string | null;
  frequency?: string | null;
  route?: string | null;
  prescriber?: string | null;
  purpose?: string | null;
  startDate?: Date | null;
}

interface ASAMMedication {
  medication: string;
  dose?: string | null;
  reason?: string | null;
  effectiveness?: string | null;
}

interface SyncResult {
  created: number;
  skipped: number;
  errors: string[];
}

/**
 * Sync medications from Intake form to eMAR MedicationOrders
 */
export async function syncIntakeMedicationsToEmar(
  intakeId: string,
  facilityId: string,
  medications: IntakeMedication[],
  orderedBy: string
): Promise<SyncResult> {
  const result: SyncResult = { created: 0, skipped: 0, errors: [] };

  if (!medications || medications.length === 0) {
    return result;
  }

  for (const med of medications) {
    if (!med.name || med.name.trim() === "") {
      result.skipped++;
      continue;
    }

    try {
      // Check if this medication already exists for this patient
      const existingOrder = await prisma.medicationOrder.findFirst({
        where: {
          intakeId,
          medicationName: { equals: med.name.trim(), mode: "insensitive" },
          status: "ACTIVE",
        },
      });

      if (existingOrder) {
        result.skipped++;
        continue;
      }

      const { strength, dose } = parseDosage(med.dosage);
      const frequency = parseFrequency(med.frequency);
      const route = parseRoute(med.route);
      const startDate = med.startDate || new Date();

      // Create the medication order
      const order = await prisma.medicationOrder.create({
        data: {
          intakeId,
          facilityId,
          medicationName: med.name.trim(),
          strength,
          dose,
          route,
          frequency,
          isPRN: frequency === "PRN",
          prescriberName: med.prescriber || "As per intake assessment",
          startDate,
          instructions: med.purpose || undefined,
          orderedBy,
          status: "ACTIVE",
        },
      });

      // Generate schedules for non-PRN medications
      if (frequency !== "PRN") {
        await generateSchedules({
          medicationOrderId: order.id,
          startDate,
          frequency,
          daysToGenerate: 7,
        });
      }

      result.created++;
    } catch (error) {
      result.errors.push(`Failed to sync medication "${med.name}": ${error}`);
    }
  }

  return result;
}

/**
 * Sync medications from ASAM assessment to eMAR MedicationOrders
 */
export async function syncASAMMedicationsToEmar(
  intakeId: string,
  facilityId: string,
  medicalMedications: ASAMMedication[] | null | undefined,
  psychiatricMedications: ASAMMedication[] | null | undefined,
  orderedBy: string
): Promise<SyncResult> {
  const result: SyncResult = { created: 0, skipped: 0, errors: [] };

  const allMedications: Array<ASAMMedication & { type: "medical" | "psychiatric" }> = [];

  if (medicalMedications && Array.isArray(medicalMedications)) {
    allMedications.push(...medicalMedications.map(m => ({ ...m, type: "medical" as const })));
  }

  if (psychiatricMedications && Array.isArray(psychiatricMedications)) {
    allMedications.push(...psychiatricMedications.map(m => ({ ...m, type: "psychiatric" as const })));
  }

  if (allMedications.length === 0) {
    return result;
  }

  for (const med of allMedications) {
    if (!med.medication || med.medication.trim() === "") {
      result.skipped++;
      continue;
    }

    try {
      // Check if this medication already exists for this patient
      const existingOrder = await prisma.medicationOrder.findFirst({
        where: {
          intakeId,
          medicationName: { equals: med.medication.trim(), mode: "insensitive" },
          status: "ACTIVE",
        },
      });

      if (existingOrder) {
        result.skipped++;
        continue;
      }

      const { strength, dose } = parseDosage(med.dose);
      // ASAM doesn't capture frequency/route, use defaults
      const frequency: MedicationFrequency = "DAILY";
      const route: MedicationRoute = "PO";
      const startDate = new Date();

      // Create the medication order
      const order = await prisma.medicationOrder.create({
        data: {
          intakeId,
          facilityId,
          medicationName: med.medication.trim(),
          strength,
          dose,
          route,
          frequency,
          isPRN: false,
          prescriberName: "As per ASAM assessment",
          startDate,
          instructions: med.reason || undefined,
          administrationNotes: med.effectiveness
            ? `Effectiveness: ${med.effectiveness}`
            : undefined,
          orderedBy,
          status: "ACTIVE",
        },
      });

      // Generate schedules
      await generateSchedules({
        medicationOrderId: order.id,
        startDate,
        frequency,
        daysToGenerate: 7,
      });

      result.created++;
    } catch (error) {
      result.errors.push(`Failed to sync medication "${med.medication}": ${error}`);
    }
  }

  return result;
}
