"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { IntakeProgress } from "./intake-progress";
import { Step1Demographics } from "./steps/step1-demographics";
import { Step2Contact } from "./steps/step2-contact";
import { Step2Insurance } from "./steps/step2-insurance";
import { Step3Referral } from "./steps/step3-referral";
import { Step5BehavioralSymptoms } from "./steps/step5-behavioral-symptoms";
import { Step4Medical } from "./steps/step4-medical";
import { Step5Psychiatric } from "./steps/step5-psychiatric";
import { Step6Risk } from "./steps/step6-risk";
import { Step9Developmental } from "./steps/step9-developmental";
import { Step7Skills } from "./steps/step7-skills";
import { Step8PHQ9 } from "./steps/step8-phq9";
import { Step9Treatment } from "./steps/step9-treatment";
import { Step13SocialEducation } from "./steps/step13-social-education";
import { Step10History } from "./steps/step10-history";
import { Step11ADLs } from "./steps/step11-adls";
import { Step16BehavioralObservations } from "./steps/step16-behavioral-observations";
import { Step12Wellness } from "./steps/step12-wellness";
import {
  intakeStep1Schema,
  intakeStep2Schema,
  intakeStep3Schema,
  intakeStep4Schema,
  intakeStep5Schema,
  intakeStep6Schema,
  intakeStep7Schema,
  intakeStep8Schema,
  intakeStep9Schema,
  intakeStep10Schema,
  intakeStep11Schema,
  intakeStep12Schema,
  intakeStep13Schema,
  intakeStep14Schema,
  intakeStep15Schema,
  intakeStep16Schema,
  intakeStep17Schema,
  intakeSchema,
} from "@/lib/validations";
import { ArrowLeft, ArrowRight, Loader2, Save, FileDown } from "lucide-react";

const TOTAL_STEPS = 17;

const STEP_LABELS = [
  "Demographics",
  "Contact Info",
  "Insurance",
  "Referral",
  "Symptoms",
  "Medical",
  "Psychiatric",
  "Risk",
  "Developmental",
  "Skills",
  "PHQ-9",
  "Treatment",
  "Social/Education",
  "Legal/Substance",
  "Living/ADLs",
  "Observations",
  "Wellness",
];

const stepSchemas = [
  intakeStep1Schema,
  intakeStep2Schema,
  intakeStep3Schema,
  intakeStep4Schema,
  intakeStep5Schema,
  intakeStep6Schema,
  intakeStep7Schema,
  intakeStep8Schema,
  intakeStep9Schema,
  intakeStep10Schema,
  intakeStep11Schema,
  intakeStep12Schema,
  intakeStep13Schema,
  intakeStep14Schema,
  intakeStep15Schema,
  intakeStep16Schema,
  intakeStep17Schema,
];

// Use the combined schema from validations
type FormData = z.input<typeof intakeSchema>;

interface IntakeFormWizardProps {
  intakeId?: string;
  initialData?: Partial<FormData> & { draftStep?: number };
}

export function IntakeFormWizard({ intakeId, initialData }: IntakeFormWizardProps = {}) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(initialData?.draftStep || 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const methods = useForm<FormData>({
    resolver: zodResolver(intakeSchema),
    defaultValues: {
      // Step 1: Demographics
      residentName: "",
      ssn: "",
      dateOfBirth: "",
      admissionDate: "",
      sex: "",
      sexualOrientation: "",
      ethnicity: "Native American",
      language: "English",
      religion: "",

      // Step 2: Contact & Emergency
      patientAddress: "",
      patientPhone: "",
      patientEmail: "",
      contactPreference: "",
      emergencyContactName: "",
      emergencyContactRelationship: "",
      emergencyContactPhone: "",
      emergencyContactAddress: "",
      primaryCarePhysician: "",
      primaryCarePhysicianPhone: "",
      caseManagerName: "",
      caseManagerPhone: "",

      // Step 3: Insurance
      insuranceProvider: "",
      policyNumber: "",
      groupNumber: "",
      ahcccsHealthPlan: "",
      hasDNR: false,
      hasAdvancedDirective: false,
      hasWill: false,
      poaLegalGuardian: "",

      // Step 4: Referral
      referralSource: "",
      evaluatorName: "",
      evaluatorCredentials: "",
      reasonsForReferral: "",
      residentNeeds: "",
      residentExpectedLOS: "",
      teamExpectedLOS: "",
      strengthsAndLimitations: "",
      familyInvolved: "",

      // Step 5: Behavioral Symptoms
      reasonForServices: "",
      currentBehavioralSymptoms: "",
      copingWithSymptoms: "",
      symptomsLimitations: "",
      immediateUrgentNeeds: "",
      signsOfImprovement: "",
      assistanceExpectations: "",
      involvedInTreatment: "",

      // Step 6: Medical
      allergies: "",
      historyNonCompliance: false,
      potentialViolence: false,
      medicalUrgency: "",
      personalMedicalHX: "",
      familyMedicalHX: "",
      medicalConditions: {},
      height: "",
      weight: "",
      bmi: "",

      // Step 7: Psychiatric
      isCOT: false,
      personalPsychHX: "",
      familyPsychHX: "",
      treatmentPreferences: "",
      psychMedicationEfficacy: "",

      // Step 8: Risk Assessment
      suicideHistory: "",
      suicideAttemptDetails: "",
      currentSuicideIdeation: false,
      suicideIdeationDetails: "",
      mostRecentSuicideIdeation: "",
      historySelfHarm: false,
      selfHarmDetails: "",
      dtsRiskFactors: {},
      dtsProtectiveFactors: {},
      historyHarmingOthers: false,
      harmingOthersDetails: "",
      homicidalIdeation: false,
      homicidalIdeationDetails: "",
      dtoRiskFactors: {},
      dutyToWarnCompleted: false,
      dutyToWarnDetails: "",
      previousHospitalizations: "",
      hospitalizationDetails: "",

      // Step 9: Developmental History
      inUteroExposure: false,
      inUteroExposureDetails: "",
      developmentalMilestones: "",
      developmentalDetails: "",
      speechDifficulties: false,
      speechDetails: "",
      visualImpairment: false,
      visualDetails: "",
      hearingImpairment: false,
      hearingDetails: "",
      motorSkillsImpairment: false,
      motorSkillsDetails: "",
      cognitiveImpairment: false,
      cognitiveDetails: "",
      socialSkillsDeficits: false,
      socialSkillsDetails: "",
      immunizationStatus: "",

      // Step 10: Skills Assessment
      hygieneSkills: {
        bathing: "",
        grooming: "",
        dressing: "",
        toileting: "",
        oralCare: "",
      },
      skillsContinuation: {
        mealPrep: "",
        housekeeping: "",
        laundry: "",
        money: "",
        transportation: "",
        communication: "",
        medication: "",
      },

      // Step 11: PHQ-9
      phq9Responses: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      phq9TotalScore: 0,

      // Step 12: Treatment
      treatmentObjectives: "",
      dischargePlanObjectives: "",
      supportSystem: "",
      communityResources: "",

      // Step 13: Social & Education History
      childhoodDescription: "",
      abuseHistory: "",
      familyMentalHealthHistory: "",
      relationshipStatus: "",
      relationshipSatisfaction: "",
      friendsDescription: "",
      highestEducation: "",
      specialEducation: false,
      specialEducationDetails: "",
      plan504: false,
      iep: false,
      educationDetails: "",
      currentlyEmployed: false,
      employmentDetails: "",
      workVolunteerHistory: "",
      employmentBarriers: "",

      // Step 14: Legal & Substance History
      criminalLegalHistory: "",
      courtOrderedTreatment: false,
      courtOrderedDetails: "",
      otherLegalIssues: "",
      substanceHistory: "",
      substanceUseTable: [],
      drugOfChoice: "",
      longestSobriety: "",
      substanceTreatmentHistory: "",
      nicotineUse: false,
      nicotineDetails: "",
      substanceImpact: "",
      historyOfAbuse: "",

      // Step 15: Living Situation & ADLs
      livingArrangements: "",
      sourceOfFinances: "",
      transportationMethod: "",
      adlChecklist: {
        eating: "",
        bathing: "",
        dressing: "",
        toileting: "",
        transferring: "",
        continence: "",
      },
      preferredActivities: "",
      significantOthers: "",
      supportLevel: "",
      typicalDay: "",
      strengthsAbilitiesInterests: "",

      // Step 16: Behavioral Observations
      appearanceAge: "",
      appearanceHeight: "",
      appearanceWeight: "",
      appearanceAttire: "",
      appearanceGrooming: "",
      appearanceDescription: "",
      demeanorMood: "",
      demeanorAffect: "",
      demeanorEyeContact: "",
      demeanorCooperation: "",
      demeanorDescription: "",
      speechArticulation: "",
      speechTone: "",
      speechRate: "",
      speechLatency: "",
      speechDescription: "",
      motorGait: "",
      motorPosture: "",
      motorActivity: "",
      motorMannerisms: "",
      motorDescription: "",
      cognitionThoughtContent: "",
      cognitionThoughtProcess: "",
      cognitionDelusions: "",
      cognitionPerception: "",
      cognitionJudgment: "",
      cognitionImpulseControl: "",
      cognitionInsight: "",
      cognitionDescription: "",
      estimatedIntelligence: "",

      // Step 17: Wellness & Final Review
      healthNeeds: "",
      nutritionalNeeds: "",
      spiritualNeeds: "",
      culturalNeeds: "",
      educationHistory: "",
      vocationalHistory: "",
      crisisInterventionPlan: "",
      feedbackFrequency: "",
      dischargePlanning: "",
      diagnosis: "",
      treatmentRecommendation: "",
      signatures: {
        clientSignature: "",
        clientSignatureDate: new Date().toISOString().split("T")[0],
        assessorSignature: "",
        assessorSignatureDate: new Date().toISOString().split("T")[0],
        clinicalOversightSignature: "",
        clinicalOversightSignatureDate: "",
      },
    },
    mode: "onBlur",
  });

  // Load initial data if editing a draft
  useEffect(() => {
    if (initialData) {
      // Format the date of birth if it exists
      const formattedData = {
        ...initialData,
        dateOfBirth: initialData.dateOfBirth
          ? new Date(initialData.dateOfBirth).toISOString().split("T")[0]
          : "",
        admissionDate: initialData.admissionDate
          ? new Date(initialData.admissionDate).toISOString().split("T")[0]
          : "",
      };
      methods.reset(formattedData as FormData);
    }
  }, [initialData, methods]);

  const validateCurrentStep = async (): Promise<boolean> => {
    const schema = stepSchemas[currentStep - 1];
    const values = methods.getValues();

    try {
      await schema.parseAsync(values);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.issues.forEach((issue) => {
          methods.setError(issue.path.join(".") as keyof FormData, {
            type: "manual",
            message: issue.message,
          });
        });
      }
      return false;
    }
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const data = methods.getValues();
      const url = intakeId ? `/api/intakes/${intakeId}` : "/api/intakes";
      const method = intakeId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          isDraft: true,
          currentStep,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to save draft");
      }

      const result = await response.json();

      toast({
        title: "Draft Saved",
        description: "Your progress has been saved. You can continue later.",
      });

      // If this was a new draft, redirect to the edit page
      if (!intakeId && result.intake?.id) {
        router.push(`/facility/intakes/${result.intake.id}/edit`);
      }

      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save draft",
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const url = intakeId ? `/api/intakes/${intakeId}` : "/api/intakes";
      const method = intakeId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          isDraft: false,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to submit intake");
      }

      toast({
        title: "Intake Submitted",
        description: "The intake assessment has been submitted for BHP review.",
      });

      router.push("/facility/intakes");
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit intake",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Demographics />;
      case 2:
        return <Step2Contact />;
      case 3:
        return <Step2Insurance />;
      case 4:
        return <Step3Referral />;
      case 5:
        return <Step5BehavioralSymptoms />;
      case 6:
        return <Step4Medical />;
      case 7:
        return <Step5Psychiatric />;
      case 8:
        return <Step6Risk />;
      case 9:
        return <Step9Developmental />;
      case 10:
        return <Step7Skills />;
      case 11:
        return <Step8PHQ9 />;
      case 12:
        return <Step9Treatment />;
      case 13:
        return <Step13SocialEducation />;
      case 14:
        return <Step10History />;
      case 15:
        return <Step11ADLs />;
      case 16:
        return <Step16BehavioralObservations />;
      case 17:
        return <Step12Wellness />;
      default:
        return null;
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <IntakeProgress
              currentStep={currentStep}
              totalSteps={TOTAL_STEPS}
              stepLabels={STEP_LABELS}
            />
          </CardContent>
        </Card>

        {renderStep()}

        <div className="flex justify-between pt-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSaveDraft}
              disabled={isSavingDraft || isSubmitting}
            >
              {isSavingDraft ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FileDown className="mr-2 h-4 w-4" />
                  Save Draft
                </>
              )}
            </Button>
          </div>

          {currentStep < TOTAL_STEPS ? (
            <Button type="button" onClick={handleNext}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting || isSavingDraft}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Submit Intake
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}
