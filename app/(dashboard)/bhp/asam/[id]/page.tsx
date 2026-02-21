"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  Download,
  AlertTriangle,
  Loader2,
  Edit,
} from "lucide-react";

interface Assessment {
  id: string;
  patientName: string;
  dateOfBirth: string;
  age: number | null;
  gender: string | null;
  raceEthnicity: string | null;
  preferredLanguage: string | null;
  insuranceType: string | null;
  livingArrangement: string | null;
  referredBy: string | null;
  reasonForTreatment: string | null;
  currentSymptoms: string | null;
  dimension1Severity: number | null;
  dimension2Severity: number | null;
  dimension3Severity: number | null;
  dimension4Severity: number | null;
  dimension5Severity: number | null;
  dimension6Severity: number | null;
  dsm5Diagnoses: string | null;
  recommendedLevelOfCare: string | null;
  levelOfCareProvided: string | null;
  matInterested: boolean;
  matDetails: string | null;
  suicidalThoughts: boolean;
  thoughtsOfHarmingOthers: boolean;
  createdAt: string;
  facility: {
    id: string;
    name: string;
  };
}

const getSeverityLabel = (severity: number | null) => {
  if (severity === null) return "Not Rated";
  const labels = ["None", "Mild", "Moderate", "Severe", "Very Severe"];
  return labels[severity] || "Not Rated";
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function BHPASAMViewPage({
  params,
}: {
  params: { id: string };
}) {
  const { toast } = useToast();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const response = await fetch(`/api/asam/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch assessment");
        }
        const data = await response.json();
        setAssessment(data.assessment);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load assessment",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [params.id, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="text-center py-8">
        <p>Assessment not found</p>
        <Link href="/bhp/asam">
          <Button className="mt-4">Back to ASAM Assessments</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/bhp/asam">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              ASAM Assessment
            </h1>
            <p className="text-muted-foreground">
              {assessment.patientName} - {assessment.facility.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/bhp/asam/${assessment.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Link href={`/api/asam/${assessment.id}/pdf`} target="_blank">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </Link>
        </div>
      </div>

      {/* Risk Alerts */}
      {(assessment.suicidalThoughts || assessment.thoughtsOfHarmingOthers) && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Risk Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-red-700">
              {assessment.suicidalThoughts && (
                <li>Patient has reported suicidal thoughts</li>
              )}
              {assessment.thoughtsOfHarmingOthers && (
                <li>Patient has reported thoughts of harming others</li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">{assessment.patientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date of Birth:</span>
              <span className="font-medium">{formatDate(assessment.dateOfBirth)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Age:</span>
              <span className="font-medium">{assessment.age || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gender:</span>
              <span className="font-medium">{assessment.gender || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Race/Ethnicity:</span>
              <span className="font-medium">{assessment.raceEthnicity || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Insurance:</span>
              <span className="font-medium">{assessment.insuranceType || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Living Arrangement:</span>
              <span className="font-medium">{assessment.livingArrangement || "N/A"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Level of Care Recommendation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Recommended:</span>
              <span className="font-medium">{assessment.recommendedLevelOfCare || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Provided:</span>
              <span className="font-medium">{assessment.levelOfCareProvided || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">MAT Interest:</span>
              <span className="font-medium">{assessment.matInterested ? "Yes" : "No"}</span>
            </div>
            {assessment.matDetails && (
              <div className="pt-2">
                <span className="text-muted-foreground">MAT Details:</span>
                <p className="mt-1 text-sm">{assessment.matDetails}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dimension Severity Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Dimension 1</p>
              <p className="text-xs text-muted-foreground">Substance Use</p>
              <p className="text-lg font-bold mt-1">
                {assessment.dimension1Severity !== null ? assessment.dimension1Severity : "-"}
              </p>
              <p className="text-xs">{getSeverityLabel(assessment.dimension1Severity)}</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Dimension 2</p>
              <p className="text-xs text-muted-foreground">Biomedical</p>
              <p className="text-lg font-bold mt-1">
                {assessment.dimension2Severity !== null ? assessment.dimension2Severity : "-"}
              </p>
              <p className="text-xs">{getSeverityLabel(assessment.dimension2Severity)}</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Dimension 3</p>
              <p className="text-xs text-muted-foreground">Emotional/Cognitive</p>
              <p className="text-lg font-bold mt-1">
                {assessment.dimension3Severity !== null ? assessment.dimension3Severity : "-"}
              </p>
              <p className="text-xs">{getSeverityLabel(assessment.dimension3Severity)}</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Dimension 4</p>
              <p className="text-xs text-muted-foreground">Readiness</p>
              <p className="text-lg font-bold mt-1">
                {assessment.dimension4Severity !== null ? assessment.dimension4Severity : "-"}
              </p>
              <p className="text-xs">{getSeverityLabel(assessment.dimension4Severity)}</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Dimension 5</p>
              <p className="text-xs text-muted-foreground">Relapse</p>
              <p className="text-lg font-bold mt-1">
                {assessment.dimension5Severity !== null ? assessment.dimension5Severity : "-"}
              </p>
              <p className="text-xs">{getSeverityLabel(assessment.dimension5Severity)}</p>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Dimension 6</p>
              <p className="text-xs text-muted-foreground">Recovery Env</p>
              <p className="text-lg font-bold mt-1">
                {assessment.dimension6Severity !== null ? assessment.dimension6Severity : "-"}
              </p>
              <p className="text-xs">{getSeverityLabel(assessment.dimension6Severity)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {assessment.dsm5Diagnoses && (
        <Card>
          <CardHeader>
            <CardTitle>DSM-5 Diagnoses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{assessment.dsm5Diagnoses}</p>
          </CardContent>
        </Card>
      )}

      {assessment.reasonForTreatment && (
        <Card>
          <CardHeader>
            <CardTitle>Reason for Treatment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{assessment.reasonForTreatment}</p>
          </CardContent>
        </Card>
      )}

      {assessment.currentSymptoms && (
        <Card>
          <CardHeader>
            <CardTitle>Current Symptoms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{assessment.currentSymptoms}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
