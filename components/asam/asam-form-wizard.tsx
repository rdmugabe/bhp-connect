"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ASAMProgress } from "./asam-progress";
import { Step1Demographics } from "./steps/step1-demographics";
import { Step2SubstanceUse } from "./steps/step2-substance-use";
import { Step3Biomedical } from "./steps/step3-biomedical";
import { Step4Emotional } from "./steps/step4-emotional";
import { Step5Readiness } from "./steps/step5-readiness";
import { Step6Relapse } from "./steps/step6-relapse";
import { Step7Recovery } from "./steps/step7-recovery";
import { Step8Summary } from "./steps/step8-summary";
import {
  asamStep1Schema,
  asamStep2Schema,
  asamStep3Schema,
  asamStep4Schema,
  asamStep5Schema,
  asamStep6Schema,
  asamStep7Schema,
  asamStep8Schema,
  asamSchema,
} from "@/lib/validations";
import { ArrowLeft, ArrowRight, Loader2, Save, FileDown } from "lucide-react";

const TOTAL_STEPS = 8;

const STEP_LABELS = [
  "Demographics",
  "Substance Use",
  "Biomedical",
  "Emotional/Cognitive",
  "Readiness",
  "Relapse Potential",
  "Recovery Env",
  "Summary",
];

const stepSchemas = [
  asamStep1Schema,
  asamStep2Schema,
  asamStep3Schema,
  asamStep4Schema,
  asamStep5Schema,
  asamStep6Schema,
  asamStep7Schema,
  asamStep8Schema,
];

type FormData = z.input<typeof asamSchema>;

interface ASAMFormWizardProps {
  assessmentId?: string;
  initialData?: Partial<FormData> & { draftStep?: number };
}

export function ASAMFormWizard({ assessmentId, initialData }: ASAMFormWizardProps = {}) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(initialData?.draftStep || 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const methods = useForm<FormData>({
    resolver: zodResolver(asamSchema),
    defaultValues: {
      // Step 1: Demographics
      patientName: "",
      assessmentDate: new Date().toISOString().split("T")[0],
      phoneNumber: "",
      okayToLeaveVoicemail: false,
      patientAddress: "",
      dateOfBirth: "",
      age: undefined,
      gender: "",
      raceEthnicity: "",
      preferredLanguage: "English",
      ahcccsId: "",
      otherInsuranceId: "",
      insuranceType: "",
      insurancePlan: "",
      livingArrangement: "",
      referredBy: "",
      reasonForTreatment: "",
      currentSymptoms: "",

      // Step 2: Dimension 1 - Substance Use
      substanceUseHistory: [],
      usingMoreThanIntended: false,
      usingMoreDetails: "",
      physicallyIllWhenStopping: false,
      physicallyIllDetails: "",
      currentWithdrawalSymptoms: false,
      withdrawalSymptomsDetails: "",
      historyOfSeriousWithdrawal: false,
      seriousWithdrawalDetails: "",
      toleranceIncreased: false,
      toleranceDetails: "",
      recentUseChanges: false,
      recentUseChangesDetails: "",
      familySubstanceHistory: "",
      dimension1Severity: undefined,
      dimension1Comments: "",

      // Step 3: Dimension 2 - Biomedical
      medicalProviders: [],
      medicalConditions: {},
      conditionsInterfere: false,
      conditionsInterfereDetails: "",
      priorHospitalizations: "",
      lifeThreatening: false,
      medicalMedications: [],
      dimension2Severity: undefined,
      dimension2Comments: "",

      // Step 4: Dimension 3 - Emotional/Behavioral/Cognitive
      moodSymptoms: {},
      anxietySymptoms: {},
      psychosisSymptoms: {},
      otherSymptoms: {},
      suicidalThoughts: false,
      suicidalThoughtsDetails: "",
      thoughtsOfHarmingOthers: false,
      harmingOthersDetails: "",
      abuseHistory: "",
      traumaticEvents: "",
      mentalIllnessDiagnosed: false,
      mentalIllnessDetails: "",
      previousPsychTreatment: false,
      psychTreatmentDetails: "",
      hallucinationsPresent: false,
      hallucinationsDetails: "",
      furtherMHAssessmentNeeded: false,
      furtherMHAssessmentDetails: "",
      psychiatricMedications: [],
      mentalHealthProviders: [],
      dimension3Severity: undefined,
      dimension3Comments: "",

      // Step 5: Dimension 4 - Readiness to Change
      areasAffectedByUse: {},
      continueUseDespiteEffects: false,
      continueUseDetails: "",
      previousTreatmentHelp: false,
      treatmentProviders: [],
      recoverySupport: "",
      recoveryBarriers: "",
      treatmentImportanceAlcohol: "",
      treatmentImportanceDrugs: "",
      treatmentImportanceDetails: "",
      dimension4Severity: undefined,
      dimension4Comments: "",

      // Step 6: Dimension 5 - Relapse Potential
      cravingsFrequencyAlcohol: "",
      cravingsFrequencyDrugs: "",
      cravingsDetails: "",
      timeSearchingForSubstances: false,
      timeSearchingDetails: "",
      relapseWithoutTreatment: false,
      relapseDetails: "",
      awareOfTriggers: false,
      triggersList: {},
      copingWithTriggers: "",
      attemptsToControl: "",
      longestSobriety: "",
      whatHelped: "",
      whatDidntHelp: "",
      dimension5Severity: undefined,
      dimension5Comments: "",

      // Step 7: Dimension 6 - Recovery Environment
      supportiveRelationships: "",
      currentLivingSituation: "",
      othersUsingDrugsInEnvironment: false,
      othersUsingDetails: "",
      safetyThreats: false,
      safetyThreatsDetails: "",
      negativeImpactRelationships: false,
      negativeImpactDetails: "",
      currentlyEmployedOrSchool: false,
      employmentSchoolDetails: "",
      socialServicesInvolved: false,
      socialServicesDetails: "",
      probationParoleOfficer: "",
      probationParoleContact: "",
      dimension6Severity: undefined,
      dimension6Comments: "",

      // Step 8: Summary
      summaryRationale: {},
      dsm5Criteria: [],
      dsm5Diagnoses: "",
      levelOfCareDetermination: {},
      matInterested: false,
      matDetails: "",
      recommendedLevelOfCare: "",
      levelOfCareProvided: "",
      discrepancyReason: "",
      discrepancyExplanation: "",
      designatedTreatmentLocation: "",
      designatedProviderName: "",
      counselorName: "",
      counselorSignatureDate: new Date().toISOString().split("T")[0],
      bhpLphaName: "",
      bhpLphaSignatureDate: "",
    },
    mode: "onBlur",
  });

  // Load initial data if editing a draft
  useEffect(() => {
    if (initialData) {
      const formattedData = {
        ...initialData,
        dateOfBirth: initialData.dateOfBirth
          ? new Date(initialData.dateOfBirth).toISOString().split("T")[0]
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
      const url = assessmentId ? `/api/asam/${assessmentId}` : "/api/asam";
      const method = assessmentId ? "PATCH" : "POST";

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

      if (!assessmentId && result.assessment?.id) {
        router.push(`/facility/asam/${result.assessment.id}/edit`);
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
      const url = assessmentId ? `/api/asam/${assessmentId}` : "/api/asam";
      const method = assessmentId ? "PATCH" : "POST";

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
        throw new Error(result.error || "Failed to submit assessment");
      }

      toast({
        title: "ASAM Assessment Submitted",
        description: "The ASAM assessment has been submitted for BHP review.",
      });

      router.push("/facility/asam");
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit assessment",
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
        return <Step2SubstanceUse />;
      case 3:
        return <Step3Biomedical />;
      case 4:
        return <Step4Emotional />;
      case 5:
        return <Step5Readiness />;
      case 6:
        return <Step6Relapse />;
      case 7:
        return <Step7Recovery />;
      case 8:
        return <Step8Summary />;
      default:
        return null;
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <ASAMProgress
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
                  Submit Assessment
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}
