import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { intakeDecisionSchema, intakeDraftSchema, intakeSchema } from "@/lib/validations";
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

    const intake = await prisma.intake.findUnique({
      where: { id },
      include: {
        facility: {
          include: {
            bhp: true,
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

    // Authorization check
    if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (intake.facility.bhpId !== bhpProfile?.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (intake.facilityId !== bhrfProfile?.facilityId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({ intake });
  } catch (error) {
    console.error("Get intake error:", error);
    return NextResponse.json(
      { error: "Failed to fetch intake" },
      { status: 500 }
    );
  }
}

// BHRF draft update or final submission / BHP decision endpoint
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
    const body = await request.json();

    // Handle BHRF draft updates or final submission
    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      const intake = await prisma.intake.findUnique({
        where: { id },
        include: { facility: true },
      });

      if (!intake || intake.facilityId !== bhrfProfile?.facilityId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { medications, isDraft, currentStep, ...intakeData } = body;

      // Use appropriate schema based on draft status
      const validatedData = isDraft
        ? intakeDraftSchema.parse({ ...intakeData, currentStep })
        : intakeSchema.parse(intakeData);

      // Update intake with medications in a transaction
      const updatedIntake = await prisma.$transaction(async (tx) => {
        const updated = await tx.intake.update({
          where: { id },
          data: {
            status: isDraft ? "DRAFT" : (intake.status === "DRAFT" ? "APPROVED" : intake.status),
            draftStep: isDraft ? (currentStep || 1) : null,
            // Demographics
            residentName: validatedData.residentName || intake.residentName,
            ssn: validatedData.ssn,
            dateOfBirth: validatedData.dateOfBirth
              ? new Date(validatedData.dateOfBirth)
              : intake.dateOfBirth,
            admissionDate: validatedData.admissionDate
              ? new Date(validatedData.admissionDate)
              : intake.admissionDate,
            sex: validatedData.sex,
            ethnicity: validatedData.ethnicity,
            language: validatedData.language,
            religion: validatedData.religion,
            sexualOrientation: validatedData.sexualOrientation,
            // Contact Information
            patientAddress: validatedData.patientAddress,
            patientPhone: validatedData.patientPhone,
            patientEmail: validatedData.patientEmail,
            contactPreference: validatedData.contactPreference,
            emergencyContactName: validatedData.emergencyContactName,
            emergencyContactRelationship: validatedData.emergencyContactRelationship,
            emergencyContactPhone: validatedData.emergencyContactPhone,
            emergencyContactAddress: validatedData.emergencyContactAddress,
            primaryCarePhysician: validatedData.primaryCarePhysician,
            primaryCarePhysicianPhone: validatedData.primaryCarePhysicianPhone,
            caseManagerName: validatedData.caseManagerName,
            caseManagerPhone: validatedData.caseManagerPhone,
            // Insurance & Directives
            insuranceProvider: validatedData.insuranceProvider,
            policyNumber: validatedData.policyNumber,
            groupNumber: validatedData.groupNumber,
            ahcccsHealthPlan: validatedData.ahcccsHealthPlan,
            hasDNR: validatedData.hasDNR,
            hasAdvancedDirective: validatedData.hasAdvancedDirective,
            hasWill: validatedData.hasWill,
            poaLegalGuardian: validatedData.poaLegalGuardian,
            // Referral
            referralSource: validatedData.referralSource,
            evaluatorName: validatedData.evaluatorName,
            evaluatorCredentials: validatedData.evaluatorCredentials,
            reasonsForReferral: validatedData.reasonsForReferral,
            residentNeeds: validatedData.residentNeeds,
            residentExpectedLOS: validatedData.residentExpectedLOS,
            teamExpectedLOS: validatedData.teamExpectedLOS,
            strengthsAndLimitations: validatedData.strengthsAndLimitations,
            familyInvolved: validatedData.familyInvolved,
            // Behavioral Symptoms
            reasonForServices: validatedData.reasonForServices,
            currentBehavioralSymptoms: validatedData.currentBehavioralSymptoms,
            copingWithSymptoms: validatedData.copingWithSymptoms,
            symptomsLimitations: validatedData.symptomsLimitations,
            immediateUrgentNeeds: validatedData.immediateUrgentNeeds,
            signsOfImprovement: validatedData.signsOfImprovement,
            assistanceExpectations: validatedData.assistanceExpectations,
            involvedInTreatment: validatedData.involvedInTreatment,
            // Medical
            allergies: validatedData.allergies,
            historyNonCompliance: validatedData.historyNonCompliance,
            potentialViolence: validatedData.potentialViolence,
            medicalUrgency: validatedData.medicalUrgency,
            personalMedicalHX: validatedData.personalMedicalHX,
            familyMedicalHX: validatedData.familyMedicalHX,
            medicalConditions: validatedData.medicalConditions,
            height: validatedData.height,
            weight: validatedData.weight,
            bmi: validatedData.bmi,
            // Psychiatric
            isCOT: validatedData.isCOT,
            personalPsychHX: validatedData.personalPsychHX,
            familyPsychHX: validatedData.familyPsychHX,
            treatmentPreferences: validatedData.treatmentPreferences,
            psychMedicationEfficacy: validatedData.psychMedicationEfficacy,
            // Risk Assessment - DTS
            suicideHistory: validatedData.suicideHistory,
            suicideAttemptDetails: validatedData.suicideAttemptDetails,
            currentSuicideIdeation: validatedData.currentSuicideIdeation,
            suicideIdeationDetails: validatedData.suicideIdeationDetails,
            mostRecentSuicideIdeation: validatedData.mostRecentSuicideIdeation,
            historySelfHarm: validatedData.historySelfHarm,
            selfHarmDetails: validatedData.selfHarmDetails,
            dtsRiskFactors: validatedData.dtsRiskFactors,
            dtsProtectiveFactors: validatedData.dtsProtectiveFactors,
            // Risk Assessment - DTO
            historyHarmingOthers: validatedData.historyHarmingOthers,
            harmingOthersDetails: validatedData.harmingOthersDetails,
            homicidalIdeation: validatedData.homicidalIdeation,
            homicidalIdeationDetails: validatedData.homicidalIdeationDetails,
            dtoRiskFactors: validatedData.dtoRiskFactors,
            dutyToWarnCompleted: validatedData.dutyToWarnCompleted,
            dutyToWarnDetails: validatedData.dutyToWarnDetails,
            previousHospitalizations: validatedData.previousHospitalizations,
            hospitalizationDetails: validatedData.hospitalizationDetails,
            // Developmental History
            inUteroExposure: validatedData.inUteroExposure,
            inUteroExposureDetails: validatedData.inUteroExposureDetails,
            developmentalMilestones: validatedData.developmentalMilestones,
            developmentalDetails: validatedData.developmentalDetails,
            speechDifficulties: validatedData.speechDifficulties,
            speechDetails: validatedData.speechDetails,
            visualImpairment: validatedData.visualImpairment,
            visualDetails: validatedData.visualDetails,
            hearingImpairment: validatedData.hearingImpairment,
            hearingDetails: validatedData.hearingDetails,
            motorSkillsImpairment: validatedData.motorSkillsImpairment,
            motorSkillsDetails: validatedData.motorSkillsDetails,
            cognitiveImpairment: validatedData.cognitiveImpairment,
            cognitiveDetails: validatedData.cognitiveDetails,
            socialSkillsDeficits: validatedData.socialSkillsDeficits,
            socialSkillsDetails: validatedData.socialSkillsDetails,
            immunizationStatus: validatedData.immunizationStatus,
            // Skills
            hygieneSkills: validatedData.hygieneSkills,
            skillsContinuation: validatedData.skillsContinuation,
            // PHQ-9
            phq9Responses: validatedData.phq9Responses,
            phq9TotalScore: validatedData.phq9TotalScore,
            // Treatment
            treatmentObjectives: validatedData.treatmentObjectives,
            dischargePlanObjectives: validatedData.dischargePlanObjectives,
            supportSystem: validatedData.supportSystem,
            communityResources: validatedData.communityResources,
            // Social History
            childhoodDescription: validatedData.childhoodDescription,
            abuseHistory: validatedData.abuseHistory,
            familyMentalHealthHistory: validatedData.familyMentalHealthHistory,
            relationshipStatus: validatedData.relationshipStatus,
            relationshipSatisfaction: validatedData.relationshipSatisfaction,
            friendsDescription: validatedData.friendsDescription,
            // Education History
            highestEducation: validatedData.highestEducation,
            specialEducation: validatedData.specialEducation,
            specialEducationDetails: validatedData.specialEducationDetails,
            plan504: validatedData.plan504,
            iep: validatedData.iep,
            educationDetails: validatedData.educationDetails,
            // Employment
            currentlyEmployed: validatedData.currentlyEmployed,
            employmentDetails: validatedData.employmentDetails,
            workVolunteerHistory: validatedData.workVolunteerHistory,
            employmentBarriers: validatedData.employmentBarriers,
            // Legal History
            criminalLegalHistory: validatedData.criminalLegalHistory,
            courtOrderedTreatment: validatedData.courtOrderedTreatment,
            courtOrderedDetails: validatedData.courtOrderedDetails,
            otherLegalIssues: validatedData.otherLegalIssues,
            // Substance History
            substanceHistory: validatedData.substanceHistory,
            substanceUseTable: validatedData.substanceUseTable,
            drugOfChoice: validatedData.drugOfChoice,
            longestSobriety: validatedData.longestSobriety,
            substanceTreatmentHistory: validatedData.substanceTreatmentHistory,
            nicotineUse: validatedData.nicotineUse,
            nicotineDetails: validatedData.nicotineDetails,
            substanceImpact: validatedData.substanceImpact,
            historyOfAbuse: validatedData.historyOfAbuse,
            // Living Situation
            livingArrangements: validatedData.livingArrangements,
            sourceOfFinances: validatedData.sourceOfFinances,
            transportationMethod: validatedData.transportationMethod,
            // ADLs
            adlChecklist: validatedData.adlChecklist,
            preferredActivities: validatedData.preferredActivities,
            significantOthers: validatedData.significantOthers,
            supportLevel: validatedData.supportLevel,
            typicalDay: validatedData.typicalDay,
            strengthsAbilitiesInterests: validatedData.strengthsAbilitiesInterests,
            // Behavioral Observations
            appearanceAge: validatedData.appearanceAge,
            appearanceHeight: validatedData.appearanceHeight,
            appearanceWeight: validatedData.appearanceWeight,
            appearanceAttire: validatedData.appearanceAttire,
            appearanceGrooming: validatedData.appearanceGrooming,
            appearanceDescription: validatedData.appearanceDescription,
            demeanorMood: validatedData.demeanorMood,
            demeanorAffect: validatedData.demeanorAffect,
            demeanorEyeContact: validatedData.demeanorEyeContact,
            demeanorCooperation: validatedData.demeanorCooperation,
            demeanorDescription: validatedData.demeanorDescription,
            speechArticulation: validatedData.speechArticulation,
            speechTone: validatedData.speechTone,
            speechRate: validatedData.speechRate,
            speechLatency: validatedData.speechLatency,
            speechDescription: validatedData.speechDescription,
            motorGait: validatedData.motorGait,
            motorPosture: validatedData.motorPosture,
            motorActivity: validatedData.motorActivity,
            motorMannerisms: validatedData.motorMannerisms,
            motorDescription: validatedData.motorDescription,
            cognitionThoughtContent: validatedData.cognitionThoughtContent,
            cognitionThoughtProcess: validatedData.cognitionThoughtProcess,
            cognitionDelusions: validatedData.cognitionDelusions,
            cognitionPerception: validatedData.cognitionPerception,
            cognitionJudgment: validatedData.cognitionJudgment,
            cognitionImpulseControl: validatedData.cognitionImpulseControl,
            cognitionInsight: validatedData.cognitionInsight,
            cognitionDescription: validatedData.cognitionDescription,
            estimatedIntelligence: validatedData.estimatedIntelligence,
            // Diagnosis & Treatment Recommendation
            diagnosis: validatedData.diagnosis,
            treatmentRecommendation: validatedData.treatmentRecommendation,
            // Wellness
            healthNeeds: validatedData.healthNeeds,
            nutritionalNeeds: validatedData.nutritionalNeeds,
            spiritualNeeds: validatedData.spiritualNeeds,
            culturalNeeds: validatedData.culturalNeeds,
            educationHistory: validatedData.educationHistory,
            vocationalHistory: validatedData.vocationalHistory,
            // Crisis/Discharge
            crisisInterventionPlan: validatedData.crisisInterventionPlan,
            feedbackFrequency: validatedData.feedbackFrequency,
            dischargePlanning: validatedData.dischargePlanning,
            signatures: validatedData.signatures,
          },
        });

        // Update medications if provided
        if (medications && Array.isArray(medications)) {
          // Delete existing medications
          await tx.intakeMedication.deleteMany({
            where: { intakeId: id },
          });

          // Create new medications
          if (medications.length > 0) {
            await tx.intakeMedication.createMany({
              data: medications.map(
                (med: {
                  name: string;
                  dosage?: string;
                  frequency?: string;
                  route?: string;
                  prescriber?: string;
                  purpose?: string;
                  startDate?: string;
                }) => ({
                  intakeId: id,
                  name: med.name,
                  dosage: med.dosage,
                  frequency: med.frequency,
                  route: med.route,
                  prescriber: med.prescriber,
                  purpose: med.purpose,
                  startDate: med.startDate ? new Date(med.startDate) : null,
                })
              ),
            });
          }
        }

        return updated;
      });

      await createAuditLog({
        userId: session.user.id,
        action: isDraft
          ? AuditActions.INTAKE_DRAFT_SAVED
          : AuditActions.INTAKE_SUBMITTED,
        entityType: "Intake",
        entityId: id,
        details: {
          residentName: updatedIntake.residentName,
          ...(isDraft && { draftStep: currentStep || 1 }),
        },
      });

      return NextResponse.json({ intake: updatedIntake });
    }

    // Handle BHP editing or decisions
    if (session.user.role !== "BHP") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bhpProfile = await prisma.bHPProfile.findUnique({
      where: { userId: session.user.id },
    });

    const intake = await prisma.intake.findUnique({
      where: { id },
      include: {
        facility: true,
      },
    });

    if (!intake || intake.facility.bhpId !== bhpProfile?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if this is an edit request (has intake data fields) vs decision request
    if (body.residentName !== undefined || body.isDraft !== undefined) {
      // BHP is editing the intake
      const { medications, isDraft, currentStep, ...intakeData } = body;

      const validatedData = isDraft
        ? intakeDraftSchema.parse({ ...intakeData, currentStep })
        : intakeSchema.parse(intakeData);

      const updatedIntake = await prisma.$transaction(async (tx) => {
        const updated = await tx.intake.update({
          where: { id },
          data: {
            status: isDraft ? "DRAFT" : intake.status,
            draftStep: isDraft ? (currentStep || 1) : null,
            // Demographics
            residentName: validatedData.residentName || intake.residentName,
            ssn: validatedData.ssn,
            dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : intake.dateOfBirth,
            admissionDate: validatedData.admissionDate ? new Date(validatedData.admissionDate) : intake.admissionDate,
            sex: validatedData.sex,
            ethnicity: validatedData.ethnicity,
            language: validatedData.language,
            religion: validatedData.religion,
            sexualOrientation: validatedData.sexualOrientation,
            patientAddress: validatedData.patientAddress,
            patientPhone: validatedData.patientPhone,
            patientEmail: validatedData.patientEmail,
            contactPreference: validatedData.contactPreference,
            emergencyContactName: validatedData.emergencyContactName,
            emergencyContactRelationship: validatedData.emergencyContactRelationship,
            emergencyContactPhone: validatedData.emergencyContactPhone,
            emergencyContactAddress: validatedData.emergencyContactAddress,
            primaryCarePhysician: validatedData.primaryCarePhysician,
            primaryCarePhysicianPhone: validatedData.primaryCarePhysicianPhone,
            caseManagerName: validatedData.caseManagerName,
            caseManagerPhone: validatedData.caseManagerPhone,
            insuranceProvider: validatedData.insuranceProvider,
            policyNumber: validatedData.policyNumber,
            groupNumber: validatedData.groupNumber,
            ahcccsHealthPlan: validatedData.ahcccsHealthPlan,
            hasDNR: validatedData.hasDNR,
            hasAdvancedDirective: validatedData.hasAdvancedDirective,
            hasWill: validatedData.hasWill,
            poaLegalGuardian: validatedData.poaLegalGuardian,
            referralSource: validatedData.referralSource,
            evaluatorName: validatedData.evaluatorName,
            evaluatorCredentials: validatedData.evaluatorCredentials,
            reasonsForReferral: validatedData.reasonsForReferral,
            residentNeeds: validatedData.residentNeeds,
            residentExpectedLOS: validatedData.residentExpectedLOS,
            teamExpectedLOS: validatedData.teamExpectedLOS,
            strengthsAndLimitations: validatedData.strengthsAndLimitations,
            familyInvolved: validatedData.familyInvolved,
            reasonForServices: validatedData.reasonForServices,
            currentBehavioralSymptoms: validatedData.currentBehavioralSymptoms,
            copingWithSymptoms: validatedData.copingWithSymptoms,
            symptomsLimitations: validatedData.symptomsLimitations,
            immediateUrgentNeeds: validatedData.immediateUrgentNeeds,
            signsOfImprovement: validatedData.signsOfImprovement,
            assistanceExpectations: validatedData.assistanceExpectations,
            involvedInTreatment: validatedData.involvedInTreatment,
            allergies: validatedData.allergies,
            historyNonCompliance: validatedData.historyNonCompliance,
            potentialViolence: validatedData.potentialViolence,
            medicalUrgency: validatedData.medicalUrgency,
            personalMedicalHX: validatedData.personalMedicalHX,
            familyMedicalHX: validatedData.familyMedicalHX,
            medicalConditions: validatedData.medicalConditions,
            height: validatedData.height,
            weight: validatedData.weight,
            bmi: validatedData.bmi,
            isCOT: validatedData.isCOT,
            personalPsychHX: validatedData.personalPsychHX,
            familyPsychHX: validatedData.familyPsychHX,
            treatmentPreferences: validatedData.treatmentPreferences,
            psychMedicationEfficacy: validatedData.psychMedicationEfficacy,
            suicideHistory: validatedData.suicideHistory,
            suicideAttemptDetails: validatedData.suicideAttemptDetails,
            currentSuicideIdeation: validatedData.currentSuicideIdeation,
            suicideIdeationDetails: validatedData.suicideIdeationDetails,
            mostRecentSuicideIdeation: validatedData.mostRecentSuicideIdeation,
            historySelfHarm: validatedData.historySelfHarm,
            selfHarmDetails: validatedData.selfHarmDetails,
            dtsRiskFactors: validatedData.dtsRiskFactors,
            dtsProtectiveFactors: validatedData.dtsProtectiveFactors,
            historyHarmingOthers: validatedData.historyHarmingOthers,
            harmingOthersDetails: validatedData.harmingOthersDetails,
            homicidalIdeation: validatedData.homicidalIdeation,
            homicidalIdeationDetails: validatedData.homicidalIdeationDetails,
            dtoRiskFactors: validatedData.dtoRiskFactors,
            dutyToWarnCompleted: validatedData.dutyToWarnCompleted,
            dutyToWarnDetails: validatedData.dutyToWarnDetails,
            previousHospitalizations: validatedData.previousHospitalizations,
            hospitalizationDetails: validatedData.hospitalizationDetails,
            hygieneSkills: validatedData.hygieneSkills,
            skillsContinuation: validatedData.skillsContinuation,
            phq9Responses: validatedData.phq9Responses,
            phq9TotalScore: validatedData.phq9TotalScore,
            treatmentObjectives: validatedData.treatmentObjectives,
            dischargePlanObjectives: validatedData.dischargePlanObjectives,
            supportSystem: validatedData.supportSystem,
            communityResources: validatedData.communityResources,
            criminalLegalHistory: validatedData.criminalLegalHistory,
            courtOrderedTreatment: validatedData.courtOrderedTreatment,
            courtOrderedDetails: validatedData.courtOrderedDetails,
            otherLegalIssues: validatedData.otherLegalIssues,
            substanceHistory: validatedData.substanceHistory,
            substanceUseTable: validatedData.substanceUseTable,
            drugOfChoice: validatedData.drugOfChoice,
            longestSobriety: validatedData.longestSobriety,
            substanceTreatmentHistory: validatedData.substanceTreatmentHistory,
            nicotineUse: validatedData.nicotineUse,
            nicotineDetails: validatedData.nicotineDetails,
            substanceImpact: validatedData.substanceImpact,
            historyOfAbuse: validatedData.historyOfAbuse,
            livingArrangements: validatedData.livingArrangements,
            sourceOfFinances: validatedData.sourceOfFinances,
            transportationMethod: validatedData.transportationMethod,
            adlChecklist: validatedData.adlChecklist,
            preferredActivities: validatedData.preferredActivities,
            significantOthers: validatedData.significantOthers,
            supportLevel: validatedData.supportLevel,
            typicalDay: validatedData.typicalDay,
            strengthsAbilitiesInterests: validatedData.strengthsAbilitiesInterests,
            healthNeeds: validatedData.healthNeeds,
            nutritionalNeeds: validatedData.nutritionalNeeds,
            spiritualNeeds: validatedData.spiritualNeeds,
            culturalNeeds: validatedData.culturalNeeds,
            educationHistory: validatedData.educationHistory,
            vocationalHistory: validatedData.vocationalHistory,
            crisisInterventionPlan: validatedData.crisisInterventionPlan,
            feedbackFrequency: validatedData.feedbackFrequency,
            dischargePlanning: validatedData.dischargePlanning,
            signatures: validatedData.signatures,
          },
        });

        // Handle medications update
        if (medications && Array.isArray(medications)) {
          await tx.intakeMedication.deleteMany({
            where: { intakeId: id },
          });

          if (medications.length > 0) {
            await tx.intakeMedication.createMany({
              data: medications.map(
                (med: {
                  name: string;
                  dosage?: string;
                  frequency?: string;
                  route?: string;
                  prescriber?: string;
                  purpose?: string;
                  startDate?: string;
                }) => ({
                  intakeId: id,
                  name: med.name,
                  dosage: med.dosage,
                  frequency: med.frequency,
                  route: med.route,
                  prescriber: med.prescriber,
                  purpose: med.purpose,
                  startDate: med.startDate ? new Date(med.startDate) : null,
                })
              ),
            });
          }
        }

        return updated;
      });

      await createAuditLog({
        userId: session.user.id,
        action: AuditActions.INTAKE_UPDATED,
        entityType: "Intake",
        entityId: id,
        details: {
          residentName: updatedIntake.residentName,
          updatedBy: "BHP",
        },
      });

      return NextResponse.json({ intake: updatedIntake });
    }

    // Handle BHP decisions (existing functionality)
    // Check if already decided
    if (intake.status !== "PENDING") {
      return NextResponse.json(
        { error: "Intake already has a decision" },
        { status: 400 }
      );
    }

    const validatedData = intakeDecisionSchema.parse(body);

    const updatedIntake = await prisma.intake.update({
      where: { id },
      data: {
        status: validatedData.status,
        decisionReason: validatedData.decisionReason,
        decidedAt: new Date(),
        decidedBy: session.user.id,
      },
    });

    const auditAction =
      validatedData.status === "APPROVED"
        ? AuditActions.INTAKE_APPROVED
        : validatedData.status === "CONDITIONAL"
        ? AuditActions.INTAKE_CONDITIONAL
        : AuditActions.INTAKE_DENIED;

    await createAuditLog({
      userId: session.user.id,
      action: auditAction,
      entityType: "Intake",
      entityId: intake.id,
      details: {
        residentName: intake.residentName,
        decision: validatedData.status,
        reason: validatedData.decisionReason,
      },
    });

    return NextResponse.json({ intake: updatedIntake });
  } catch (error) {
    console.error("Update intake error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update intake" },
      { status: 500 }
    );
  }
}
