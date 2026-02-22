"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IntakeFormWizard } from "@/components/intakes/intake-form-wizard";
import { ArrowLeft, AlertTriangle, Loader2 } from "lucide-react";

interface IntakeData {
  id: string;
  status: string;
  draftStep: number | null;
  // Demographics
  residentName: string;
  ssn: string | null;
  dateOfBirth: string;
  admissionDate: string | null;
  sex: string | null;
  sexualOrientation: string | null;
  ethnicity: string | null;
  nativeAmericanTribe: string | null;
  language: string | null;
  religion: string | null;
  // Contact Information
  patientAddress: string | null;
  patientPhone: string | null;
  patientEmail: string | null;
  contactPreference: string | null;
  // Emergency Contact
  emergencyContactName: string | null;
  emergencyContactRelationship: string | null;
  emergencyContactPhone: string | null;
  emergencyContactAddress: string | null;
  // Healthcare Providers
  primaryCarePhysician: string | null;
  primaryCarePhysicianPhone: string | null;
  caseManagerName: string | null;
  caseManagerPhone: string | null;
  // Insurance & Directives
  insuranceProvider: string | null;
  policyNumber: string | null;
  groupNumber: string | null;
  ahcccsHealthPlan: string | null;
  hasDNR: boolean;
  hasAdvancedDirective: boolean;
  hasWill: boolean;
  poaLegalGuardian: string | null;
  // Referral
  referralSource: string | null;
  evaluatorName: string | null;
  evaluatorCredentials: string | null;
  reasonsForReferral: string | null;
  residentNeeds: string | null;
  residentExpectedLOS: string | null;
  teamExpectedLOS: string | null;
  strengthsAndLimitations: string | null;
  familyInvolved: string | null;
  // Behavioral Health Symptoms
  reasonForServices: string | null;
  currentBehavioralSymptoms: string | null;
  copingWithSymptoms: string | null;
  symptomsLimitations: string | null;
  immediateUrgentNeeds: string | null;
  signsOfImprovement: string | null;
  assistanceExpectations: string | null;
  involvedInTreatment: string | null;
  // Medical
  allergies: string | null;
  historyNonCompliance: boolean;
  potentialViolence: boolean;
  medicalUrgency: string | null;
  personalMedicalHX: string | null;
  familyMedicalHX: string | null;
  medicalConditions: Record<string, boolean> | null;
  height: string | null;
  weight: string | null;
  bmi: string | null;
  // Psychiatric
  isCOT: boolean;
  personalPsychHX: string | null;
  familyPsychHX: string | null;
  treatmentPreferences: string | null;
  psychMedicationEfficacy: string | null;
  // Risk Assessment
  suicideHistory: string | null;
  suicideAttemptDetails: string | null;
  currentSuicideIdeation: boolean;
  suicideIdeationDetails: string | null;
  mostRecentSuicideIdeation: string | null;
  historySelfHarm: boolean;
  selfHarmDetails: string | null;
  dtsRiskFactors: Record<string, boolean> | null;
  dtsProtectiveFactors: Record<string, boolean> | null;
  historyHarmingOthers: boolean;
  harmingOthersDetails: string | null;
  homicidalIdeation: boolean;
  homicidalIdeationDetails: string | null;
  dtoRiskFactors: Record<string, boolean> | null;
  dutyToWarnCompleted: boolean;
  dutyToWarnDetails: string | null;
  previousHospitalizations: string | null;
  hospitalizationDetails: string | null;
  // Developmental History
  inUteroExposure: boolean;
  inUteroExposureDetails: string | null;
  developmentalMilestones: string | null;
  developmentalDetails: string | null;
  speechDifficulties: boolean;
  speechDetails: string | null;
  visualImpairment: boolean;
  visualDetails: string | null;
  hearingImpairment: boolean;
  hearingDetails: string | null;
  motorSkillsImpairment: boolean;
  motorSkillsDetails: string | null;
  cognitiveImpairment: boolean;
  cognitiveDetails: string | null;
  socialSkillsDeficits: boolean;
  socialSkillsDetails: string | null;
  immunizationStatus: string | null;
  // Skills Assessment
  hygieneSkills: Record<string, string> | null;
  skillsContinuation: Record<string, string> | null;
  // PHQ-9
  phq9Responses: number[] | null;
  phq9TotalScore: number | null;
  // Treatment
  treatmentObjectives: string | null;
  dischargePlanObjectives: string | null;
  supportSystem: string | null;
  communityResources: string | null;
  // Social History
  childhoodDescription: string | null;
  abuseHistory: string | null;
  familyMentalHealthHistory: string | null;
  relationshipStatus: string | null;
  relationshipSatisfaction: string | null;
  friendsDescription: string | null;
  // Education History
  highestEducation: string | null;
  specialEducation: boolean;
  specialEducationDetails: string | null;
  plan504: boolean;
  iep: boolean;
  educationDetails: string | null;
  // Employment History
  currentlyEmployed: boolean;
  employmentDetails: string | null;
  workVolunteerHistory: string | null;
  employmentBarriers: string | null;
  // Legal History
  criminalLegalHistory: string | null;
  courtOrderedTreatment: boolean;
  courtOrderedDetails: string | null;
  otherLegalIssues: string | null;
  // Substance Use History
  substanceHistory: string | null;
  substanceUseTable: Array<Record<string, string>> | null;
  drugOfChoice: string | null;
  longestSobriety: string | null;
  substanceTreatmentHistory: string | null;
  nicotineUse: boolean;
  nicotineDetails: string | null;
  substanceImpact: string | null;
  historyOfAbuse: string | null;
  // Current Living Situation
  livingArrangements: string | null;
  sourceOfFinances: string | null;
  transportationMethod: string | null;
  // ADLs
  adlChecklist: Record<string, string> | null;
  preferredActivities: string | null;
  significantOthers: string | null;
  supportLevel: string | null;
  typicalDay: string | null;
  strengthsAbilitiesInterests: string | null;
  // Behavioral Observations
  appearanceAge: string | null;
  appearanceHeight: string | null;
  appearanceWeight: string | null;
  appearanceAttire: string | null;
  appearanceGrooming: string | null;
  appearanceDescription: string | null;
  demeanorMood: string | null;
  demeanorAffect: string | null;
  demeanorEyeContact: string | null;
  demeanorCooperation: string | null;
  demeanorDescription: string | null;
  speechArticulation: string | null;
  speechTone: string | null;
  speechRate: string | null;
  speechLatency: string | null;
  speechDescription: string | null;
  motorGait: string | null;
  motorPosture: string | null;
  motorActivity: string | null;
  motorMannerisms: string | null;
  motorDescription: string | null;
  cognitionThoughtContent: string | null;
  cognitionThoughtProcess: string | null;
  cognitionDelusions: string | null;
  cognitionPerception: string | null;
  cognitionJudgment: string | null;
  cognitionImpulseControl: string | null;
  cognitionInsight: string | null;
  cognitionDescription: string | null;
  estimatedIntelligence: string | null;
  // Wellness
  healthNeeds: string | null;
  nutritionalNeeds: string | null;
  spiritualNeeds: string | null;
  culturalNeeds: string | null;
  educationHistory: string | null;
  vocationalHistory: string | null;
  // Crisis/Discharge
  crisisInterventionPlan: string | null;
  feedbackFrequency: string | null;
  dischargePlanning: string | null;
  // Diagnosis
  diagnosis: string | null;
  treatmentRecommendation: string | null;
  // Signatures
  signatures: Record<string, string> | null;
  // Medications
  medications: { name: string; dosage: string; frequency: string }[];
}

export default function EditIntakePage() {
  const params = useParams();
  const router = useRouter();
  const [intake, setIntake] = useState<IntakeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIntake = async () => {
      try {
        const response = await fetch(`/api/intakes/${params.id}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to fetch intake");
        }
        const data = await response.json();
        setIntake(data.intake);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load intake");
      } finally {
        setIsLoading(false);
      }
    };

    fetchIntake();
  }, [params.id, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !intake) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-destructive">{error || "Intake not found"}</p>
        <Link href="/facility/intakes">
          <Button variant="outline">Back to Intakes</Button>
        </Link>
      </div>
    );
  }

  // Transform intake data for the form
  const initialData = {
    // Demographics
    residentName: intake.residentName || "",
    ssn: intake.ssn || "",
    dateOfBirth: intake.dateOfBirth,
    admissionDate: intake.admissionDate || "",
    sex: intake.sex || "",
    sexualOrientation: intake.sexualOrientation || "",
    ethnicity: intake.ethnicity || "",
    nativeAmericanTribe: intake.nativeAmericanTribe || "",
    language: intake.language || "",
    religion: intake.religion || "",
    // Contact Information
    patientAddress: intake.patientAddress || "",
    patientPhone: intake.patientPhone || "",
    patientEmail: intake.patientEmail || "",
    contactPreference: intake.contactPreference || "",
    // Emergency Contact
    emergencyContactName: intake.emergencyContactName || "",
    emergencyContactRelationship: intake.emergencyContactRelationship || "",
    emergencyContactPhone: intake.emergencyContactPhone || "",
    emergencyContactAddress: intake.emergencyContactAddress || "",
    // Healthcare Providers
    primaryCarePhysician: intake.primaryCarePhysician || "",
    primaryCarePhysicianPhone: intake.primaryCarePhysicianPhone || "",
    caseManagerName: intake.caseManagerName || "",
    caseManagerPhone: intake.caseManagerPhone || "",
    // Insurance & Directives
    insuranceProvider: intake.insuranceProvider || "",
    policyNumber: intake.policyNumber || "",
    groupNumber: intake.groupNumber || "",
    ahcccsHealthPlan: intake.ahcccsHealthPlan || "",
    hasDNR: intake.hasDNR,
    hasAdvancedDirective: intake.hasAdvancedDirective,
    hasWill: intake.hasWill,
    poaLegalGuardian: intake.poaLegalGuardian || "",
    // Referral
    referralSource: intake.referralSource || "",
    evaluatorName: intake.evaluatorName || "",
    evaluatorCredentials: intake.evaluatorCredentials || "",
    reasonsForReferral: intake.reasonsForReferral || "",
    residentNeeds: intake.residentNeeds || "",
    residentExpectedLOS: intake.residentExpectedLOS || "",
    teamExpectedLOS: intake.teamExpectedLOS || "",
    strengthsAndLimitations: intake.strengthsAndLimitations || "",
    familyInvolved: intake.familyInvolved || "",
    // Behavioral Health Symptoms
    reasonForServices: intake.reasonForServices || "",
    currentBehavioralSymptoms: intake.currentBehavioralSymptoms || "",
    copingWithSymptoms: intake.copingWithSymptoms || "",
    symptomsLimitations: intake.symptomsLimitations || "",
    immediateUrgentNeeds: intake.immediateUrgentNeeds || "",
    signsOfImprovement: intake.signsOfImprovement || "",
    assistanceExpectations: intake.assistanceExpectations || "",
    involvedInTreatment: intake.involvedInTreatment || "",
    // Medical
    allergies: intake.allergies || "",
    historyNonCompliance: intake.historyNonCompliance,
    potentialViolence: intake.potentialViolence,
    medicalUrgency: intake.medicalUrgency || "",
    personalMedicalHX: intake.personalMedicalHX || "",
    familyMedicalHX: intake.familyMedicalHX || "",
    medicalConditions: intake.medicalConditions || {},
    height: intake.height || "",
    weight: intake.weight || "",
    bmi: intake.bmi || "",
    // Psychiatric
    isCOT: intake.isCOT,
    personalPsychHX: intake.personalPsychHX || "",
    familyPsychHX: intake.familyPsychHX || "",
    treatmentPreferences: intake.treatmentPreferences || "",
    psychMedicationEfficacy: intake.psychMedicationEfficacy || "",
    // Risk Assessment
    suicideHistory: intake.suicideHistory || "",
    suicideAttemptDetails: intake.suicideAttemptDetails || "",
    currentSuicideIdeation: intake.currentSuicideIdeation,
    suicideIdeationDetails: intake.suicideIdeationDetails || "",
    mostRecentSuicideIdeation: intake.mostRecentSuicideIdeation || "",
    historySelfHarm: intake.historySelfHarm,
    selfHarmDetails: intake.selfHarmDetails || "",
    dtsRiskFactors: intake.dtsRiskFactors || {},
    dtsProtectiveFactors: intake.dtsProtectiveFactors || {},
    historyHarmingOthers: intake.historyHarmingOthers,
    harmingOthersDetails: intake.harmingOthersDetails || "",
    homicidalIdeation: intake.homicidalIdeation,
    homicidalIdeationDetails: intake.homicidalIdeationDetails || "",
    dtoRiskFactors: intake.dtoRiskFactors || {},
    dutyToWarnCompleted: intake.dutyToWarnCompleted,
    dutyToWarnDetails: intake.dutyToWarnDetails || "",
    previousHospitalizations: intake.previousHospitalizations || "",
    hospitalizationDetails: intake.hospitalizationDetails || "",
    // Developmental History
    inUteroExposure: intake.inUteroExposure,
    inUteroExposureDetails: intake.inUteroExposureDetails || "",
    developmentalMilestones: intake.developmentalMilestones || "",
    developmentalDetails: intake.developmentalDetails || "",
    speechDifficulties: intake.speechDifficulties,
    speechDetails: intake.speechDetails || "",
    visualImpairment: intake.visualImpairment,
    visualDetails: intake.visualDetails || "",
    hearingImpairment: intake.hearingImpairment,
    hearingDetails: intake.hearingDetails || "",
    motorSkillsImpairment: intake.motorSkillsImpairment,
    motorSkillsDetails: intake.motorSkillsDetails || "",
    cognitiveImpairment: intake.cognitiveImpairment,
    cognitiveDetails: intake.cognitiveDetails || "",
    socialSkillsDeficits: intake.socialSkillsDeficits,
    socialSkillsDetails: intake.socialSkillsDetails || "",
    immunizationStatus: intake.immunizationStatus || "",
    // Skills Assessment
    hygieneSkills: intake.hygieneSkills || {
      bathing: "",
      grooming: "",
      dressing: "",
      toileting: "",
      oralCare: "",
    },
    skillsContinuation: intake.skillsContinuation || {
      mealPrep: "",
      housekeeping: "",
      laundry: "",
      money: "",
      transportation: "",
      communication: "",
      medication: "",
    },
    // PHQ-9
    phq9Responses: intake.phq9Responses || [0, 0, 0, 0, 0, 0, 0, 0, 0],
    phq9TotalScore: intake.phq9TotalScore || 0,
    // Treatment
    treatmentObjectives: intake.treatmentObjectives || "",
    dischargePlanObjectives: intake.dischargePlanObjectives || "",
    supportSystem: intake.supportSystem || "",
    communityResources: intake.communityResources || "",
    // Social History
    childhoodDescription: intake.childhoodDescription || "",
    abuseHistory: intake.abuseHistory || "",
    familyMentalHealthHistory: intake.familyMentalHealthHistory || "",
    relationshipStatus: intake.relationshipStatus || "",
    relationshipSatisfaction: intake.relationshipSatisfaction || "",
    friendsDescription: intake.friendsDescription || "",
    // Education History
    highestEducation: intake.highestEducation || "",
    specialEducation: intake.specialEducation,
    specialEducationDetails: intake.specialEducationDetails || "",
    plan504: intake.plan504,
    iep: intake.iep,
    educationDetails: intake.educationDetails || "",
    // Employment History
    currentlyEmployed: intake.currentlyEmployed,
    employmentDetails: intake.employmentDetails || "",
    workVolunteerHistory: intake.workVolunteerHistory || "",
    employmentBarriers: intake.employmentBarriers || "",
    // Legal History
    criminalLegalHistory: intake.criminalLegalHistory || "",
    courtOrderedTreatment: intake.courtOrderedTreatment,
    courtOrderedDetails: intake.courtOrderedDetails || "",
    otherLegalIssues: intake.otherLegalIssues || "",
    // Substance Use History
    substanceHistory: intake.substanceHistory || "",
    substanceUseTable: intake.substanceUseTable || [],
    drugOfChoice: intake.drugOfChoice || "",
    longestSobriety: intake.longestSobriety || "",
    substanceTreatmentHistory: intake.substanceTreatmentHistory || "",
    nicotineUse: intake.nicotineUse,
    nicotineDetails: intake.nicotineDetails || "",
    substanceImpact: intake.substanceImpact || "",
    historyOfAbuse: intake.historyOfAbuse || "",
    // Current Living Situation
    livingArrangements: intake.livingArrangements || "",
    sourceOfFinances: intake.sourceOfFinances || "",
    transportationMethod: intake.transportationMethod || "",
    // ADLs
    adlChecklist: intake.adlChecklist || {
      eating: "",
      bathing: "",
      dressing: "",
      toileting: "",
      transferring: "",
      continence: "",
    },
    preferredActivities: intake.preferredActivities || "",
    significantOthers: intake.significantOthers || "",
    supportLevel: intake.supportLevel || "",
    typicalDay: intake.typicalDay || "",
    strengthsAbilitiesInterests: intake.strengthsAbilitiesInterests || "",
    // Behavioral Observations
    appearanceAge: intake.appearanceAge || "",
    appearanceHeight: intake.appearanceHeight || "",
    appearanceWeight: intake.appearanceWeight || "",
    appearanceAttire: intake.appearanceAttire || "",
    appearanceGrooming: intake.appearanceGrooming || "",
    appearanceDescription: intake.appearanceDescription || "",
    demeanorMood: intake.demeanorMood || "",
    demeanorAffect: intake.demeanorAffect || "",
    demeanorEyeContact: intake.demeanorEyeContact || "",
    demeanorCooperation: intake.demeanorCooperation || "",
    demeanorDescription: intake.demeanorDescription || "",
    speechArticulation: intake.speechArticulation || "",
    speechTone: intake.speechTone || "",
    speechRate: intake.speechRate || "",
    speechLatency: intake.speechLatency || "",
    speechDescription: intake.speechDescription || "",
    motorGait: intake.motorGait || "",
    motorPosture: intake.motorPosture || "",
    motorActivity: intake.motorActivity || "",
    motorMannerisms: intake.motorMannerisms || "",
    motorDescription: intake.motorDescription || "",
    cognitionThoughtContent: intake.cognitionThoughtContent || "",
    cognitionThoughtProcess: intake.cognitionThoughtProcess || "",
    cognitionDelusions: intake.cognitionDelusions || "",
    cognitionPerception: intake.cognitionPerception || "",
    cognitionJudgment: intake.cognitionJudgment || "",
    cognitionImpulseControl: intake.cognitionImpulseControl || "",
    cognitionInsight: intake.cognitionInsight || "",
    cognitionDescription: intake.cognitionDescription || "",
    estimatedIntelligence: intake.estimatedIntelligence || "",
    // Wellness
    healthNeeds: intake.healthNeeds || "",
    nutritionalNeeds: intake.nutritionalNeeds || "",
    spiritualNeeds: intake.spiritualNeeds || "",
    culturalNeeds: intake.culturalNeeds || "",
    educationHistory: intake.educationHistory || "",
    vocationalHistory: intake.vocationalHistory || "",
    // Crisis/Discharge
    crisisInterventionPlan: intake.crisisInterventionPlan || "",
    feedbackFrequency: intake.feedbackFrequency || "",
    dischargePlanning: intake.dischargePlanning || "",
    // Diagnosis
    diagnosis: intake.diagnosis || "",
    treatmentRecommendation: intake.treatmentRecommendation || "",
    // Signatures
    signatures: intake.signatures || {
      clientSignature: "",
      clientSignatureDate: new Date().toISOString().split("T")[0],
      assessorSignature: "",
      assessorSignatureDate: new Date().toISOString().split("T")[0],
      clinicalOversightSignature: "",
      clinicalOversightSignatureDate: "",
    },
    draftStep: intake.draftStep || 1,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/facility/intakes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Continue Intake Assessment
          </h1>
          <p className="text-muted-foreground">
            {intake.residentName !== "Draft Intake"
              ? `Editing intake for ${intake.residentName}`
              : "Continue filling out the intake form"}
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-blue-800">
            {intake.status === "DRAFT" ? "Draft Mode" : "Edit Mode"}
          </p>
          <p className="text-sm text-blue-700">
            {intake.status === "DRAFT"
              ? "You are editing a saved draft. Your progress will be saved automatically when you click \"Save Draft\". Submit the intake when you're ready."
              : "You are editing a submitted intake. Changes will be saved when you click \"Save Changes\"."}
          </p>
        </div>
      </div>

      <IntakeFormWizard intakeId={intake.id} initialData={initialData} />
    </div>
  );
}
