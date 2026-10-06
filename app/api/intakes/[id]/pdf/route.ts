import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { buildIntakeDocx, intakeDocxFilename } from "@/lib/intake-docx";
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

    const intake = await prisma.intake.findUnique({
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
        medications: true,
      },
    });

    if (!intake) {
      return NextResponse.json({ error: "Intake not found" }, { status: 404 });
    }

    // Authorization check based on role
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
    } else if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const emptyToNull = <T>(val: T): T | null => {
      if (val === null || val === undefined) return null;
      if (Array.isArray(val) && val.length === 0) return null;
      if (typeof val === "object" && !(val instanceof Date) && Object.keys(val as object).length === 0) return null;
      return val;
    };

    const docxData = {
      id: intake.id,
      residentName: intake.residentName,
      ssn: intake.ssn,
      dateOfBirth: intake.dateOfBirth,
      admissionDate: intake.admissionDate,
      sex: intake.sex,
      ethnicity: intake.ethnicity,
      nativeAmericanTribe: intake.nativeAmericanTribe,
      language: intake.language,
      religion: intake.religion,
      sexualOrientation: intake.sexualOrientation,

      patientAddress: intake.patientAddress,
      patientPhone: intake.patientPhone,
      patientEmail: intake.patientEmail,
      contactPreference: intake.contactPreference,
      emergencyContactName: intake.emergencyContactName,
      emergencyContactRelationship: intake.emergencyContactRelationship,
      emergencyContactPhone: intake.emergencyContactPhone,
      emergencyContactAddress: intake.emergencyContactAddress,
      primaryCarePhysician: intake.primaryCarePhysician,
      primaryCarePhysicianPhone: intake.primaryCarePhysicianPhone,
      caseManagerName: intake.caseManagerName,
      caseManagerPhone: intake.caseManagerPhone,

      insuranceProvider: intake.insuranceProvider,
      policyNumber: intake.policyNumber,
      groupNumber: intake.groupNumber,
      ahcccsHealthPlan: intake.ahcccsHealthPlan,
      hasDNR: intake.hasDNR,
      hasAdvancedDirective: intake.hasAdvancedDirective,
      hasWill: intake.hasWill,
      poaLegalGuardian: intake.poaLegalGuardian,

      referralSource: intake.referralSource,
      evaluatorName: intake.evaluatorName,
      evaluatorCredentials: intake.evaluatorCredentials,
      reasonsForReferral: intake.reasonsForReferral,
      residentNeeds: intake.residentNeeds,
      residentExpectedLOS: intake.residentExpectedLOS,
      teamExpectedLOS: intake.teamExpectedLOS,
      strengthsAndLimitations: intake.strengthsAndLimitations,
      familyInvolved: intake.familyInvolved,

      reasonForServices: intake.reasonForServices,
      currentBehavioralSymptoms: intake.currentBehavioralSymptoms,
      copingWithSymptoms: intake.copingWithSymptoms,
      symptomsLimitations: intake.symptomsLimitations,
      immediateUrgentNeeds: intake.immediateUrgentNeeds,
      signsOfImprovement: intake.signsOfImprovement,
      assistanceExpectations: intake.assistanceExpectations,
      involvedInTreatment: intake.involvedInTreatment,

      allergies: intake.allergies,
      medications: emptyToNull(intake.medications) as
        | { name: string; dosage?: string | null; frequency?: string | null; route?: string | null }[]
        | null,
      historyNonCompliance: intake.historyNonCompliance,
      potentialViolence: intake.potentialViolence,
      medicalUrgency: intake.medicalUrgency,
      personalMedicalHX: intake.personalMedicalHX,
      familyMedicalHX: intake.familyMedicalHX,
      medicalConditions: emptyToNull(intake.medicalConditions) ? JSON.stringify(intake.medicalConditions) : null,
      height: intake.height,
      weight: intake.weight,
      bmi: intake.bmi,

      isCOT: intake.isCOT,
      personalPsychHX: intake.personalPsychHX,
      familyPsychHX: intake.familyPsychHX,
      treatmentPreferences: intake.treatmentPreferences,
      psychMedicationEfficacy: intake.psychMedicationEfficacy,

      suicideHistory: intake.suicideHistory,
      suicideAttemptDetails: intake.suicideAttemptDetails,
      currentSuicideIdeation: intake.currentSuicideIdeation,
      suicideIdeationDetails: intake.suicideIdeationDetails,
      mostRecentSuicideIdeation: intake.mostRecentSuicideIdeation,
      historySelfHarm: intake.historySelfHarm,
      selfHarmDetails: intake.selfHarmDetails,
      dtsRiskFactors: emptyToNull(intake.dtsRiskFactors) as Record<string, boolean> | null,
      dtsProtectiveFactors: emptyToNull(intake.dtsProtectiveFactors) as Record<string, boolean> | null,

      historyHarmingOthers: intake.historyHarmingOthers,
      harmingOthersDetails: intake.harmingOthersDetails,
      homicidalIdeation: intake.homicidalIdeation,
      homicidalIdeationDetails: intake.homicidalIdeationDetails,
      dtoRiskFactors: emptyToNull(intake.dtoRiskFactors) as Record<string, boolean> | null,
      dutyToWarnCompleted: intake.dutyToWarnCompleted,
      dutyToWarnDetails: intake.dutyToWarnDetails,
      previousHospitalizations: intake.previousHospitalizations,
      hospitalizationDetails: intake.hospitalizationDetails,

      inUteroExposure: intake.inUteroExposure,
      inUteroExposureDetails: intake.inUteroExposureDetails,
      developmentalMilestones: intake.developmentalMilestones,
      developmentalDetails: intake.developmentalDetails,
      speechDifficulties: intake.speechDifficulties,
      speechDetails: intake.speechDetails,
      visualImpairment: intake.visualImpairment,
      visualDetails: intake.visualDetails,
      hearingImpairment: intake.hearingImpairment,
      hearingDetails: intake.hearingDetails,
      motorSkillsImpairment: intake.motorSkillsImpairment,
      motorSkillsDetails: intake.motorSkillsDetails,
      cognitiveImpairment: intake.cognitiveImpairment,
      cognitiveDetails: intake.cognitiveDetails,
      socialSkillsDeficits: intake.socialSkillsDeficits,
      socialSkillsDetails: intake.socialSkillsDetails,
      immunizationStatus: intake.immunizationStatus,

      hygieneSkills: emptyToNull(intake.hygieneSkills) as Record<string, string> | null,
      skillsContinuation: emptyToNull(intake.skillsContinuation) as Record<string, string> | null,

      phq9Responses: emptyToNull(intake.phq9Responses) as number[] | null,
      phq9TotalScore: intake.phq9TotalScore,

      treatmentObjectives: intake.treatmentObjectives,
      dischargePlanObjectives: intake.dischargePlanObjectives,
      supportSystem: intake.supportSystem,
      communityResources: intake.communityResources,

      childhoodDescription: intake.childhoodDescription,
      abuseHistory: intake.abuseHistory,
      familyMentalHealthHistory: intake.familyMentalHealthHistory,
      relationshipStatus: intake.relationshipStatus,
      relationshipSatisfaction: intake.relationshipSatisfaction,
      friendsDescription: intake.friendsDescription,
      highestEducation: intake.highestEducation,
      specialEducation: intake.specialEducation,
      specialEducationDetails: intake.specialEducationDetails,
      plan504: intake.plan504,
      iep: intake.iep,
      educationDetails: intake.educationDetails,
      currentlyEmployed: intake.currentlyEmployed,
      employmentDetails: intake.employmentDetails,
      workVolunteerHistory: intake.workVolunteerHistory,
      employmentBarriers: intake.employmentBarriers,

      criminalLegalHistory: intake.criminalLegalHistory,
      courtOrderedTreatment: intake.courtOrderedTreatment,
      courtOrderedDetails: intake.courtOrderedDetails,
      otherLegalIssues: intake.otherLegalIssues,
      substanceHistory: intake.substanceHistory,
      substanceUseTable: emptyToNull(intake.substanceUseTable) as Record<string, unknown>[] | null,
      drugOfChoice: intake.drugOfChoice,
      longestSobriety: intake.longestSobriety,
      substanceTreatmentHistory: intake.substanceTreatmentHistory,
      nicotineUse: intake.nicotineUse,
      nicotineDetails: intake.nicotineDetails,
      substanceImpact: intake.substanceImpact,
      historyOfAbuse: intake.historyOfAbuse,

      livingArrangements: intake.livingArrangements,
      sourceOfFinances: intake.sourceOfFinances,
      transportationMethod: intake.transportationMethod,
      adlChecklist: emptyToNull(intake.adlChecklist) as Record<string, string> | null,
      preferredActivities: intake.preferredActivities,
      significantOthers: intake.significantOthers,
      supportLevel: intake.supportLevel,
      typicalDay: intake.typicalDay,
      strengthsAbilitiesInterests: intake.strengthsAbilitiesInterests,

      appearanceAge: intake.appearanceAge,
      appearanceHeight: intake.appearanceHeight,
      appearanceWeight: intake.appearanceWeight,
      appearanceAttire: intake.appearanceAttire,
      appearanceGrooming: intake.appearanceGrooming,
      appearanceDescription: intake.appearanceDescription,
      demeanorMood: intake.demeanorMood,
      demeanorAffect: intake.demeanorAffect,
      demeanorEyeContact: intake.demeanorEyeContact,
      demeanorCooperation: intake.demeanorCooperation,
      demeanorDescription: intake.demeanorDescription,
      speechArticulation: intake.speechArticulation,
      speechTone: intake.speechTone,
      speechRate: intake.speechRate,
      speechLatency: intake.speechLatency,
      speechDescription: intake.speechDescription,
      motorGait: intake.motorGait,
      motorPosture: intake.motorPosture,
      motorActivity: intake.motorActivity,
      motorMannerisms: intake.motorMannerisms,
      motorDescription: intake.motorDescription,
      cognitionThoughtContent: intake.cognitionThoughtContent,
      cognitionThoughtProcess: intake.cognitionThoughtProcess,
      cognitionDelusions: intake.cognitionDelusions,
      cognitionPerception: intake.cognitionPerception,
      cognitionJudgment: intake.cognitionJudgment,
      cognitionImpulseControl: intake.cognitionImpulseControl,
      cognitionInsight: intake.cognitionInsight,
      cognitionDescription: intake.cognitionDescription,
      estimatedIntelligence: intake.estimatedIntelligence,

      diagnosis: intake.diagnosis,
      treatmentRecommendation: intake.treatmentRecommendation,

      healthNeeds: intake.healthNeeds,
      nutritionalNeeds: intake.nutritionalNeeds,
      spiritualNeeds: intake.spiritualNeeds,
      culturalNeeds: intake.culturalNeeds,

      crisisInterventionPlan: intake.crisisInterventionPlan,
      feedbackFrequency: intake.feedbackFrequency,
      dischargePlanning: intake.dischargePlanning,
      signatures: emptyToNull(intake.signatures) as Record<string, string> | null,

      status: intake.status,
      decisionReason: intake.decisionReason,
      decidedAt: intake.decidedAt,
      createdAt: intake.createdAt,
      facility: {
        name: intake.facility.name,
        address: intake.facility.address,
      },
      bhpName: intake.facility.bhp?.user?.name || "Unknown BHP",
    };

    const docxBuffer = await buildIntakeDocx(docxData);

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.INTAKE_PDF_DOWNLOADED,
      entityType: "Intake",
      entityId: intake.id,
      details: {
        residentName: intake.residentName,
        facilityName: intake.facility.name,
        downloadedBy: session.user.name,
        downloadedByRole: session.user.role,
      },
    });

    const filename = intakeDocxFilename({ residentName: intake.residentName }, getTodayArizona());

    return new NextResponse(new Uint8Array(docxBuffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
      },
    });
  } catch (error) {
    console.error("Generate Intake DOCX error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    return NextResponse.json(
      { error: "Failed to generate document", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
