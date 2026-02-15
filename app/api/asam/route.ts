import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { asamSchema, asamDraftSchema, ASAMInput, ASAMDraftInput } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get("facilityId");
    const status = searchParams.get("status");

    let assessments;

    if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile) {
        return NextResponse.json({ assessments: [] });
      }

      assessments = await prisma.aSAMAssessment.findMany({
        where: {
          facility: {
            bhpId: bhpProfile.id,
            ...(facilityId && { id: facilityId }),
          },
          ...(status && { status: status as "DRAFT" | "PENDING" | "APPROVED" | "DENIED" | "CONDITIONAL" }),
        },
        include: {
          facility: {
            select: {
              id: true,
              name: true,
            },
          },
          intake: {
            select: {
              id: true,
              residentName: true,
              dateOfBirth: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile) {
        return NextResponse.json({ assessments: [] });
      }

      assessments = await prisma.aSAMAssessment.findMany({
        where: {
          facilityId: bhrfProfile.facilityId,
          ...(status && { status: status as "DRAFT" | "PENDING" | "APPROVED" | "DENIED" | "CONDITIONAL" }),
        },
        include: {
          facility: {
            select: {
              id: true,
              name: true,
            },
          },
          intake: {
            select: {
              id: true,
              residentName: true,
              dateOfBirth: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ assessments });
  } catch (error) {
    console.error("Get ASAM assessments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ASAM assessments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "BHRF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!bhrfProfile) {
      return NextResponse.json(
        { error: "Facility not assigned" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { isDraft, currentStep, intakeId, ...assessmentData } = body;

    // Validate intakeId is provided
    if (!intakeId) {
      return NextResponse.json(
        { error: "An intake must be selected for the ASAM assessment" },
        { status: 400 }
      );
    }

    // Verify the intake exists and belongs to this facility
    const intake = await prisma.intake.findFirst({
      where: {
        id: intakeId,
        facilityId: bhrfProfile.facilityId,
        status: "APPROVED", // Only allow ASAM for approved intakes
      },
    });

    if (!intake) {
      return NextResponse.json(
        { error: "Invalid intake selected or intake not approved" },
        { status: 400 }
      );
    }

    // Use appropriate schema based on draft status
    const validatedData = (isDraft
      ? asamDraftSchema.parse({ ...assessmentData, currentStep })
      : asamSchema.parse(assessmentData)) as ASAMInput & ASAMDraftInput;

    // Create ASAM assessment
    const assessment = await prisma.aSAMAssessment.create({
      data: {
        facilityId: bhrfProfile.facilityId,
        intakeId: intakeId,
        status: isDraft ? "DRAFT" : "APPROVED",

        // Demographics
        patientName: validatedData.patientName || "Draft Assessment",
        dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : new Date(),
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
        submittedBy: session.user.id,
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

    return NextResponse.json({ assessment }, { status: 201 });
  } catch (error) {
    console.error("Create ASAM assessment error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create ASAM assessment" },
      { status: 500 }
    );
  }
}
