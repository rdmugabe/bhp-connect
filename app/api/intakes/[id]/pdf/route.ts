import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { IntakePDF } from "@/lib/pdf/intake-template";

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

    // Fetch the intake with authorization check
    const intake = await prisma.intake.findUnique({
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
        medications: true,
      },
    });

    if (!intake) {
      return NextResponse.json(
        { error: "Intake not found" },
        { status: 404 }
      );
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

    // Helper to convert empty objects/arrays to null
    const emptyToNull = <T>(val: T): T | null => {
      if (val === null || val === undefined) return null;
      if (Array.isArray(val) && val.length === 0) return null;
      if (typeof val === 'object' && !(val instanceof Date) && Object.keys(val as object).length === 0) return null;
      return val;
    };

    // Helper to safely handle long text for PDF rendering
    // react-pdf layout engine can overflow with very long strings, causing the
    // "unsupported number" error. We truncate to a safe maximum length.
    const safeText = (text: string | null | undefined, maxLength = 4000): string | null => {
      if (!text) return null;
      // Truncate if exceeds max length to prevent react-pdf layout overflow
      if (text.length > maxLength) {
        return text.slice(0, maxLength) + '... [Content truncated for PDF - see full record in system]';
      }
      return text;
    };

    // Prepare PDF data - include all fields from intake
    const pdfData = {
      id: intake.id,
      residentName: intake.residentName,
      ssn: intake.ssn,
      dateOfBirth: intake.dateOfBirth.toISOString(),
      admissionDate: intake.admissionDate?.toISOString() || null,
      sex: intake.sex,
      ethnicity: intake.ethnicity,
      nativeAmericanTribe: intake.nativeAmericanTribe,
      language: intake.language,
      religion: intake.religion,
      sexualOrientation: intake.sexualOrientation,
      // Contact Info
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
      // Insurance
      insuranceProvider: intake.insuranceProvider,
      policyNumber: intake.policyNumber,
      groupNumber: intake.groupNumber,
      ahcccsHealthPlan: intake.ahcccsHealthPlan,
      hasDNR: intake.hasDNR,
      hasAdvancedDirective: intake.hasAdvancedDirective,
      hasWill: intake.hasWill,
      poaLegalGuardian: intake.poaLegalGuardian,
      // Referral
      referralSource: intake.referralSource,
      evaluatorName: intake.evaluatorName,
      evaluatorCredentials: intake.evaluatorCredentials,
      reasonsForReferral: safeText(intake.reasonsForReferral),
      residentNeeds: safeText(intake.residentNeeds),
      residentExpectedLOS: intake.residentExpectedLOS,
      teamExpectedLOS: intake.teamExpectedLOS,
      strengthsAndLimitations: safeText(intake.strengthsAndLimitations),
      familyInvolved: safeText(intake.familyInvolved),
      // Behavioral Symptoms
      reasonForServices: safeText(intake.reasonForServices),
      currentBehavioralSymptoms: safeText(intake.currentBehavioralSymptoms),
      copingWithSymptoms: safeText(intake.copingWithSymptoms),
      symptomsLimitations: safeText(intake.symptomsLimitations),
      immediateUrgentNeeds: safeText(intake.immediateUrgentNeeds),
      signsOfImprovement: safeText(intake.signsOfImprovement),
      assistanceExpectations: safeText(intake.assistanceExpectations),
      involvedInTreatment: safeText(intake.involvedInTreatment),
      // Medical
      allergies: intake.allergies,
      medications: emptyToNull(intake.medications) as { name: string; dosage?: string | null; frequency?: string | null; route?: string | null }[] | null,
      historyNonCompliance: intake.historyNonCompliance,
      potentialViolence: intake.potentialViolence,
      medicalUrgency: intake.medicalUrgency,
      personalMedicalHX: intake.personalMedicalHX,
      familyMedicalHX: intake.familyMedicalHX,
      medicalConditions: emptyToNull(intake.medicalConditions) ? JSON.stringify(intake.medicalConditions) : null,
      height: intake.height,
      weight: intake.weight,
      bmi: intake.bmi,
      // Psychiatric
      isCOT: intake.isCOT,
      personalPsychHX: safeText(intake.personalPsychHX),
      familyPsychHX: safeText(intake.familyPsychHX),
      treatmentPreferences: safeText(intake.treatmentPreferences),
      psychMedicationEfficacy: safeText(intake.psychMedicationEfficacy),
      // Risk Assessment - DTS
      suicideHistory: intake.suicideHistory,
      suicideAttemptDetails: intake.suicideAttemptDetails,
      currentSuicideIdeation: intake.currentSuicideIdeation,
      suicideIdeationDetails: intake.suicideIdeationDetails,
      mostRecentSuicideIdeation: intake.mostRecentSuicideIdeation,
      historySelfHarm: intake.historySelfHarm,
      selfHarmDetails: intake.selfHarmDetails,
      dtsRiskFactors: emptyToNull(intake.dtsRiskFactors) as Record<string, boolean> | null,
      dtsProtectiveFactors: emptyToNull(intake.dtsProtectiveFactors) as Record<string, boolean> | null,
      // Risk Assessment - DTO
      historyHarmingOthers: intake.historyHarmingOthers,
      harmingOthersDetails: intake.harmingOthersDetails,
      homicidalIdeation: intake.homicidalIdeation,
      homicidalIdeationDetails: intake.homicidalIdeationDetails,
      dtoRiskFactors: emptyToNull(intake.dtoRiskFactors) as Record<string, boolean> | null,
      dutyToWarnCompleted: intake.dutyToWarnCompleted,
      dutyToWarnDetails: intake.dutyToWarnDetails,
      previousHospitalizations: intake.previousHospitalizations,
      hospitalizationDetails: intake.hospitalizationDetails,
      // Developmental
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
      // Skills
      hygieneSkills: emptyToNull(intake.hygieneSkills) as Record<string, string> | null,
      skillsContinuation: emptyToNull(intake.skillsContinuation) as Record<string, string> | null,
      // PHQ-9
      phq9Responses: emptyToNull(intake.phq9Responses) as number[] | null,
      phq9TotalScore: intake.phq9TotalScore,
      // Treatment
      treatmentObjectives: safeText(intake.treatmentObjectives),
      dischargePlanObjectives: safeText(intake.dischargePlanObjectives),
      supportSystem: safeText(intake.supportSystem),
      communityResources: safeText(intake.communityResources),
      // Social/Education
      childhoodDescription: safeText(intake.childhoodDescription),
      abuseHistory: safeText(intake.abuseHistory),
      familyMentalHealthHistory: safeText(intake.familyMentalHealthHistory),
      relationshipStatus: intake.relationshipStatus,
      relationshipSatisfaction: safeText(intake.relationshipSatisfaction),
      friendsDescription: safeText(intake.friendsDescription),
      highestEducation: intake.highestEducation,
      specialEducation: intake.specialEducation,
      specialEducationDetails: safeText(intake.specialEducationDetails),
      plan504: intake.plan504,
      iep: intake.iep,
      educationDetails: safeText(intake.educationDetails),
      currentlyEmployed: intake.currentlyEmployed,
      employmentDetails: safeText(intake.employmentDetails),
      workVolunteerHistory: safeText(intake.workVolunteerHistory),
      employmentBarriers: safeText(intake.employmentBarriers),
      // Legal/Substance
      criminalLegalHistory: safeText(intake.criminalLegalHistory),
      courtOrderedTreatment: intake.courtOrderedTreatment,
      courtOrderedDetails: safeText(intake.courtOrderedDetails),
      otherLegalIssues: safeText(intake.otherLegalIssues),
      substanceHistory: safeText(intake.substanceHistory),
      substanceUseTable: emptyToNull(intake.substanceUseTable) as Record<string, unknown>[] | null,
      drugOfChoice: intake.drugOfChoice,
      longestSobriety: intake.longestSobriety,
      substanceTreatmentHistory: intake.substanceTreatmentHistory,
      nicotineUse: intake.nicotineUse,
      nicotineDetails: intake.nicotineDetails,
      substanceImpact: intake.substanceImpact,
      historyOfAbuse: intake.historyOfAbuse,
      // Living/ADLs
      livingArrangements: intake.livingArrangements,
      sourceOfFinances: intake.sourceOfFinances,
      transportationMethod: intake.transportationMethod,
      adlChecklist: emptyToNull(intake.adlChecklist) as Record<string, string> | null,
      preferredActivities: intake.preferredActivities,
      significantOthers: intake.significantOthers,
      supportLevel: intake.supportLevel,
      typicalDay: intake.typicalDay,
      strengthsAbilitiesInterests: intake.strengthsAbilitiesInterests,
      // Behavioral Observations
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
      // Diagnosis
      diagnosis: safeText(intake.diagnosis),
      treatmentRecommendation: safeText(intake.treatmentRecommendation),
      // Wellness
      healthNeeds: intake.healthNeeds,
      nutritionalNeeds: intake.nutritionalNeeds,
      spiritualNeeds: intake.spiritualNeeds,
      culturalNeeds: intake.culturalNeeds,
      educationHistory: intake.educationHistory,
      vocationalHistory: intake.vocationalHistory,
      // Crisis/Discharge
      crisisInterventionPlan: safeText(intake.crisisInterventionPlan),
      feedbackFrequency: intake.feedbackFrequency,
      dischargePlanning: safeText(intake.dischargePlanning),
      signatures: emptyToNull(intake.signatures) as Record<string, string> | null,
      // Status
      status: intake.status as "DRAFT" | "PENDING" | "APPROVED" | "CONDITIONAL" | "DENIED",
      decisionReason: intake.decisionReason,
      decidedAt: intake.decidedAt?.toISOString() || null,
      createdAt: intake.createdAt.toISOString(),
      facility: {
        name: intake.facility.name,
        address: intake.facility.address,
      },
      bhpName: intake.facility.bhp?.user?.name || "Unknown BHP",
    };

    // Generate PDF
    const pdfBuffer = await renderToBuffer(IntakePDF({ data: pdfData as unknown as Parameters<typeof IntakePDF>[0]['data'] }));

    // Log the PDF download for HIPAA compliance
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

    // Create filename
    const sanitizedName = intake.residentName
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 30);
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `intake_${sanitizedName}_${dateStr}.pdf`;

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
    console.error("Generate Intake PDF error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: "Failed to generate PDF", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
