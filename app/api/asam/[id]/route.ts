import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { asamSchema, asamDraftSchema, asamDecisionSchema, ASAMInput, ASAMDraftInput } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { parseJsonBody } from "@/lib/api-utils";
import { parseOptionalDateOfBirth, parseOptionalPastDate, parseOptionalSignatureDate } from "@/lib/date-utils";
import { syncASAMMedicationsToEmar } from "@/lib/emar/medication-sync";

// Helper function to check if a JSON object has meaningful data
// For objects with boolean checkbox values, we consider it "has data" if it has any keys
// (even if all values are false - that's still valid user input)
function hasJsonData(obj: unknown): boolean {
  if (obj === null || obj === undefined) return false;
  if (typeof obj !== 'object') return false;
  if (Array.isArray(obj)) return obj.length > 0;
  // If object has any keys, it has data (even if all values are false)
  return Object.keys(obj as Record<string, unknown>).length > 0;
}

// Helper to preserve existing JSON data if new data is empty/undefined
// For arrays: an explicit empty array [] means user cleared the data, so we save it
// Only preserve existing data if new data is undefined (not provided)
function preserveJsonField<T>(newData: T | undefined, existingData: T | null): T | undefined | null {
  // If new data is an array (even empty), use it - user explicitly set this value
  if (Array.isArray(newData)) return newData;
  // For objects and other types, check if it has meaningful data
  if (hasJsonData(newData)) return newData;
  // If new data is undefined/null/empty, preserve existing
  return existingData;
}

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
          select: {
            id: true,
            name: true,
            bhpId: true,
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

    return NextResponse.json({ assessment });
  } catch (error) {
    console.error("Get ASAM assessment error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ASAM assessment" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existingAssessment = await prisma.aSAMAssessment.findUnique({
      where: { id },
      include: {
        facility: {
          select: {
            bhpId: true,
          },
        },
      },
    });

    if (!existingAssessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    const parseResult = await parseJsonBody<Record<string, unknown>>(request);
    if (!parseResult.success) {
      return parseResult.error;
    }
    const body = parseResult.data;

    // BHP decision or edit flow
    if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile || existingAssessment.facility.bhpId !== bhpProfile.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      // Check if this is an edit request vs a decision request
      if (body.patientName !== undefined || body.isDraft !== undefined) {
        // BHP is editing the assessment
        const { isDraft, currentStep, ...assessmentData } = body;

        const validatedData = (isDraft
          ? asamDraftSchema.parse({ ...assessmentData, currentStep })
          : asamSchema.parse(assessmentData)) as ASAMInput & ASAMDraftInput;

        const assessment = await prisma.aSAMAssessment.update({
          where: { id },
          data: {
            status: isDraft ? "DRAFT" : existingAssessment.status,
            patientName: validatedData.patientName || existingAssessment.patientName,
            dateOfBirth: parseOptionalDateOfBirth(validatedData.dateOfBirth) || existingAssessment.dateOfBirth,
            admissionDate: parseOptionalPastDate(validatedData.admissionDate) ?? existingAssessment.admissionDate,
            phoneNumber: validatedData.phoneNumber,
            okayToLeaveVoicemail: validatedData.okayToLeaveVoicemail,
            patientAddress: validatedData.patientAddress,
            age: validatedData.age,
            gender: validatedData.gender,
            raceEthnicity: validatedData.raceEthnicity,
            preferredLanguage: validatedData.preferredLanguage,
            ahcccsId: validatedData.ahcccsId,
            otherInsuranceId: validatedData.otherInsuranceId,
            insuranceType: validatedData.insuranceType,
            insurancePlan: validatedData.insurancePlan,
            livingArrangement: validatedData.livingArrangement,
            referredBy: validatedData.referredBy,
            reasonForTreatment: validatedData.reasonForTreatment,
            currentSymptoms: validatedData.currentSymptoms,
            substanceUseHistory: preserveJsonField(validatedData.substanceUseHistory, existingAssessment.substanceUseHistory),
            usingMoreThanIntended: validatedData.usingMoreThanIntended,
            usingMoreDetails: validatedData.usingMoreDetails,
            physicallyIllWhenStopping: validatedData.physicallyIllWhenStopping,
            physicallyIllDetails: validatedData.physicallyIllDetails,
            currentWithdrawalSymptoms: validatedData.currentWithdrawalSymptoms,
            withdrawalSymptomsDetails: validatedData.withdrawalSymptomsDetails,
            historyOfSeriousWithdrawal: validatedData.historyOfSeriousWithdrawal,
            seriousWithdrawalDetails: validatedData.seriousWithdrawalDetails,
            toleranceIncreased: validatedData.toleranceIncreased,
            toleranceDetails: validatedData.toleranceDetails,
            recentUseChanges: validatedData.recentUseChanges,
            recentUseChangesDetails: validatedData.recentUseChangesDetails,
            familySubstanceHistory: validatedData.familySubstanceHistory,
            dimension1Severity: validatedData.dimension1Severity,
            dimension1Comments: validatedData.dimension1Comments,
            medicalProviders: preserveJsonField(validatedData.medicalProviders, existingAssessment.medicalProviders),
            medicalConditions: preserveJsonField(validatedData.medicalConditions, existingAssessment.medicalConditions),
            conditionsInterfere: validatedData.conditionsInterfere,
            conditionsInterfereDetails: validatedData.conditionsInterfereDetails,
            priorHospitalizations: validatedData.priorHospitalizations,
            lifeThreatening: validatedData.lifeThreatening,
            medicalMedications: preserveJsonField(validatedData.medicalMedications, existingAssessment.medicalMedications),
            dimension2Severity: validatedData.dimension2Severity,
            dimension2Comments: validatedData.dimension2Comments,
            moodSymptoms: preserveJsonField(validatedData.moodSymptoms, existingAssessment.moodSymptoms),
            anxietySymptoms: preserveJsonField(validatedData.anxietySymptoms, existingAssessment.anxietySymptoms),
            psychosisSymptoms: preserveJsonField(validatedData.psychosisSymptoms, existingAssessment.psychosisSymptoms),
            otherSymptoms: preserveJsonField(validatedData.otherSymptoms, existingAssessment.otherSymptoms),
            suicidalThoughts: validatedData.suicidalThoughts,
            suicidalThoughtsDetails: validatedData.suicidalThoughtsDetails,
            thoughtsOfHarmingOthers: validatedData.thoughtsOfHarmingOthers,
            harmingOthersDetails: validatedData.harmingOthersDetails,
            abuseHistory: validatedData.abuseHistory,
            traumaticEvents: validatedData.traumaticEvents,
            mentalIllnessDiagnosed: validatedData.mentalIllnessDiagnosed,
            mentalIllnessDetails: validatedData.mentalIllnessDetails,
            previousPsychTreatment: validatedData.previousPsychTreatment,
            psychTreatmentDetails: validatedData.psychTreatmentDetails,
            hallucinationsPresent: validatedData.hallucinationsPresent,
            hallucinationsDetails: validatedData.hallucinationsDetails,
            furtherMHAssessmentNeeded: validatedData.furtherMHAssessmentNeeded,
            furtherMHAssessmentDetails: validatedData.furtherMHAssessmentDetails,
            psychiatricMedications: preserveJsonField(validatedData.psychiatricMedications, existingAssessment.psychiatricMedications),
            mentalHealthProviders: preserveJsonField(validatedData.mentalHealthProviders, existingAssessment.mentalHealthProviders),
            dimension3Severity: validatedData.dimension3Severity,
            dimension3Comments: validatedData.dimension3Comments,
            areasAffectedByUse: preserveJsonField(validatedData.areasAffectedByUse, existingAssessment.areasAffectedByUse),
            continueUseDespitefects: validatedData.continueUseDespiteEffects,
            continueUseDetails: validatedData.continueUseDetails,
            previousTreatmentHelp: validatedData.previousTreatmentHelp,
            treatmentProviders: preserveJsonField(validatedData.treatmentProviders, existingAssessment.treatmentProviders),
            recoverySupport: validatedData.recoverySupport,
            recoveryBarriers: validatedData.recoveryBarriers,
            treatmentImportanceAlcohol: validatedData.treatmentImportanceAlcohol,
            treatmentImportanceDrugs: validatedData.treatmentImportanceDrugs,
            treatmentImportanceDetails: validatedData.treatmentImportanceDetails,
            dimension4Severity: validatedData.dimension4Severity,
            dimension4Comments: validatedData.dimension4Comments,
            cravingsFrequencyAlcohol: validatedData.cravingsFrequencyAlcohol,
            cravingsFrequencyDrugs: validatedData.cravingsFrequencyDrugs,
            cravingsDetails: validatedData.cravingsDetails,
            timeSearchingForSubstances: validatedData.timeSearchingForSubstances,
            timeSearchingDetails: validatedData.timeSearchingDetails,
            relapseWithoutTreatment: validatedData.relapseWithoutTreatment,
            relapseDetails: validatedData.relapseDetails,
            awareOfTriggers: validatedData.awareOfTriggers,
            triggersList: preserveJsonField(validatedData.triggersList, existingAssessment.triggersList),
            copingWithTriggers: validatedData.copingWithTriggers,
            attemptsToControl: validatedData.attemptsToControl,
            longestSobriety: validatedData.longestSobriety,
            whatHelped: validatedData.whatHelped,
            whatDidntHelp: validatedData.whatDidntHelp,
            dimension5Severity: validatedData.dimension5Severity,
            dimension5Comments: validatedData.dimension5Comments,
            supportiveRelationships: validatedData.supportiveRelationships,
            currentLivingSituation: validatedData.currentLivingSituation,
            othersUsingDrugsInEnvironment: validatedData.othersUsingDrugsInEnvironment,
            othersUsingDetails: validatedData.othersUsingDetails,
            safetyThreats: validatedData.safetyThreats,
            safetyThreatsDetails: validatedData.safetyThreatsDetails,
            negativeImpactRelationships: validatedData.negativeImpactRelationships,
            negativeImpactDetails: validatedData.negativeImpactDetails,
            currentlyEmployedOrSchool: validatedData.currentlyEmployedOrSchool,
            employmentSchoolDetails: validatedData.employmentSchoolDetails,
            socialServicesInvolved: validatedData.socialServicesInvolved,
            socialServicesDetails: validatedData.socialServicesDetails,
            probationParoleOfficer: validatedData.probationParoleOfficer,
            probationParoleContact: validatedData.probationParoleContact,
            dimension6Severity: validatedData.dimension6Severity,
            dimension6Comments: validatedData.dimension6Comments,
            summaryRationale: preserveJsonField(validatedData.summaryRationale, existingAssessment.summaryRationale),
            dsm5Criteria: preserveJsonField(validatedData.dsm5Criteria, existingAssessment.dsm5Criteria),
            dsm5Diagnoses: validatedData.dsm5Diagnoses,
            levelOfCareDetermination: preserveJsonField(validatedData.levelOfCareDetermination, existingAssessment.levelOfCareDetermination),
            matInterested: validatedData.matInterested,
            matDetails: validatedData.matDetails,
            recommendedLevelOfCare: validatedData.recommendedLevelOfCare,
            levelOfCareProvided: validatedData.levelOfCareProvided,
            discrepancyReason: validatedData.discrepancyReason,
            discrepancyExplanation: validatedData.discrepancyExplanation,
            designatedTreatmentLocation: validatedData.designatedTreatmentLocation,
            designatedProviderName: validatedData.designatedProviderName,
            counselorName: validatedData.counselorName,
            counselorSignatureDate: parseOptionalSignatureDate(validatedData.counselorSignatureDate),
            bhpLphaName: validatedData.bhpLphaName,
            bhpLphaSignatureDate: parseOptionalSignatureDate(validatedData.bhpLphaSignatureDate),
            draftStep: isDraft ? (currentStep || 1) : null,
          },
        });

        await createAuditLog({
          userId: session.user.id,
          action: AuditActions.ASAM_UPDATED,
          entityType: "ASAMAssessment",
          entityId: assessment.id,
          details: {
            patientName: assessment.patientName,
            updatedBy: "BHP",
          },
        });

        return NextResponse.json({ assessment });
      }

      // BHP decision flow
      if (existingAssessment.status !== "PENDING") {
        return NextResponse.json(
          { error: "Assessment has already been reviewed" },
          { status: 400 }
        );
      }

      const { status, decisionReason } = asamDecisionSchema.parse(body);

      const assessment = await prisma.aSAMAssessment.update({
        where: { id },
        data: {
          status,
          decisionReason,
          decidedAt: new Date(),
          decidedBy: session.user.id,
        },
      });

      let auditAction;
      switch (status) {
        case "APPROVED":
          auditAction = AuditActions.ASAM_APPROVED;
          break;
        case "CONDITIONAL":
          auditAction = AuditActions.ASAM_CONDITIONAL;
          break;
        case "DENIED":
          auditAction = AuditActions.ASAM_DENIED;
          break;
        default:
          auditAction = AuditActions.ASAM_APPROVED;
      }

      await createAuditLog({
        userId: session.user.id,
        action: auditAction,
        entityType: "ASAMAssessment",
        entityId: assessment.id,
        details: {
          patientName: assessment.patientName,
          status,
          decisionReason,
        },
      });

      return NextResponse.json({ assessment });
    }

    // BHRF update flow (editing draft or submitting)
    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile || bhrfProfile.facilityId !== existingAssessment.facilityId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      const { isDraft, currentStep, ...assessmentData } = body;

      // Debug logging for JSON fields
      console.log("[ASAM API] === Saving draft ===");
      console.log("[ASAM API] moodSymptoms received:", JSON.stringify(assessmentData.moodSymptoms));
      console.log("[ASAM API] moodSymptoms is array?:", Array.isArray(assessmentData.moodSymptoms));
      console.log("[ASAM API] moodSymptoms hasJsonData?:", hasJsonData(assessmentData.moodSymptoms));
      console.log("[ASAM API] Existing moodSymptoms:", JSON.stringify(existingAssessment.moodSymptoms));
      console.log("[ASAM API] medicalConditions received:", JSON.stringify(assessmentData.medicalConditions));
      console.log("[ASAM API] medicalConditions is array?:", Array.isArray(assessmentData.medicalConditions));

      // Use appropriate schema based on draft status
      const validatedData = (isDraft
        ? asamDraftSchema.parse({ ...assessmentData, currentStep })
        : asamSchema.parse(assessmentData)) as ASAMInput & ASAMDraftInput;

      const assessment = await prisma.aSAMAssessment.update({
        where: { id },
        data: {
          status: isDraft ? "DRAFT" : (existingAssessment.status === "DRAFT" ? "APPROVED" : existingAssessment.status),

          // Demographics
          patientName: validatedData.patientName || existingAssessment.patientName,
          dateOfBirth: parseOptionalDateOfBirth(validatedData.dateOfBirth) || existingAssessment.dateOfBirth,
          admissionDate: parseOptionalPastDate(validatedData.admissionDate) ?? existingAssessment.admissionDate,
          phoneNumber: validatedData.phoneNumber,
          okayToLeaveVoicemail: validatedData.okayToLeaveVoicemail,
          patientAddress: validatedData.patientAddress,
          age: validatedData.age,
          gender: validatedData.gender,
          raceEthnicity: validatedData.raceEthnicity,
          preferredLanguage: validatedData.preferredLanguage,
          ahcccsId: validatedData.ahcccsId,
          otherInsuranceId: validatedData.otherInsuranceId,
          insuranceType: validatedData.insuranceType,
          insurancePlan: validatedData.insurancePlan,
          livingArrangement: validatedData.livingArrangement,
          referredBy: validatedData.referredBy,
          reasonForTreatment: validatedData.reasonForTreatment,
          currentSymptoms: validatedData.currentSymptoms,

          // Dimension 1 - preserve existing JSON data if form sends empty
          substanceUseHistory: preserveJsonField(validatedData.substanceUseHistory, existingAssessment.substanceUseHistory),
          usingMoreThanIntended: validatedData.usingMoreThanIntended,
          usingMoreDetails: validatedData.usingMoreDetails,
          physicallyIllWhenStopping: validatedData.physicallyIllWhenStopping,
          physicallyIllDetails: validatedData.physicallyIllDetails,
          currentWithdrawalSymptoms: validatedData.currentWithdrawalSymptoms,
          withdrawalSymptomsDetails: validatedData.withdrawalSymptomsDetails,
          historyOfSeriousWithdrawal: validatedData.historyOfSeriousWithdrawal,
          seriousWithdrawalDetails: validatedData.seriousWithdrawalDetails,
          toleranceIncreased: validatedData.toleranceIncreased,
          toleranceDetails: validatedData.toleranceDetails,
          recentUseChanges: validatedData.recentUseChanges,
          recentUseChangesDetails: validatedData.recentUseChangesDetails,
          familySubstanceHistory: validatedData.familySubstanceHistory,
          dimension1Severity: validatedData.dimension1Severity,
          dimension1Comments: validatedData.dimension1Comments,

          // Dimension 2 - preserve existing JSON data if form sends empty
          medicalProviders: preserveJsonField(validatedData.medicalProviders, existingAssessment.medicalProviders),
          medicalConditions: preserveJsonField(validatedData.medicalConditions, existingAssessment.medicalConditions),
          conditionsInterfere: validatedData.conditionsInterfere,
          conditionsInterfereDetails: validatedData.conditionsInterfereDetails,
          priorHospitalizations: validatedData.priorHospitalizations,
          lifeThreatening: validatedData.lifeThreatening,
          medicalMedications: preserveJsonField(validatedData.medicalMedications, existingAssessment.medicalMedications),
          dimension2Severity: validatedData.dimension2Severity,
          dimension2Comments: validatedData.dimension2Comments,

          // Dimension 3 - preserve existing JSON data if form sends empty
          moodSymptoms: preserveJsonField(validatedData.moodSymptoms, existingAssessment.moodSymptoms),
          anxietySymptoms: preserveJsonField(validatedData.anxietySymptoms, existingAssessment.anxietySymptoms),
          psychosisSymptoms: preserveJsonField(validatedData.psychosisSymptoms, existingAssessment.psychosisSymptoms),
          otherSymptoms: preserveJsonField(validatedData.otherSymptoms, existingAssessment.otherSymptoms),
          suicidalThoughts: validatedData.suicidalThoughts,
          suicidalThoughtsDetails: validatedData.suicidalThoughtsDetails,
          thoughtsOfHarmingOthers: validatedData.thoughtsOfHarmingOthers,
          harmingOthersDetails: validatedData.harmingOthersDetails,
          abuseHistory: validatedData.abuseHistory,
          traumaticEvents: validatedData.traumaticEvents,
          mentalIllnessDiagnosed: validatedData.mentalIllnessDiagnosed,
          mentalIllnessDetails: validatedData.mentalIllnessDetails,
          previousPsychTreatment: validatedData.previousPsychTreatment,
          psychTreatmentDetails: validatedData.psychTreatmentDetails,
          hallucinationsPresent: validatedData.hallucinationsPresent,
          hallucinationsDetails: validatedData.hallucinationsDetails,
          furtherMHAssessmentNeeded: validatedData.furtherMHAssessmentNeeded,
          furtherMHAssessmentDetails: validatedData.furtherMHAssessmentDetails,
          psychiatricMedications: preserveJsonField(validatedData.psychiatricMedications, existingAssessment.psychiatricMedications),
          mentalHealthProviders: preserveJsonField(validatedData.mentalHealthProviders, existingAssessment.mentalHealthProviders),
          dimension3Severity: validatedData.dimension3Severity,
          dimension3Comments: validatedData.dimension3Comments,

          // Dimension 4 - preserve existing JSON data if form sends empty
          areasAffectedByUse: preserveJsonField(validatedData.areasAffectedByUse, existingAssessment.areasAffectedByUse),
          continueUseDespitefects: validatedData.continueUseDespiteEffects,
          continueUseDetails: validatedData.continueUseDetails,
          previousTreatmentHelp: validatedData.previousTreatmentHelp,
          treatmentProviders: preserveJsonField(validatedData.treatmentProviders, existingAssessment.treatmentProviders),
          recoverySupport: validatedData.recoverySupport,
          recoveryBarriers: validatedData.recoveryBarriers,
          treatmentImportanceAlcohol: validatedData.treatmentImportanceAlcohol,
          treatmentImportanceDrugs: validatedData.treatmentImportanceDrugs,
          treatmentImportanceDetails: validatedData.treatmentImportanceDetails,
          dimension4Severity: validatedData.dimension4Severity,
          dimension4Comments: validatedData.dimension4Comments,

          // Dimension 5 - preserve existing JSON data if form sends empty
          cravingsFrequencyAlcohol: validatedData.cravingsFrequencyAlcohol,
          cravingsFrequencyDrugs: validatedData.cravingsFrequencyDrugs,
          cravingsDetails: validatedData.cravingsDetails,
          timeSearchingForSubstances: validatedData.timeSearchingForSubstances,
          timeSearchingDetails: validatedData.timeSearchingDetails,
          relapseWithoutTreatment: validatedData.relapseWithoutTreatment,
          relapseDetails: validatedData.relapseDetails,
          awareOfTriggers: validatedData.awareOfTriggers,
          triggersList: preserveJsonField(validatedData.triggersList, existingAssessment.triggersList),
          copingWithTriggers: validatedData.copingWithTriggers,
          attemptsToControl: validatedData.attemptsToControl,
          longestSobriety: validatedData.longestSobriety,
          whatHelped: validatedData.whatHelped,
          whatDidntHelp: validatedData.whatDidntHelp,
          dimension5Severity: validatedData.dimension5Severity,
          dimension5Comments: validatedData.dimension5Comments,

          // Dimension 6
          supportiveRelationships: validatedData.supportiveRelationships,
          currentLivingSituation: validatedData.currentLivingSituation,
          othersUsingDrugsInEnvironment: validatedData.othersUsingDrugsInEnvironment,
          othersUsingDetails: validatedData.othersUsingDetails,
          safetyThreats: validatedData.safetyThreats,
          safetyThreatsDetails: validatedData.safetyThreatsDetails,
          negativeImpactRelationships: validatedData.negativeImpactRelationships,
          negativeImpactDetails: validatedData.negativeImpactDetails,
          currentlyEmployedOrSchool: validatedData.currentlyEmployedOrSchool,
          employmentSchoolDetails: validatedData.employmentSchoolDetails,
          socialServicesInvolved: validatedData.socialServicesInvolved,
          socialServicesDetails: validatedData.socialServicesDetails,
          probationParoleOfficer: validatedData.probationParoleOfficer,
          probationParoleContact: validatedData.probationParoleContact,
          dimension6Severity: validatedData.dimension6Severity,
          dimension6Comments: validatedData.dimension6Comments,

          // Summary and DSM-5 - preserve existing JSON data if form sends empty
          summaryRationale: preserveJsonField(validatedData.summaryRationale, existingAssessment.summaryRationale),
          dsm5Criteria: preserveJsonField(validatedData.dsm5Criteria, existingAssessment.dsm5Criteria),
          dsm5Diagnoses: validatedData.dsm5Diagnoses,
          levelOfCareDetermination: preserveJsonField(validatedData.levelOfCareDetermination, existingAssessment.levelOfCareDetermination),
          matInterested: validatedData.matInterested,
          matDetails: validatedData.matDetails,

          // Placement Summary - preserve existing values if form sends empty
          recommendedLevelOfCare: validatedData.recommendedLevelOfCare || existingAssessment.recommendedLevelOfCare,
          levelOfCareProvided: validatedData.levelOfCareProvided || existingAssessment.levelOfCareProvided,
          discrepancyReason: validatedData.discrepancyReason || existingAssessment.discrepancyReason,
          discrepancyExplanation: validatedData.discrepancyExplanation || existingAssessment.discrepancyExplanation,
          designatedTreatmentLocation: validatedData.designatedTreatmentLocation || existingAssessment.designatedTreatmentLocation,
          designatedProviderName: validatedData.designatedProviderName || existingAssessment.designatedProviderName,

          // Signatures - preserve existing values if form sends empty
          counselorName: validatedData.counselorName || existingAssessment.counselorName,
          counselorSignatureDate: parseOptionalSignatureDate(validatedData.counselorSignatureDate) || existingAssessment.counselorSignatureDate,
          bhpLphaName: validatedData.bhpLphaName || existingAssessment.bhpLphaName,
          bhpLphaSignatureDate: parseOptionalSignatureDate(validatedData.bhpLphaSignatureDate) || existingAssessment.bhpLphaSignatureDate,

          // Workflow
          draftStep: isDraft ? (currentStep || 1) : null,
        },
      });

      const auditDetails: Record<string, unknown> = {
        patientName: assessment.patientName,
      };
      if (isDraft) {
        auditDetails.draftStep = currentStep || 1;
      }

      await createAuditLog({
        userId: session.user.id,
        action: isDraft ? AuditActions.ASAM_DRAFT_SAVED : AuditActions.ASAM_SUBMITTED,
        entityType: "ASAMAssessment",
        entityId: assessment.id,
        details: auditDetails,
      });

      // Sync medications to eMAR when a draft is being finalized (submitted)
      if (!isDraft && existingAssessment.status === "DRAFT") {
        try {
          const medicalMeds = validatedData.medicalMedications as Array<{
            medication: string;
            dose?: string;
            reason?: string;
            effectiveness?: string;
          }> | null | undefined;

          const psychiatricMeds = validatedData.psychiatricMedications as Array<{
            medication: string;
            dose?: string;
            reason?: string;
            effectiveness?: string;
          }> | null | undefined;

          if ((medicalMeds && medicalMeds.length > 0) || (psychiatricMeds && psychiatricMeds.length > 0)) {
            await syncASAMMedicationsToEmar(
              existingAssessment.intakeId,
              bhrfProfile.facilityId,
              medicalMeds,
              psychiatricMeds,
              session.user.name || session.user.email || "System"
            );
          }
        } catch (syncError) {
          console.error("Failed to sync ASAM medications to eMAR:", syncError);
          // Don't fail the ASAM update, just log the error
        }
      }

      return NextResponse.json({ assessment });
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  } catch (error) {
    console.error("Update ASAM assessment error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update ASAM assessment" },
      { status: 500 }
    );
  }
}

// DELETE - Only BHRF can archive DRAFT ASAM assessments
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only BHRF role can archive drafts
    if (session.user.role !== "BHRF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify facility ownership
    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });

    const assessment = await prisma.aSAMAssessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    if (assessment.facilityId !== bhrfProfile?.facilityId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only allow archiving of DRAFT assessments
    if (assessment.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft assessments can be archived" },
        { status: 400 }
      );
    }

    // Archive the assessment by setting archivedAt
    await prisma.aSAMAssessment.update({
      where: { id },
      data: {
        archivedAt: new Date(),
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.ASAM_DRAFT_ARCHIVED,
      entityType: "ASAMAssessment",
      entityId: id,
      details: {
        patientName: assessment.patientName,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Archive ASAM assessment error:", error);
    return NextResponse.json(
      { error: "Failed to archive ASAM assessment" },
      { status: 500 }
    );
  }
}
