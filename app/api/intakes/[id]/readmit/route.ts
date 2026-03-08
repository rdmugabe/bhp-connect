import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit";

// POST /api/intakes/[id]/readmit - Create a new intake for re-admission
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only BHRF role can re-admit residents
    if (session.user.role !== "BHRF") {
      return NextResponse.json(
        { error: "Only facility staff can re-admit residents" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Verify facility ownership
    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!bhrfProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const previousIntake = await prisma.intake.findUnique({
      where: { id },
      include: {
        medications: true,
      },
    });

    if (!previousIntake) {
      return NextResponse.json({ error: "Intake not found" }, { status: 404 });
    }

    if (previousIntake.facilityId !== bhrfProfile.facilityId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify previous intake is discharged
    if (!previousIntake.dischargedAt) {
      return NextResponse.json(
        { error: "Only discharged residents can be re-admitted" },
        { status: 400 }
      );
    }

    // Create new intake with copied data from previous intake
    // Copy demographics, contact info, insurance, medical/psychiatric history, etc.
    // Don't copy: admissionDate, current symptoms, treatment objectives, signatures, PHQ-9
    const newIntake = await prisma.$transaction(async (tx) => {
      const intake = await tx.intake.create({
        data: {
          facilityId: previousIntake.facilityId,
          submittedBy: session.user.id,
          status: "DRAFT",
          draftStep: 1,
          previousIntakeId: previousIntake.id,

          // Demographics - Copy
          residentName: previousIntake.residentName,
          ssn: previousIntake.ssn,
          dateOfBirth: previousIntake.dateOfBirth,
          // admissionDate - Don't copy, will be set to new admission date
          sex: previousIntake.sex,
          ethnicity: previousIntake.ethnicity,
          nativeAmericanTribe: previousIntake.nativeAmericanTribe,
          language: previousIntake.language,
          religion: previousIntake.religion,
          sexualOrientation: previousIntake.sexualOrientation,

          // Contact Information - Copy
          patientAddress: previousIntake.patientAddress,
          patientPhone: previousIntake.patientPhone,
          patientEmail: previousIntake.patientEmail,
          contactPreference: previousIntake.contactPreference,

          // Emergency Contact - Copy
          emergencyContactName: previousIntake.emergencyContactName,
          emergencyContactRelationship: previousIntake.emergencyContactRelationship,
          emergencyContactPhone: previousIntake.emergencyContactPhone,
          emergencyContactAddress: previousIntake.emergencyContactAddress,

          // Healthcare Providers - Copy
          primaryCarePhysician: previousIntake.primaryCarePhysician,
          primaryCarePhysicianPhone: previousIntake.primaryCarePhysicianPhone,
          caseManagerName: previousIntake.caseManagerName,
          caseManagerPhone: previousIntake.caseManagerPhone,

          // Insurance & Directives - Copy
          insuranceProvider: previousIntake.insuranceProvider,
          policyNumber: previousIntake.policyNumber,
          groupNumber: previousIntake.groupNumber,
          ahcccsHealthPlan: previousIntake.ahcccsHealthPlan,
          hasDNR: previousIntake.hasDNR,
          hasAdvancedDirective: previousIntake.hasAdvancedDirective,
          hasWill: previousIntake.hasWill,
          poaLegalGuardian: previousIntake.poaLegalGuardian,

          // Medical History - Copy
          allergies: previousIntake.allergies,
          medicalConditions: previousIntake.medicalConditions ?? undefined,
          personalMedicalHX: previousIntake.personalMedicalHX,
          familyMedicalHX: previousIntake.familyMedicalHX,
          height: previousIntake.height,
          weight: previousIntake.weight,
          bmi: previousIntake.bmi,

          // Psychiatric History - Copy
          isCOT: previousIntake.isCOT,
          personalPsychHX: previousIntake.personalPsychHX,
          familyPsychHX: previousIntake.familyPsychHX,
          treatmentPreferences: previousIntake.treatmentPreferences,
          psychMedicationEfficacy: previousIntake.psychMedicationEfficacy,

          // Risk History (for context) - Copy
          suicideHistory: previousIntake.suicideHistory,
          historySelfHarm: previousIntake.historySelfHarm,
          historyHarmingOthers: previousIntake.historyHarmingOthers,
          previousHospitalizations: previousIntake.previousHospitalizations,
          hospitalizationDetails: previousIntake.hospitalizationDetails,

          // Developmental History - Copy
          inUteroExposure: previousIntake.inUteroExposure,
          inUteroExposureDetails: previousIntake.inUteroExposureDetails,
          developmentalMilestones: previousIntake.developmentalMilestones,
          developmentalDetails: previousIntake.developmentalDetails,
          speechDifficulties: previousIntake.speechDifficulties,
          speechDetails: previousIntake.speechDetails,
          visualImpairment: previousIntake.visualImpairment,
          visualDetails: previousIntake.visualDetails,
          hearingImpairment: previousIntake.hearingImpairment,
          hearingDetails: previousIntake.hearingDetails,
          motorSkillsImpairment: previousIntake.motorSkillsImpairment,
          motorSkillsDetails: previousIntake.motorSkillsDetails,
          cognitiveImpairment: previousIntake.cognitiveImpairment,
          cognitiveDetails: previousIntake.cognitiveDetails,
          socialSkillsDeficits: previousIntake.socialSkillsDeficits,
          socialSkillsDetails: previousIntake.socialSkillsDetails,
          immunizationStatus: previousIntake.immunizationStatus,

          // Social History - Copy
          childhoodDescription: previousIntake.childhoodDescription,
          abuseHistory: previousIntake.abuseHistory,
          familyMentalHealthHistory: previousIntake.familyMentalHealthHistory,
          relationshipStatus: previousIntake.relationshipStatus,
          relationshipSatisfaction: previousIntake.relationshipSatisfaction,
          friendsDescription: previousIntake.friendsDescription,

          // Education History - Copy
          highestEducation: previousIntake.highestEducation,
          specialEducation: previousIntake.specialEducation,
          specialEducationDetails: previousIntake.specialEducationDetails,
          plan504: previousIntake.plan504,
          iep: previousIntake.iep,
          educationDetails: previousIntake.educationDetails,

          // Employment History - Copy
          currentlyEmployed: previousIntake.currentlyEmployed,
          employmentDetails: previousIntake.employmentDetails,
          workVolunteerHistory: previousIntake.workVolunteerHistory,
          employmentBarriers: previousIntake.employmentBarriers,

          // Legal History - Copy
          criminalLegalHistory: previousIntake.criminalLegalHistory,
          courtOrderedTreatment: previousIntake.courtOrderedTreatment,
          courtOrderedDetails: previousIntake.courtOrderedDetails,
          otherLegalIssues: previousIntake.otherLegalIssues,

          // Substance Use History - Copy
          substanceHistory: previousIntake.substanceHistory,
          substanceUseTable: previousIntake.substanceUseTable ?? undefined,
          drugOfChoice: previousIntake.drugOfChoice,
          longestSobriety: previousIntake.longestSobriety,
          substanceTreatmentHistory: previousIntake.substanceTreatmentHistory,
          nicotineUse: previousIntake.nicotineUse,
          nicotineDetails: previousIntake.nicotineDetails,
          historyOfAbuse: previousIntake.historyOfAbuse,

          // Don't copy (need fresh assessment):
          // - admissionDate (new admission)
          // - reasonForServices, currentBehavioralSymptoms (current state)
          // - copingWithSymptoms, symptomsLimitations
          // - immediateUrgentNeeds, signsOfImprovement
          // - assistanceExpectations, involvedInTreatment
          // - currentSuicideIdeation, suicideIdeationDetails
          // - suicideAttemptDetails, mostRecentSuicideIdeation
          // - selfHarmDetails, dtsRiskFactors, dtsProtectiveFactors
          // - harmingOthersDetails, homicidalIdeation, homicidalIdeationDetails
          // - dtoRiskFactors, dutyToWarnCompleted, dutyToWarnDetails
          // - hygieneSkills, skillsContinuation
          // - phq9Responses, phq9TotalScore
          // - treatmentObjectives, dischargePlanObjectives
          // - supportSystem, communityResources
          // - livingArrangements, sourceOfFinances, transportationMethod
          // - adlChecklist, preferredActivities, etc.
          // - All behavioral observations
          // - diagnosis, treatmentRecommendation
          // - All wellness fields
          // - crisisInterventionPlan, feedbackFrequency, dischargePlanning
          // - signatures
        },
      });

      // Copy medications
      if (previousIntake.medications.length > 0) {
        await tx.intakeMedication.createMany({
          data: previousIntake.medications.map((med) => ({
            intakeId: intake.id,
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            route: med.route,
            prescriber: med.prescriber,
            purpose: med.purpose,
            startDate: med.startDate,
          })),
        });
      }

      return intake;
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.INTAKE_READMIT_CREATED,
      entityType: "Intake",
      entityId: newIntake.id,
      details: {
        residentName: newIntake.residentName,
        previousIntakeId: previousIntake.id,
      },
    });

    return NextResponse.json({
      success: true,
      intake: newIntake,
      redirectUrl: `/facility/intakes/${newIntake.id}/edit`,
    });
  } catch (error) {
    console.error("Re-admit intake error:", error);
    return NextResponse.json(
      { error: "Failed to create re-admission intake" },
      { status: 500 }
    );
  }
}
