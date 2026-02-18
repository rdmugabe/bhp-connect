import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { intakeSchema, intakeDraftSchema } from "@/lib/validations";
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

    let intakes;

    if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile) {
        return NextResponse.json({ intakes: [] });
      }

      intakes = await prisma.intake.findMany({
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
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile) {
        return NextResponse.json({ intakes: [] });
      }

      intakes = await prisma.intake.findMany({
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
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ intakes });
  } catch (error) {
    console.error("Get intakes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch intakes" },
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
    const { medications, isDraft, currentStep, ...intakeData } = body;

    // Use appropriate schema based on draft status
    const validatedData = isDraft
      ? intakeDraftSchema.parse({ ...intakeData, currentStep })
      : intakeSchema.parse(intakeData);

    // Create intake with medications in a transaction
    const intake = await prisma.$transaction(async (tx) => {
      const newIntake = await tx.intake.create({
        data: {
          facilityId: bhrfProfile.facilityId,
          status: isDraft ? "DRAFT" : "APPROVED",
          // Demographics
          residentName: validatedData.residentName || "Draft Intake",
          ssn: validatedData.ssn,
          dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : new Date(),
          admissionDate: validatedData.admissionDate ? new Date(validatedData.admissionDate) : null,
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
          // Workflow
          submittedBy: session.user.id,
          draftStep: isDraft ? (currentStep || 1) : null,
        },
      });

      // Create medications if provided
      if (medications && Array.isArray(medications) && medications.length > 0) {
        await tx.intakeMedication.createMany({
          data: medications.map((med: { name: string; dosage?: string; frequency?: string; route?: string; prescriber?: string; purpose?: string; startDate?: string }) => ({
            intakeId: newIntake.id,
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            route: med.route,
            prescriber: med.prescriber,
            purpose: med.purpose,
            startDate: med.startDate ? new Date(med.startDate) : null,
          })),
        });
      }

      return newIntake;
    });

    await createAuditLog({
      userId: session.user.id,
      action: isDraft ? AuditActions.INTAKE_DRAFT_SAVED : AuditActions.INTAKE_SUBMITTED,
      entityType: "Intake",
      entityId: intake.id,
      details: {
        residentName: intake.residentName,
        ...(isDraft && { draftStep: currentStep || 1 }),
      },
    });

    return NextResponse.json({ intake }, { status: 201 });
  } catch (error) {
    console.error("Create intake error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create intake" },
      { status: 500 }
    );
  }
}
