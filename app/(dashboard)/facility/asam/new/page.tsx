"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertTriangle, Loader2, UserCheck, Calendar, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface AvailableIntake {
  id: string;
  residentName: string;
  dateOfBirth: string;
  sex: string | null;
  ethnicity: string | null;
  language: string | null;
  patientPhone: string | null;
  patientAddress: string | null;
  insuranceProvider: string | null;
  policyNumber: string | null;
  ahcccsHealthPlan: string | null;
  livingArrangements: string | null;
  referralSource: string | null;
  reasonsForReferral: string | null;
  currentBehavioralSymptoms: string | null;
  allergies: string | null;
  medicalConditions: Record<string, boolean> | null;
  personalMedicalHX: string | null;
  familyMedicalHX: string | null;
  personalPsychHX: string | null;
  familyPsychHX: string | null;
  suicideHistory: boolean;
  currentSuicideIdeation: boolean;
  historyHarmingOthers: boolean;
  homicidalIdeation: boolean;
  substanceHistory: string | null;
  substanceUseTable: unknown[] | null;
  drugOfChoice: string | null;
  longestSobriety: string | null;
  abuseHistory: string | null;
  criminalLegalHistory: string | null;
  currentlyEmployed: boolean;
  employmentDetails: string | null;
  decidedAt: string | null;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default function NewASAMPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [intakes, setIntakes] = useState<AvailableIntake[]>([]);
  const [selectedIntake, setSelectedIntake] = useState<AvailableIntake | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchIntakes = async () => {
      try {
        const response = await fetch("/api/asam/intakes");
        if (!response.ok) {
          throw new Error("Failed to fetch intakes");
        }
        const data = await response.json();
        setIntakes(data.intakes);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load available intakes",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchIntakes();
  }, [toast]);

  const handleStartASAM = async () => {
    if (!selectedIntake) return;

    setCreating(true);
    try {
      // Create a new ASAM assessment as draft with intake data pre-populated
      const response = await fetch("/api/asam", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isDraft: true,
          currentStep: 1,
          intakeId: selectedIntake.id,
          // Pre-populate from intake
          patientName: selectedIntake.residentName,
          dateOfBirth: selectedIntake.dateOfBirth.split("T")[0],
          age: calculateAge(selectedIntake.dateOfBirth),
          gender: selectedIntake.sex,
          raceEthnicity: selectedIntake.ethnicity,
          preferredLanguage: selectedIntake.language,
          phoneNumber: selectedIntake.patientPhone,
          patientAddress: selectedIntake.patientAddress,
          insuranceType: selectedIntake.insuranceProvider,
          ahcccsId: selectedIntake.ahcccsHealthPlan,
          livingArrangement: selectedIntake.livingArrangements,
          referredBy: selectedIntake.referralSource,
          reasonForTreatment: selectedIntake.reasonsForReferral,
          currentSymptoms: selectedIntake.currentBehavioralSymptoms,
          // Medical
          medicalConditions: selectedIntake.medicalConditions,
          // Substance history
          familySubstanceHistory: selectedIntake.substanceHistory,
          longestSobriety: selectedIntake.longestSobriety,
          // Risk factors
          suicidalThoughts: selectedIntake.currentSuicideIdeation,
          thoughtsOfHarmingOthers: selectedIntake.historyHarmingOthers || selectedIntake.homicidalIdeation,
          abuseHistory: selectedIntake.abuseHistory,
          // Employment
          currentlyEmployedOrSchool: selectedIntake.currentlyEmployed,
          employmentSchoolDetails: selectedIntake.employmentDetails,
          // Legal
          probationParoleOfficer: selectedIntake.criminalLegalHistory ? "See intake" : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create ASAM assessment");
      }

      const data = await response.json();

      toast({
        title: "ASAM Assessment Created",
        description: "Redirecting to the assessment form...",
      });

      // Redirect to edit the new draft
      router.push(`/facility/asam/${data.assessment.id}/edit`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create ASAM assessment",
      });
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/facility/asam">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New ASAM Assessment</h1>
          <p className="text-muted-foreground">
            Select an approved intake to create an ASAM assessment
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-blue-800">ASAM Assessments are Linked to Intakes</p>
          <p className="text-sm text-blue-700">
            Each ASAM assessment is associated with a completed intake. Patient information
            from the intake will be pre-populated into the ASAM form.
          </p>
        </div>
      </div>

      {intakes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Available Intakes</h3>
            <p className="text-muted-foreground mb-4">
              There are no approved intakes available for ASAM assessment.
              <br />
              Complete and get approval for an intake first.
            </p>
            <Link href="/facility/intakes/new">
              <Button>Create New Intake</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            <h2 className="text-lg font-semibold">Select an Intake</h2>
            {intakes.map((intake) => (
              <Card
                key={intake.id}
                className={`cursor-pointer transition-all ${
                  selectedIntake?.id === intake.id
                    ? "ring-2 ring-primary border-primary"
                    : "hover:border-primary/50"
                }`}
                onClick={() => setSelectedIntake(intake)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UserCheck className="h-5 w-5 text-green-600" />
                      <CardTitle className="text-lg">{intake.residentName}</CardTitle>
                    </div>
                    <Badge className="bg-green-500">Approved</Badge>
                  </div>
                  <CardDescription className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      DOB: {formatDate(intake.dateOfBirth)}
                    </span>
                    <span>Age: {calculateAge(intake.dateOfBirth)}</span>
                    {intake.sex && <span>Sex: {intake.sex}</span>}
                    {intake.decidedAt && (
                      <span>Approved: {formatDate(intake.decidedAt)}</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Insurance:</span>
                      <p className="font-medium">{intake.insuranceProvider || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Referral:</span>
                      <p className="font-medium">{intake.referralSource || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Substance History:</span>
                      <p className="font-medium">{intake.substanceHistory ? "Yes" : "No"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Risk Factors:</span>
                      <p className="font-medium">
                        {(intake.suicideHistory || intake.currentSuicideIdeation || intake.historyHarmingOthers)
                          ? "Present"
                          : "None"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedIntake && (
            <div className="sticky bottom-4 bg-background p-4 border rounded-lg shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Selected: {selectedIntake.residentName}</p>
                  <p className="text-sm text-muted-foreground">
                    Click below to start the ASAM assessment with pre-populated intake data
                  </p>
                </div>
                <Button onClick={handleStartASAM} disabled={creating} size="lg">
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Start ASAM Assessment"
                  )}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
