import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { ASAMPDF } from "@/lib/pdf/asam-template";
import { createAuditLog, AuditActions } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const assessment = await prisma.aSAMAssessment.findUnique({
      where: { id },
      include: {
        facility: {
          include: {
            bhp: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // Check access permissions
    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile || bhrfProfile.facilityId !== assessment.facilityId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile || assessment.facility.bhpId !== bhpProfile.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    // Helper to convert empty objects/arrays to null
    const emptyToNull = <T>(val: T): T | null => {
      if (val === null || val === undefined) return null;
      if (Array.isArray(val) && val.length === 0) return null;
      if (typeof val === 'object' && !(val instanceof Date) && Object.keys(val as object).length === 0) return null;
      return val;
    };

    // Helper to ensure string fields are strings (not objects)
    const ensureString = (val: unknown): string | null => {
      if (val === null || val === undefined) return null;
      if (typeof val === 'string') return val || null;
      if (typeof val === 'object' && Object.keys(val as object).length === 0) return null;
      return String(val);
    };

    // Transform data for PDF
    const pdfData = {
      id: assessment.id,
      patientName: assessment.patientName,
      dateOfBirth: assessment.dateOfBirth.toISOString(),
      admissionDate: assessment.admissionDate?.toISOString() || null,
      assessmentDate: assessment.assessmentDate.toISOString(),
      phoneNumber: assessment.phoneNumber,
      okayToLeaveVoicemail: assessment.okayToLeaveVoicemail,
      patientAddress: assessment.patientAddress,
      age: assessment.age,
      gender: assessment.gender,
      raceEthnicity: assessment.raceEthnicity,
      preferredLanguage: assessment.preferredLanguage,
      ahcccsId: assessment.ahcccsId,
      otherInsuranceId: assessment.otherInsuranceId,
      insuranceType: assessment.insuranceType,
      insurancePlan: assessment.insurancePlan,
      livingArrangement: assessment.livingArrangement,
      referredBy: assessment.referredBy,
      reasonForTreatment: assessment.reasonForTreatment,
      currentSymptoms: assessment.currentSymptoms,

      // Dimension 1
      substanceUseHistory: emptyToNull(assessment.substanceUseHistory) as { substance: string; routeOfAdministration?: string; ageFirstUsed?: string; ageRegularUse?: string; lastUse?: string; frequency?: string; amount?: string }[] | null,
      usingMoreThanIntended: assessment.usingMoreThanIntended,
      usingMoreDetails: assessment.usingMoreDetails,
      physicallyIllWhenStopping: assessment.physicallyIllWhenStopping,
      physicallyIllDetails: assessment.physicallyIllDetails,
      currentWithdrawalSymptoms: assessment.currentWithdrawalSymptoms,
      withdrawalSymptomsDetails: assessment.withdrawalSymptomsDetails,
      historyOfSeriousWithdrawal: assessment.historyOfSeriousWithdrawal,
      seriousWithdrawalDetails: assessment.seriousWithdrawalDetails,
      toleranceIncreased: assessment.toleranceIncreased,
      toleranceDetails: assessment.toleranceDetails,
      recentUseChanges: assessment.recentUseChanges,
      recentUseChangesDetails: assessment.recentUseChangesDetails,
      familySubstanceHistory: assessment.familySubstanceHistory,
      dimension1Severity: assessment.dimension1Severity,
      dimension1Comments: assessment.dimension1Comments,

      // Dimension 2
      medicalProviders: emptyToNull(assessment.medicalProviders) as { name?: string; specialty?: string; contact?: string }[] | null,
      medicalConditions: emptyToNull(assessment.medicalConditions) as Record<string, boolean> | null,
      conditionsInterfere: assessment.conditionsInterfere,
      conditionsInterfereDetails: assessment.conditionsInterfereDetails,
      priorHospitalizations: assessment.priorHospitalizations,
      lifeThreatening: assessment.lifeThreatening,
      medicalMedications: emptyToNull(assessment.medicalMedications) as { medication?: string; dose?: string; reason?: string; effectiveness?: string }[] | null,
      dimension2Severity: assessment.dimension2Severity,
      dimension2Comments: assessment.dimension2Comments,

      // Dimension 3
      moodSymptoms: emptyToNull(assessment.moodSymptoms) as Record<string, boolean> | null,
      anxietySymptoms: emptyToNull(assessment.anxietySymptoms) as Record<string, boolean> | null,
      psychosisSymptoms: emptyToNull(assessment.psychosisSymptoms) as Record<string, boolean> | null,
      otherSymptoms: emptyToNull(assessment.otherSymptoms) as Record<string, boolean> | null,
      suicidalThoughts: assessment.suicidalThoughts,
      suicidalThoughtsDetails: assessment.suicidalThoughtsDetails,
      thoughtsOfHarmingOthers: assessment.thoughtsOfHarmingOthers,
      harmingOthersDetails: assessment.harmingOthersDetails,
      abuseHistory: assessment.abuseHistory,
      traumaticEvents: assessment.traumaticEvents,
      mentalIllnessDiagnosed: assessment.mentalIllnessDiagnosed,
      mentalIllnessDetails: assessment.mentalIllnessDetails,
      previousPsychTreatment: assessment.previousPsychTreatment,
      psychTreatmentDetails: assessment.psychTreatmentDetails,
      hallucinationsPresent: assessment.hallucinationsPresent,
      hallucinationsDetails: assessment.hallucinationsDetails,
      furtherMHAssessmentNeeded: assessment.furtherMHAssessmentNeeded,
      furtherMHAssessmentDetails: assessment.furtherMHAssessmentDetails,
      psychiatricMedications: emptyToNull(assessment.psychiatricMedications) as { medication?: string; dose?: string; reason?: string; effectiveness?: string }[] | null,
      mentalHealthProviders: emptyToNull(assessment.mentalHealthProviders) as { name?: string; specialty?: string; contact?: string }[] | null,
      dimension3Severity: assessment.dimension3Severity,
      dimension3Comments: assessment.dimension3Comments,

      // Dimension 4
      areasAffectedByUse: emptyToNull(assessment.areasAffectedByUse) as Record<string, boolean> | null,
      continueUseDespiteEffects: assessment.continueUseDespitefects,
      continueUseDetails: assessment.continueUseDetails,
      previousTreatmentHelp: assessment.previousTreatmentHelp,
      treatmentProviders: emptyToNull(assessment.treatmentProviders) as { name?: string; specialty?: string; contact?: string }[] | null,
      recoverySupport: assessment.recoverySupport,
      recoveryBarriers: assessment.recoveryBarriers,
      treatmentImportanceAlcohol: assessment.treatmentImportanceAlcohol,
      treatmentImportanceDrugs: assessment.treatmentImportanceDrugs,
      treatmentImportanceDetails: assessment.treatmentImportanceDetails,
      dimension4Severity: assessment.dimension4Severity,
      dimension4Comments: assessment.dimension4Comments,

      // Dimension 5
      cravingsFrequencyAlcohol: assessment.cravingsFrequencyAlcohol,
      cravingsFrequencyDrugs: assessment.cravingsFrequencyDrugs,
      cravingsDetails: assessment.cravingsDetails,
      timeSearchingForSubstances: assessment.timeSearchingForSubstances,
      timeSearchingDetails: assessment.timeSearchingDetails,
      relapseWithoutTreatment: assessment.relapseWithoutTreatment,
      relapseDetails: assessment.relapseDetails,
      awareOfTriggers: assessment.awareOfTriggers,
      triggersList: ensureString(assessment.triggersList),
      copingWithTriggers: ensureString(assessment.copingWithTriggers),
      attemptsToControl: assessment.attemptsToControl,
      longestSobriety: assessment.longestSobriety,
      whatHelped: assessment.whatHelped,
      whatDidntHelp: assessment.whatDidntHelp,
      dimension5Severity: assessment.dimension5Severity,
      dimension5Comments: assessment.dimension5Comments,

      // Dimension 6
      supportiveRelationships: assessment.supportiveRelationships,
      currentLivingSituation: assessment.currentLivingSituation,
      othersUsingDrugsInEnvironment: assessment.othersUsingDrugsInEnvironment,
      othersUsingDetails: assessment.othersUsingDetails,
      safetyThreats: assessment.safetyThreats,
      safetyThreatsDetails: assessment.safetyThreatsDetails,
      negativeImpactRelationships: assessment.negativeImpactRelationships,
      negativeImpactDetails: assessment.negativeImpactDetails,
      currentlyEmployedOrSchool: assessment.currentlyEmployedOrSchool,
      employmentSchoolDetails: assessment.employmentSchoolDetails,
      socialServicesInvolved: assessment.socialServicesInvolved,
      socialServicesDetails: assessment.socialServicesDetails,
      probationParoleOfficer: assessment.probationParoleOfficer,
      probationParoleContact: assessment.probationParoleContact,
      dimension6Severity: assessment.dimension6Severity,
      dimension6Comments: assessment.dimension6Comments,

      // Summary
      summaryRationale: assessment.summaryRationale,
      dsm5Criteria: emptyToNull(assessment.dsm5Criteria) as Record<string, boolean> | null,
      dsm5Diagnoses: assessment.dsm5Diagnoses,
      levelOfCareDetermination: assessment.levelOfCareDetermination,
      matInterested: assessment.matInterested,
      matDetails: assessment.matDetails,

      // Placement
      recommendedLevelOfCare: assessment.recommendedLevelOfCare,
      levelOfCareProvided: assessment.levelOfCareProvided,
      discrepancyReason: assessment.discrepancyReason,
      discrepancyExplanation: assessment.discrepancyExplanation,
      designatedTreatmentLocation: assessment.designatedTreatmentLocation,
      designatedProviderName: assessment.designatedProviderName,

      // Signatures
      counselorName: assessment.counselorName,
      counselorSignatureDate: assessment.counselorSignatureDate?.toISOString() || null,
      bhpLphaName: assessment.bhpLphaName,
      bhpLphaSignatureDate: assessment.bhpLphaSignatureDate?.toISOString() || null,

      // Workflow
      status: assessment.status as "DRAFT" | "PENDING" | "APPROVED" | "CONDITIONAL" | "DENIED",
      decisionReason: assessment.decisionReason,
      decidedAt: assessment.decidedAt?.toISOString() || null,
      createdAt: assessment.createdAt.toISOString(),
      facility: {
        name: assessment.facility.name,
      },
      bhpName: assessment.facility.bhp?.user?.name || "Unknown BHP",
    };

    // Generate PDF
    const pdfBuffer = await renderToBuffer(ASAMPDF({ data: pdfData as unknown as Parameters<typeof ASAMPDF>[0]['data'] }));

    // Log the download
    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.ASAM_PDF_DOWNLOADED,
      entityType: "ASAMAssessment",
      entityId: assessment.id,
      details: {
        patientName: assessment.patientName,
      },
    });

    // Create filename
    const sanitizedName = assessment.patientName
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 30);
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `ASAM_${sanitizedName}_${dateStr}.pdf`;

    // Return PDF response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
      },
    });
  } catch (error) {
    console.error("Generate ASAM PDF error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: "Failed to generate PDF", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
