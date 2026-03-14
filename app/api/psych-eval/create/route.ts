import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { parseOptionalDateOfBirth } from "@/lib/date-utils";
import type { ExtractedIntakeData, ExtractedASAMData } from "@/lib/ai/psych-eval-extraction";

interface CreatePsychEvalRequest {
  fileKey: string;
  fileName: string;
  residentName: string;
  intakeData: ExtractedIntakeData;
  asamData: ExtractedASAMData;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is BHRF
    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
      include: { facility: true },
    });

    if (!bhrfProfile) {
      return NextResponse.json(
        { error: "Only BHRF users can create records from psych evaluations" },
        { status: 403 }
      );
    }

    const body: CreatePsychEvalRequest = await request.json();
    const { fileKey, fileName, residentName, intakeData, asamData } = body;

    if (!fileKey || !residentName) {
      return NextResponse.json(
        { error: "File key and resident name are required" },
        { status: 400 }
      );
    }

    // Create everything in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create DRAFT intake
      const intake = await tx.intake.create({
        data: {
          facilityId: bhrfProfile.facilityId,
          status: "DRAFT",
          draftStep: 1,
          submittedBy: session.user.id,

          // Demographics
          residentName: intakeData.residentName || residentName,
          dateOfBirth: parseOptionalDateOfBirth(intakeData.dateOfBirth) || new Date(),
          ssn: intakeData.ssn,
          sex: intakeData.sex,
          ethnicity: intakeData.ethnicity,

          // Contact
          patientAddress: intakeData.patientAddress,
          patientPhone: intakeData.patientPhone,
          patientEmail: intakeData.patientEmail,

          // Emergency Contact
          emergencyContactName: intakeData.emergencyContactName,
          emergencyContactRelationship: intakeData.emergencyContactRelationship,
          emergencyContactPhone: intakeData.emergencyContactPhone,

          // Insurance
          insuranceProvider: intakeData.insuranceProvider,
          ahcccsHealthPlan: intakeData.ahcccsHealthPlan,
          policyNumber: intakeData.policyNumber,

          // Referral
          referralSource: intakeData.referralSource,
          evaluatorName: intakeData.evaluatorName,
          evaluatorCredentials: intakeData.evaluatorCredentials,
          reasonsForReferral: intakeData.reasonsForReferral,

          // Medical
          allergies: intakeData.allergies,
          personalMedicalHX: intakeData.personalMedicalHX,
          medicalConditions: intakeData.medicalConditions
            ? JSON.parse(JSON.stringify(intakeData.medicalConditions))
            : null,

          // Psychiatric
          personalPsychHX: intakeData.personalPsychHX,
          familyPsychHX: intakeData.familyPsychHX,
          diagnosis: intakeData.diagnosis,
          isCOT: intakeData.isCOT ?? false,
          treatmentPreferences: intakeData.treatmentPreferences,
          psychMedicationEfficacy: intakeData.psychMedicationEfficacy,
          currentBehavioralSymptoms: intakeData.currentBehavioralSymptoms,

          // Risk Assessment
          suicideHistory: intakeData.suicideHistory,
          currentSuicideIdeation: intakeData.currentSuicideIdeation ?? false,
          suicideIdeationDetails: intakeData.suicideIdeationDetails,
          historySelfHarm: intakeData.historySelfHarm ?? false,
          selfHarmDetails: intakeData.selfHarmDetails,
          historyHarmingOthers: intakeData.historyHarmingOthers ?? false,
          harmingOthersDetails: intakeData.harmingOthersDetails,
          homicidalIdeation: intakeData.homicidalIdeation ?? false,
          previousHospitalizations: intakeData.previousHospitalizations,

          // Substance
          substanceHistory: intakeData.substanceHistory,
          drugOfChoice: intakeData.drugOfChoice,
          longestSobriety: intakeData.longestSobriety,
          substanceTreatmentHistory: intakeData.substanceTreatmentHistory,
        },
      });

      // 2. Create intake medications if provided
      if (intakeData.currentMedications && intakeData.currentMedications.length > 0) {
        await tx.intakeMedication.createMany({
          data: intakeData.currentMedications.map((med) => ({
            intakeId: intake.id,
            name: med.name,
            dosage: med.dosage || null,
            frequency: med.frequency || null,
            purpose: med.reason || null,
          })),
        });
      }

      // 3. Create DRAFT ASAM assessment
      const asamAssessment = await tx.aSAMAssessment.create({
        data: {
          facilityId: bhrfProfile.facilityId,
          intakeId: intake.id,
          status: "DRAFT",
          draftStep: 1,
          submittedBy: session.user.id,

          // Demographics
          patientName: asamData.patientName || intakeData.residentName || residentName,
          dateOfBirth: parseOptionalDateOfBirth(asamData.dateOfBirth || intakeData.dateOfBirth) || new Date(),
          gender: asamData.gender,
          raceEthnicity: asamData.raceEthnicity,
          phoneNumber: asamData.phoneNumber || intakeData.patientPhone,
          patientAddress: asamData.patientAddress || intakeData.patientAddress,
          ahcccsId: asamData.ahcccsId,
          insuranceType: asamData.insuranceType,
          reasonForTreatment: asamData.reasonForTreatment,
          currentSymptoms: asamData.currentSymptoms,

          // Dimension 1
          substanceUseHistory: asamData.substanceUseHistory
            ? JSON.parse(JSON.stringify(asamData.substanceUseHistory))
            : null,
          usingMoreThanIntended: asamData.usingMoreThanIntended ?? false,
          usingMoreDetails: asamData.usingMoreDetails,
          currentWithdrawalSymptoms: asamData.currentWithdrawalSymptoms ?? false,
          withdrawalSymptomsDetails: asamData.withdrawalSymptomsDetails,
          toleranceIncreased: asamData.toleranceIncreased ?? false,
          toleranceDetails: asamData.toleranceDetails,
          familySubstanceHistory: asamData.familySubstanceHistory,
          dimension1Severity: asamData.dimension1Severity,

          // Dimension 2
          medicalConditions: asamData.medicalConditions
            ? JSON.parse(JSON.stringify(asamData.medicalConditions))
            : null,
          conditionsInterfere: asamData.conditionsInterfere ?? false,
          conditionsInterfereDetails: asamData.conditionsInterfereDetails,
          priorHospitalizations: asamData.priorHospitalizations,
          medicalMedications: asamData.medicalMedications
            ? JSON.parse(JSON.stringify(asamData.medicalMedications))
            : null,
          dimension2Severity: asamData.dimension2Severity,

          // Dimension 3
          moodSymptoms: asamData.moodSymptoms
            ? JSON.parse(JSON.stringify(asamData.moodSymptoms))
            : null,
          anxietySymptoms: asamData.anxietySymptoms
            ? JSON.parse(JSON.stringify(asamData.anxietySymptoms))
            : null,
          psychosisSymptoms: asamData.psychosisSymptoms
            ? JSON.parse(JSON.stringify(asamData.psychosisSymptoms))
            : null,
          suicidalThoughts: asamData.suicidalThoughts ?? false,
          suicidalThoughtsDetails: asamData.suicidalThoughtsDetails,
          thoughtsOfHarmingOthers: asamData.thoughtsOfHarmingOthers ?? false,
          harmingOthersDetails: asamData.harmingOthersDetails,
          abuseHistory: asamData.abuseHistory,
          traumaticEvents: asamData.traumaticEvents,
          mentalIllnessDiagnosed: asamData.mentalIllnessDiagnosed ?? false,
          mentalIllnessDetails: asamData.mentalIllnessDetails,
          previousPsychTreatment: asamData.previousPsychTreatment ?? false,
          psychTreatmentDetails: asamData.psychTreatmentDetails,
          psychiatricMedications: asamData.psychiatricMedications
            ? JSON.parse(JSON.stringify(asamData.psychiatricMedications))
            : null,
          dimension3Severity: asamData.dimension3Severity,

          // Dimension 4
          areasAffectedByUse: asamData.areasAffectedByUse
            ? JSON.parse(JSON.stringify(asamData.areasAffectedByUse))
            : null,
          continueUseDespitefects: asamData.continueUseDespitefects ?? false,
          continueUseDetails: asamData.continueUseDetails,
          recoverySupport: asamData.recoverySupport,
          recoveryBarriers: asamData.recoveryBarriers,
          treatmentImportanceAlcohol: asamData.treatmentImportanceAlcohol,
          treatmentImportanceDrugs: asamData.treatmentImportanceDrugs,
          dimension4Severity: asamData.dimension4Severity,

          // Dimension 5
          cravingsFrequencyAlcohol: asamData.cravingsFrequencyAlcohol,
          cravingsFrequencyDrugs: asamData.cravingsFrequencyDrugs,
          cravingsDetails: asamData.cravingsDetails,
          awareOfTriggers: asamData.awareOfTriggers ?? false,
          triggersList: asamData.triggersList
            ? JSON.parse(JSON.stringify(asamData.triggersList))
            : null,
          copingWithTriggers: asamData.copingWithTriggers,
          longestSobriety: asamData.longestSobriety || intakeData.longestSobriety,
          whatHelped: asamData.whatHelped,
          whatDidntHelp: asamData.whatDidntHelp,
          dimension5Severity: asamData.dimension5Severity,

          // Dimension 6
          supportiveRelationships: asamData.supportiveRelationships,
          currentLivingSituation: asamData.currentLivingSituation,
          othersUsingDrugsInEnvironment: asamData.othersUsingDrugsInEnvironment ?? false,
          othersUsingDetails: asamData.othersUsingDetails,
          safetyThreats: asamData.safetyThreats ?? false,
          safetyThreatsDetails: asamData.safetyThreatsDetails,
          currentlyEmployedOrSchool: asamData.currentlyEmployedOrSchool ?? false,
          employmentSchoolDetails: asamData.employmentSchoolDetails,
          socialServicesInvolved: asamData.socialServicesInvolved ?? false,
          socialServicesDetails: asamData.socialServicesDetails,
          dimension6Severity: asamData.dimension6Severity,

          // Level of Care
          dsm5Diagnoses: asamData.dsm5Diagnoses,
          recommendedLevelOfCare: asamData.recommendedLevelOfCare,
        },
      });

      // 4. Create document linked to intake
      const document = await tx.document.create({
        data: {
          facilityId: bhrfProfile.facilityId,
          name: fileName || "Psychiatric Evaluation",
          type: "Psychiatric Evaluation",
          fileUrl: fileKey,
          status: "UPLOADED",
          uploadedAt: new Date(),
          ownerType: "RESIDENT",
          intakeId: intake.id,
        },
      });

      return { intake, asamAssessment, document };
    });

    // Create audit logs
    await Promise.all([
      createAuditLog({
        userId: session.user.id,
        action: AuditActions.INTAKE_DRAFT_SAVED,
        entityType: "Intake",
        entityId: result.intake.id,
        details: {
          residentName: result.intake.residentName,
          source: "psych-eval-extraction",
        },
      }),
      createAuditLog({
        userId: session.user.id,
        action: AuditActions.ASAM_DRAFT_SAVED,
        entityType: "ASAMAssessment",
        entityId: result.asamAssessment.id,
        details: {
          patientName: result.asamAssessment.patientName,
          source: "psych-eval-extraction",
        },
      }),
      createAuditLog({
        userId: session.user.id,
        action: AuditActions.DOCUMENT_UPLOADED,
        entityType: "Document",
        entityId: result.document.id,
        details: {
          name: result.document.name,
          source: "psych-eval-extraction",
        },
      }),
    ]);

    return NextResponse.json(
      {
        intake: {
          id: result.intake.id,
          residentName: result.intake.residentName,
        },
        asam: {
          id: result.asamAssessment.id,
        },
        document: {
          id: result.document.id,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Psych eval create error:", error);
    return NextResponse.json(
      { error: "Failed to create records from psych evaluation" },
      { status: 500 }
    );
  }
}
