import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateDischargeSummary, isAnthropicConfigured } from "@/lib/ai";
import { formatISODateOnly } from "@/lib/date-utils";
import { differenceInDays } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAnthropicConfigured()) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { intakeId, dischargeDate, dischargeType } = body;

    if (!intakeId) {
      return NextResponse.json(
        { error: "intakeId is required" },
        { status: 400 }
      );
    }

    // Verify access to the intake
    let facilityId: string | null = null;

    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (bhrfProfile) {
        facilityId = bhrfProfile.facilityId;
      }
    } else if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
        include: { facilities: true },
      });
      if (bhpProfile) {
        // Get all facility IDs for this BHP
        const facilityIds = bhpProfile.facilities.map((f) => f.id);
        // We'll verify access below
        facilityId = facilityIds[0]; // Just to continue, we verify properly below
      }
    }

    // Fetch intake with all related data
    const intake = await prisma.intake.findUnique({
      where: { id: intakeId },
      include: {
        facility: true,
        asamAssessments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        progressNotes: {
          where: { archivedAt: null },
          orderBy: { noteDate: "desc" },
          select: {
            generatedNote: true,
            riskFlagsDetected: true,
            noteDate: true,
          },
        },
        medications: true,
      },
    });

    if (!intake) {
      return NextResponse.json(
        { error: "Intake not found" },
        { status: 404 }
      );
    }

    // Verify facility access
    if (session.user.role === "BHRF" && intake.facilityId !== facilityId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
        include: { facilities: true },
      });
      const hasFacilityAccess = bhpProfile?.facilities.some(
        (f) => f.id === intake.facilityId
      );
      if (!hasFacilityAccess) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Fetch treatment plan document if available
    let treatmentPlanContent: string | undefined;
    const treatmentPlanDoc = await prisma.document.findFirst({
      where: {
        intakeId: intake.id,
        archivedAt: null,
        OR: [
          { name: { contains: "treatment plan", mode: "insensitive" } },
          { name: { contains: "treatment-plan", mode: "insensitive" } },
          { type: { contains: "treatment", mode: "insensitive" } },
        ],
      },
      include: {
        versions: {
          orderBy: { uploadedAt: "desc" },
          take: 1,
        },
      },
    });

    // Note: If treatment plan is a PDF, we'd need to extract text from it
    // For now, we'll use the intake's treatment objectives as fallback
    if (treatmentPlanDoc) {
      // Treatment plan document exists - we note this but can't extract PDF content easily
      treatmentPlanContent = `[Treatment Plan Document: ${treatmentPlanDoc.name} - uploaded ${treatmentPlanDoc.uploadedAt ? formatISODateOnly(treatmentPlanDoc.uploadedAt) : "N/A"}]`;
    }

    // Get progress notes summary
    const progressNotes = intake.progressNotes;
    let progressNotesSummary = "";
    const riskFlagsEncountered: string[] = [];

    if (progressNotes.length > 0) {
      // Get unique risk flags
      progressNotes.forEach((note) => {
        if (note.riskFlagsDetected) {
          note.riskFlagsDetected.forEach((flag) => {
            if (!riskFlagsEncountered.includes(flag)) {
              riskFlagsEncountered.push(flag);
            }
          });
        }
      });

      // Summarize recent progress notes (last 5)
      const recentNotes = progressNotes.slice(0, 5);
      progressNotesSummary = recentNotes
        .map((note) => {
          const dateStr = formatISODateOnly(note.noteDate);
          const summary = note.generatedNote
            ? note.generatedNote.substring(0, 200) + "..."
            : "No generated note";
          return `[${dateStr}]: ${summary}`;
        })
        .join("\n\n");
    }

    // Get ASAM summary
    let asamRecommendedLevel: string | undefined;
    let asamSummary: string | undefined;
    if (intake.asamAssessments.length > 0) {
      const asam = intake.asamAssessments[0];
      asamRecommendedLevel = asam.recommendedLevelOfCare || undefined;
      asamSummary = asam.reasonForTreatment || undefined;
    }

    // Get current medications
    const currentMedications = intake.medications.map((med) => ({
      name: med.name,
      dosage: med.dosage || "",
      frequency: med.frequency || "",
    }));

    // Also check for medication orders from eMAR
    const medicationOrders = await prisma.medicationOrder.findMany({
      where: {
        intakeId: intake.id,
        status: "ACTIVE",
        discontinuedAt: null,
      },
      select: {
        medicationName: true,
        dose: true,
        frequency: true,
      },
    });

    medicationOrders.forEach((order) => {
      // Avoid duplicates
      if (!currentMedications.some((m) => m.name.toLowerCase() === order.medicationName.toLowerCase())) {
        currentMedications.push({
          name: order.medicationName,
          dosage: order.dose || "",
          frequency: order.frequency || "",
        });
      }
    });

    // Calculate length of stay
    const admissionDate = intake.admissionDate || intake.createdAt;
    const dischargeDateParsed = dischargeDate ? new Date(dischargeDate) : new Date();
    const lengthOfStay = differenceInDays(dischargeDateParsed, admissionDate);

    // Build substance use history from intake data
    let substanceUseHistory = "";
    if (intake.substanceHistory) {
      substanceUseHistory = intake.substanceHistory;
    }

    // Generate discharge summary using AI
    const result = await generateDischargeSummary({
      residentName: intake.residentName || "Unknown Resident",
      dateOfBirth: intake.dateOfBirth ? formatISODateOnly(intake.dateOfBirth) : "N/A",
      admissionDate: formatISODateOnly(admissionDate),
      dischargeDate: formatISODateOnly(dischargeDateParsed),
      lengthOfStay,
      diagnosis: intake.diagnosis || undefined,
      treatmentRecommendation: intake.treatmentRecommendation || undefined,
      treatmentObjectives: intake.treatmentObjectives || undefined,
      personalPsychHX: intake.personalPsychHX || undefined,
      substanceUseHistory: substanceUseHistory || undefined,
      presentingProblems: intake.personalPsychHX || undefined, // Use psychiatric history as presenting problems
      treatmentPlanContent,
      progressNotesSummary: progressNotesSummary || undefined,
      totalProgressNotes: progressNotes.length,
      riskFlagsEncountered: riskFlagsEncountered.length > 0 ? riskFlagsEncountered : undefined,
      asamRecommendedLevel,
      asamSummary,
      currentMedications: currentMedications.length > 0 ? currentMedications : undefined,
      dischargeType: dischargeType || undefined,
    });

    // Also return pre-filled data that doesn't need AI
    const prefillData = {
      // Medications for discharge
      dischargeMedications: currentMedications.map((med) => ({
        medication: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        prescriber: "", // Will need to be filled in
      })),
    };

    return NextResponse.json({
      generated: result,
      prefill: prefillData,
    });
  } catch (error) {
    console.error("Generate discharge summary error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate discharge summary",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
