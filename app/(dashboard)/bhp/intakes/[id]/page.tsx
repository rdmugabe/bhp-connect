"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  Download,
  AlertTriangle,
  Loader2,
  FileText,
} from "lucide-react";

interface Intake {
  id: string;
  residentName: string;
  ssn: string | null;
  dateOfBirth: string;
  sex: string | null;
  ethnicity: string | null;
  language: string | null;
  religion: string | null;
  insuranceProvider: string | null;
  policyNumber: string | null;
  reasonsForReferral: string | null;
  residentNeeds: string | null;
  allergies: string | null;
  medications: { id: string; name: string; dosage: string | null; frequency: string | null }[];
  historyNonCompliance: boolean;
  potentialViolence: boolean;
  medicalUrgency: string | null;
  personalMedicalHX: string | null;
  isCOT: boolean;
  personalPsychHX: string | null;
  suicideHistory: string | null;
  currentSuicideIdeation: boolean;
  historyHarmingOthers: boolean;
  historySelfHarm: boolean;
  phq9TotalScore: number | null;
  treatmentObjectives: string | null;
  dischargePlanObjectives: string | null;
  criminalLegalHistory: string | null;
  substanceHistory: string | null;
  crisisInterventionPlan: string | null;
  status: "PENDING" | "APPROVED" | "CONDITIONAL" | "DENIED";
  decisionReason: string | null;
  decidedAt: string | null;
  createdAt: string;
  facility: {
    id: string;
    name: string;
    address: string;
  };
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BHPIntakeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { toast } = useToast();
  const [intake, setIntake] = useState<Intake | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIntake = async () => {
      try {
        const response = await fetch(`/api/intakes/${params.id}`);
        if (!response.ok) throw new Error("Failed to fetch intake");
        const data = await response.json();
        setIntake(data.intake);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load intake details",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchIntake();
  }, [params.id, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!intake) {
    return (
      <div className="text-center py-12">
        <p>Intake not found</p>
        <Link href="/bhp/intakes">
          <Button className="mt-4">Back to Intakes</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/bhp/intakes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {intake.residentName}
            </h1>
            <p className="text-muted-foreground">
              {intake.facility.name} - {formatDate(intake.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/api/intakes/${intake.id}/pdf`} target="_blank">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </Link>
        </div>
      </div>


      {/* Key Risk Indicators */}
      <Card className="border-red-200">
        <CardHeader className="bg-red-50">
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            Key Risk Indicators
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg border">
              <p className="text-sm text-muted-foreground">Suicidal Ideation</p>
              <Badge variant={intake.currentSuicideIdeation ? "danger" : "success"} className="mt-1">
                {intake.currentSuicideIdeation ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="text-sm text-muted-foreground">Self-Harm History</p>
              <Badge variant={intake.historySelfHarm ? "warning" : "success"} className="mt-1">
                {intake.historySelfHarm ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="text-sm text-muted-foreground">Violence Risk</p>
              <Badge variant={intake.potentialViolence ? "danger" : "success"} className="mt-1">
                {intake.potentialViolence ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="text-sm text-muted-foreground">Court Ordered (COT)</p>
              <Badge variant={intake.isCOT ? "warning" : "secondary"} className="mt-1">
                {intake.isCOT ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demographics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Demographics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium">{intake.residentName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date of Birth</p>
              <p className="font-medium">{formatDate(intake.dateOfBirth)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sex</p>
              <p className="font-medium">{intake.sex || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Language</p>
              <p className="font-medium">{intake.language || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PHQ-9 Score */}
      {intake.phq9TotalScore !== null && (
        <Card>
          <CardHeader>
            <CardTitle>PHQ-9 Depression Screening</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold">{intake.phq9TotalScore}</div>
              <div>
                <p className="text-sm text-muted-foreground">Total Score (0-27)</p>
                <p className="font-medium text-lg">
                  {intake.phq9TotalScore <= 4 && "Minimal depression"}
                  {intake.phq9TotalScore >= 5 && intake.phq9TotalScore <= 9 && "Mild depression"}
                  {intake.phq9TotalScore >= 10 && intake.phq9TotalScore <= 14 && "Moderate depression"}
                  {intake.phq9TotalScore >= 15 && intake.phq9TotalScore <= 19 && "Moderately severe depression"}
                  {intake.phq9TotalScore >= 20 && "Severe depression"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Medical Information */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Allergies</p>
              <p className="font-medium">{intake.allergies || "None reported"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Medical Urgency</p>
              <p className="font-medium">{intake.medicalUrgency || "N/A"}</p>
            </div>
          </div>
          {intake.medications && intake.medications.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Current Medications ({intake.medications.length})</p>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">Medication</th>
                      <th className="px-3 py-2 text-left">Dosage</th>
                      <th className="px-3 py-2 text-left">Frequency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {intake.medications.map((med) => (
                      <tr key={med.id} className="border-t">
                        <td className="px-3 py-2">{med.name}</td>
                        <td className="px-3 py-2">{med.dosage || "-"}</td>
                        <td className="px-3 py-2">{med.frequency || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {intake.personalMedicalHX && (
            <div>
              <p className="text-sm text-muted-foreground">Personal Medical History</p>
              <p className="mt-1 p-3 bg-muted rounded">{intake.personalMedicalHX}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Psychiatric */}
      {intake.personalPsychHX && (
        <Card>
          <CardHeader>
            <CardTitle>Psychiatric History</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="p-3 bg-muted rounded">{intake.personalPsychHX}</p>
          </CardContent>
        </Card>
      )}

      {/* Treatment */}
      {(intake.treatmentObjectives || intake.crisisInterventionPlan) && (
        <Card>
          <CardHeader>
            <CardTitle>Treatment Planning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {intake.treatmentObjectives && (
              <div>
                <p className="text-sm text-muted-foreground">Treatment Objectives</p>
                <p className="mt-1 p-3 bg-muted rounded">{intake.treatmentObjectives}</p>
              </div>
            )}
            {intake.crisisInterventionPlan && (
              <div>
                <p className="text-sm text-muted-foreground">Crisis Intervention Plan</p>
                <p className="mt-1 p-3 bg-muted rounded">{intake.crisisInterventionPlan}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* History */}
      {(intake.criminalLegalHistory || intake.substanceHistory) && (
        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {intake.criminalLegalHistory && (
              <div>
                <p className="text-sm text-muted-foreground">Criminal/Legal History</p>
                <p className="mt-1 p-3 bg-muted rounded">{intake.criminalLegalHistory}</p>
              </div>
            )}
            {intake.substanceHistory && (
              <div>
                <p className="text-sm text-muted-foreground">Substance Use History</p>
                <p className="mt-1 p-3 bg-muted rounded">{intake.substanceHistory}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
