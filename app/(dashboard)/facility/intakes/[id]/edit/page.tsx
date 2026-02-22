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
  residentName: string;
  ssn: string | null;
  dateOfBirth: string;
  sex: string | null;
  ethnicity: string | null;
  nativeAmericanTribe: string | null;
  language: string | null;
  religion: string | null;
  insuranceProvider: string | null;
  policyNumber: string | null;
  groupNumber: string | null;
  hasDNR: boolean;
  hasAdvancedDirective: boolean;
  hasWill: boolean;
  poaLegalGuardian: string | null;
  reasonsForReferral: string | null;
  residentNeeds: string | null;
  residentExpectedLOS: string | null;
  teamExpectedLOS: string | null;
  strengthsAndLimitations: string | null;
  familyInvolved: string | null;
  allergies: string | null;
  historyNonCompliance: boolean;
  potentialViolence: boolean;
  medicalUrgency: string | null;
  personalMedicalHX: string | null;
  familyMedicalHX: string | null;
  isCOT: boolean;
  personalPsychHX: string | null;
  familyPsychHX: string | null;
  suicideHistory: string | null;
  currentSuicideIdeation: boolean;
  historyHarmingOthers: boolean;
  historySelfHarm: boolean;
  previousHospitalizations: string | null;
  hospitalizationDetails: string | null;
  hygieneSkills: Record<string, string> | null;
  skillsContinuation: Record<string, string> | null;
  phq9Responses: number[] | null;
  phq9TotalScore: number | null;
  treatmentObjectives: string | null;
  dischargePlanObjectives: string | null;
  supportSystem: string | null;
  communityResources: string | null;
  criminalLegalHistory: string | null;
  substanceHistory: string | null;
  nicotineUse: boolean;
  historyOfAbuse: string | null;
  adlChecklist: Record<string, string> | null;
  preferredActivities: string | null;
  significantOthers: string | null;
  supportLevel: string | null;
  healthNeeds: string | null;
  nutritionalNeeds: string | null;
  spiritualNeeds: string | null;
  culturalNeeds: string | null;
  educationHistory: string | null;
  vocationalHistory: string | null;
  crisisInterventionPlan: string | null;
  feedbackFrequency: string | null;
  dischargePlanning: string | null;
  signatures: Record<string, string> | null;
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
    residentName: intake.residentName || "",
    ssn: intake.ssn || "",
    dateOfBirth: intake.dateOfBirth,
    sex: intake.sex || "",
    ethnicity: intake.ethnicity || "",
    nativeAmericanTribe: intake.nativeAmericanTribe || "",
    language: intake.language || "",
    religion: intake.religion || "",
    insuranceProvider: intake.insuranceProvider || "",
    policyNumber: intake.policyNumber || "",
    groupNumber: intake.groupNumber || "",
    hasDNR: intake.hasDNR,
    hasAdvancedDirective: intake.hasAdvancedDirective,
    hasWill: intake.hasWill,
    poaLegalGuardian: intake.poaLegalGuardian || "",
    reasonsForReferral: intake.reasonsForReferral || "",
    residentNeeds: intake.residentNeeds || "",
    residentExpectedLOS: intake.residentExpectedLOS || "",
    teamExpectedLOS: intake.teamExpectedLOS || "",
    strengthsAndLimitations: intake.strengthsAndLimitations || "",
    familyInvolved: intake.familyInvolved || "",
    allergies: intake.allergies || "",
    historyNonCompliance: intake.historyNonCompliance,
    potentialViolence: intake.potentialViolence,
    medicalUrgency: intake.medicalUrgency || "",
    personalMedicalHX: intake.personalMedicalHX || "",
    familyMedicalHX: intake.familyMedicalHX || "",
    isCOT: intake.isCOT,
    personalPsychHX: intake.personalPsychHX || "",
    familyPsychHX: intake.familyPsychHX || "",
    suicideHistory: intake.suicideHistory || "",
    currentSuicideIdeation: intake.currentSuicideIdeation,
    historyHarmingOthers: intake.historyHarmingOthers,
    historySelfHarm: intake.historySelfHarm,
    previousHospitalizations: intake.previousHospitalizations || "",
    hospitalizationDetails: intake.hospitalizationDetails || "",
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
    phq9Responses: intake.phq9Responses || [0, 0, 0, 0, 0, 0, 0, 0, 0],
    phq9TotalScore: intake.phq9TotalScore || 0,
    treatmentObjectives: intake.treatmentObjectives || "",
    dischargePlanObjectives: intake.dischargePlanObjectives || "",
    supportSystem: intake.supportSystem || "",
    communityResources: intake.communityResources || "",
    criminalLegalHistory: intake.criminalLegalHistory || "",
    substanceHistory: intake.substanceHistory || "",
    nicotineUse: intake.nicotineUse,
    historyOfAbuse: intake.historyOfAbuse || "",
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
    healthNeeds: intake.healthNeeds || "",
    nutritionalNeeds: intake.nutritionalNeeds || "",
    spiritualNeeds: intake.spiritualNeeds || "",
    culturalNeeds: intake.culturalNeeds || "",
    educationHistory: intake.educationHistory || "",
    vocationalHistory: intake.vocationalHistory || "",
    crisisInterventionPlan: intake.crisisInterventionPlan || "",
    feedbackFrequency: intake.feedbackFrequency || "",
    dischargePlanning: intake.dischargePlanning || "",
    signatures: intake.signatures || {
      residentSignature: "",
      staffSignature: "",
      date: new Date().toISOString().split("T")[0],
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
