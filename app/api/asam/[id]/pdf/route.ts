import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildASAMDocx, asamDocxFilename } from "@/lib/asam-docx";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { getTodayArizona } from "@/lib/date-utils";

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
                user: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

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

    const emptyToNull = <T>(val: T): T | null => {
      if (val === null || val === undefined) return null;
      if (Array.isArray(val) && val.length === 0) return null;
      if (typeof val === "object" && !(val instanceof Date) && Object.keys(val as object).length === 0) return null;
      return val;
    };

    const docxData = {
      id: assessment.id,
      patientName: assessment.patientName,
      dateOfBirth: assessment.dateOfBirth,
      admissionDate: assessment.admissionDate,
      assessmentDate: assessment.assessmentDate,
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

      substanceUseHistory: emptyToNull(assessment.substanceUseHistory) as
        | {
            substance: string;
            routeOfAdministration?: string;
            route?: string;
            ageFirstUsed?: string;
            ageFirstUse?: string;
            ageRegularUse?: string;
            lastUse?: string;
            frequency?: string;
            amount?: string;
          }[]
        | null,
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

      medicalProviders: emptyToNull(assessment.medicalProviders) as
        | { name?: string; specialty?: string; contact?: string }[]
        | null,
      medicalConditions: emptyToNull(assessment.medicalConditions) as Record<string, boolean> | null,
      conditionsInterfere: assessment.conditionsInterfere,
      conditionsInterfereDetails: assessment.conditionsInterfereDetails,
      priorHospitalizations: assessment.priorHospitalizations,
      lifeThreatening: assessment.lifeThreatening,
      medicalMedications: emptyToNull(assessment.medicalMedications) as
        | { medication?: string; dose?: string; reason?: string; effectiveness?: string }[]
        | null,
      dimension2Severity: assessment.dimension2Severity,
      dimension2Comments: assessment.dimension2Comments,

      moodSymptoms: emptyToNull(assessment.moodSymptoms) as Record<string, boolean> | null,
      anxietySymptoms: emptyToNull(assessment.anxietySymptoms) as Record<string, boolean> | null,
      psychosisSymptoms: emptyToNull(assessment.psychosisSymptoms) as
        | (Record<string, boolean> & { delusions?: string; hallucinations?: string })
        | null,
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
      psychiatricMedications: emptyToNull(assessment.psychiatricMedications) as
        | { medication?: string; dose?: string; reason?: string; effectiveness?: string }[]
        | null,
      mentalHealthProviders: emptyToNull(assessment.mentalHealthProviders) as
        | { name?: string; specialty?: string; contact?: string }[]
        | null,
      dimension3Severity: assessment.dimension3Severity,
      dimension3Comments: assessment.dimension3Comments,

      areasAffectedByUse: emptyToNull(assessment.areasAffectedByUse) as Record<string, boolean> | null,
      continueUseDespiteEffects: assessment.continueUseDespitefects,
      continueUseDetails: assessment.continueUseDetails,
      previousTreatmentHelp: assessment.previousTreatmentHelp,
      treatmentProviders: emptyToNull(assessment.treatmentProviders) as
        | { name?: string; specialty?: string; contact?: string }[]
        | null,
      recoverySupport: assessment.recoverySupport,
      recoveryBarriers: assessment.recoveryBarriers,
      treatmentImportanceAlcohol: assessment.treatmentImportanceAlcohol,
      treatmentImportanceDrugs: assessment.treatmentImportanceDrugs,
      treatmentImportanceDetails: assessment.treatmentImportanceDetails,
      dimension4Severity: assessment.dimension4Severity,
      dimension4Comments: assessment.dimension4Comments,

      cravingsFrequencyAlcohol: assessment.cravingsFrequencyAlcohol,
      cravingsFrequencyDrugs: assessment.cravingsFrequencyDrugs,
      cravingsDetails: assessment.cravingsDetails,
      timeSearchingForSubstances: assessment.timeSearchingForSubstances,
      timeSearchingDetails: assessment.timeSearchingDetails,
      relapseWithoutTreatment: assessment.relapseWithoutTreatment,
      relapseDetails: assessment.relapseDetails,
      awareOfTriggers: assessment.awareOfTriggers,
      triggersList: assessment.triggersList as string | Record<string, boolean | string> | null,
      copingWithTriggers: assessment.copingWithTriggers as string | null,
      attemptsToControl: assessment.attemptsToControl,
      longestSobriety: assessment.longestSobriety,
      whatHelped: assessment.whatHelped,
      whatDidntHelp: assessment.whatDidntHelp,
      dimension5Severity: assessment.dimension5Severity,
      dimension5Comments: assessment.dimension5Comments,

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

      summaryRationale: assessment.summaryRationale as
        | string
        | {
            dimension1Rationale?: string;
            dimension2Rationale?: string;
            dimension3Rationale?: string;
            dimension4Rationale?: string;
            dimension5Rationale?: string;
            dimension6Rationale?: string;
          }
        | null,
      dsm5Criteria: emptyToNull(assessment.dsm5Criteria) as
        | Record<string, boolean>
        | { substanceName: string; criteria: (string | boolean)[]; totalCriteria: number }[]
        | string[]
        | null,
      dsm5Diagnoses: assessment.dsm5Diagnoses,
      levelOfCareDetermination: assessment.levelOfCareDetermination as
        | string
        | { treatmentServices?: string; withdrawalManagement?: string; otp?: boolean }
        | null,
      matInterested: assessment.matInterested,
      matDetails: assessment.matDetails,

      recommendedLevelOfCare: assessment.recommendedLevelOfCare,
      levelOfCareProvided: assessment.levelOfCareProvided,
      discrepancyReason: assessment.discrepancyReason,
      discrepancyExplanation: assessment.discrepancyExplanation,
      designatedTreatmentLocation: assessment.designatedTreatmentLocation,
      designatedProviderName: assessment.designatedProviderName,

      counselorName: assessment.counselorName,
      counselorSignatureDate: assessment.counselorSignatureDate,
      bhpLphaName: assessment.bhpLphaName,
      bhpLphaSignatureDate: assessment.bhpLphaSignatureDate,

      status: assessment.status,
      decisionReason: assessment.decisionReason,
      decidedAt: assessment.decidedAt,
      createdAt: assessment.createdAt,
      facility: { name: assessment.facility.name },
      bhpName: assessment.facility.bhp?.user?.name || "Unknown BHP",
    };

    const docxBuffer = await buildASAMDocx(docxData);

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.ASAM_PDF_DOWNLOADED,
      entityType: "ASAMAssessment",
      entityId: assessment.id,
      details: { patientName: assessment.patientName },
    });

    const filename = asamDocxFilename({ patientName: assessment.patientName }, getTodayArizona());

    return new NextResponse(new Uint8Array(docxBuffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
      },
    });
  } catch (error) {
    console.error("Generate ASAM DOCX error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    return NextResponse.json(
      { error: "Failed to generate document", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
