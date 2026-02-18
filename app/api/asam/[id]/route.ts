import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { asamSchema, asamDraftSchema, asamDecisionSchema, ASAMInput, ASAMDraftInput } from "@/lib/validations";
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

    const body = await request.json();

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
            dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : existingAssessment.dateOfBirth,
            admissionDate: validatedData.admissionDate ? new Date(validatedData.admissionDate) : existingAssessment.admissionDate,
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
            substanceUseHistory: validatedData.substanceUseHistory,
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
            medicalProviders: validatedData.medicalProviders,
            medicalConditions: validatedData.medicalConditions,
            conditionsInterfere: validatedData.conditionsInterfere,
            conditionsInterfereDetails: validatedData.conditionsInterfereDetails,
            priorHospitalizations: validatedData.priorHospitalizations,
            lifeThreatening: validatedData.lifeThreatening,
            medicalMedications: validatedData.medicalMedications,
            dimension2Severity: validatedData.dimension2Severity,
            dimension2Comments: validatedData.dimension2Comments,
            moodSymptoms: validatedData.moodSymptoms,
            anxietySymptoms: validatedData.anxietySymptoms,
            psychosisSymptoms: validatedData.psychosisSymptoms,
            otherSymptoms: validatedData.otherSymptoms,
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
            psychiatricMedications: validatedData.psychiatricMedications,
            mentalHealthProviders: validatedData.mentalHealthProviders,
            dimension3Severity: validatedData.dimension3Severity,
            dimension3Comments: validatedData.dimension3Comments,
            areasAffectedByUse: validatedData.areasAffectedByUse,
            continueUseDespitefects: validatedData.continueUseDespiteEffects,
            continueUseDetails: validatedData.continueUseDetails,
            previousTreatmentHelp: validatedData.previousTreatmentHelp,
            treatmentProviders: validatedData.treatmentProviders,
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
            triggersList: validatedData.triggersList,
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
            summaryRationale: validatedData.summaryRationale,
            dsm5Criteria: validatedData.dsm5Criteria,
            dsm5Diagnoses: validatedData.dsm5Diagnoses,
            levelOfCareDetermination: validatedData.levelOfCareDetermination,
            matInterested: validatedData.matInterested,
            matDetails: validatedData.matDetails,
            recommendedLevelOfCare: validatedData.recommendedLevelOfCare,
            levelOfCareProvided: validatedData.levelOfCareProvided,
            discrepancyReason: validatedData.discrepancyReason,
            discrepancyExplanation: validatedData.discrepancyExplanation,
            designatedTreatmentLocation: validatedData.designatedTreatmentLocation,
            designatedProviderName: validatedData.designatedProviderName,
            counselorName: validatedData.counselorName,
            counselorSignatureDate: validatedData.counselorSignatureDate ? new Date(validatedData.counselorSignatureDate) : null,
            bhpLphaName: validatedData.bhpLphaName,
            bhpLphaSignatureDate: validatedData.bhpLphaSignatureDate ? new Date(validatedData.bhpLphaSignatureDate) : null,
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
          dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : existingAssessment.dateOfBirth,
          admissionDate: validatedData.admissionDate ? new Date(validatedData.admissionDate) : existingAssessment.admissionDate,
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

          // Dimension 1
          substanceUseHistory: validatedData.substanceUseHistory,
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

          // Dimension 2
          medicalProviders: validatedData.medicalProviders,
          medicalConditions: validatedData.medicalConditions,
          conditionsInterfere: validatedData.conditionsInterfere,
          conditionsInterfereDetails: validatedData.conditionsInterfereDetails,
          priorHospitalizations: validatedData.priorHospitalizations,
          lifeThreatening: validatedData.lifeThreatening,
          medicalMedications: validatedData.medicalMedications,
          dimension2Severity: validatedData.dimension2Severity,
          dimension2Comments: validatedData.dimension2Comments,

          // Dimension 3
          moodSymptoms: validatedData.moodSymptoms,
          anxietySymptoms: validatedData.anxietySymptoms,
          psychosisSymptoms: validatedData.psychosisSymptoms,
          otherSymptoms: validatedData.otherSymptoms,
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
          psychiatricMedications: validatedData.psychiatricMedications,
          mentalHealthProviders: validatedData.mentalHealthProviders,
          dimension3Severity: validatedData.dimension3Severity,
          dimension3Comments: validatedData.dimension3Comments,

          // Dimension 4
          areasAffectedByUse: validatedData.areasAffectedByUse,
          continueUseDespitefects: validatedData.continueUseDespiteEffects,
          continueUseDetails: validatedData.continueUseDetails,
          previousTreatmentHelp: validatedData.previousTreatmentHelp,
          treatmentProviders: validatedData.treatmentProviders,
          recoverySupport: validatedData.recoverySupport,
          recoveryBarriers: validatedData.recoveryBarriers,
          treatmentImportanceAlcohol: validatedData.treatmentImportanceAlcohol,
          treatmentImportanceDrugs: validatedData.treatmentImportanceDrugs,
          treatmentImportanceDetails: validatedData.treatmentImportanceDetails,
          dimension4Severity: validatedData.dimension4Severity,
          dimension4Comments: validatedData.dimension4Comments,

          // Dimension 5
          cravingsFrequencyAlcohol: validatedData.cravingsFrequencyAlcohol,
          cravingsFrequencyDrugs: validatedData.cravingsFrequencyDrugs,
          cravingsDetails: validatedData.cravingsDetails,
          timeSearchingForSubstances: validatedData.timeSearchingForSubstances,
          timeSearchingDetails: validatedData.timeSearchingDetails,
          relapseWithoutTreatment: validatedData.relapseWithoutTreatment,
          relapseDetails: validatedData.relapseDetails,
          awareOfTriggers: validatedData.awareOfTriggers,
          triggersList: validatedData.triggersList,
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

          // Summary and DSM-5
          summaryRationale: validatedData.summaryRationale,
          dsm5Criteria: validatedData.dsm5Criteria,
          dsm5Diagnoses: validatedData.dsm5Diagnoses,
          levelOfCareDetermination: validatedData.levelOfCareDetermination,
          matInterested: validatedData.matInterested,
          matDetails: validatedData.matDetails,

          // Placement Summary
          recommendedLevelOfCare: validatedData.recommendedLevelOfCare,
          levelOfCareProvided: validatedData.levelOfCareProvided,
          discrepancyReason: validatedData.discrepancyReason,
          discrepancyExplanation: validatedData.discrepancyExplanation,
          designatedTreatmentLocation: validatedData.designatedTreatmentLocation,
          designatedProviderName: validatedData.designatedProviderName,

          // Signatures
          counselorName: validatedData.counselorName,
          counselorSignatureDate: validatedData.counselorSignatureDate ? new Date(validatedData.counselorSignatureDate) : null,
          bhpLphaName: validatedData.bhpLphaName,
          bhpLphaSignatureDate: validatedData.bhpLphaSignatureDate ? new Date(validatedData.bhpLphaSignatureDate) : null,

          // Workflow
          draftStep: isDraft ? (currentStep || 1) : null,
        },
      });

      await createAuditLog({
        userId: session.user.id,
        action: isDraft ? AuditActions.ASAM_DRAFT_SAVED : AuditActions.ASAM_SUBMITTED,
        entityType: "ASAMAssessment",
        entityId: assessment.id,
        details: {
          patientName: assessment.patientName,
          ...(isDraft && { draftStep: currentStep || 1 }),
        },
      });

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
