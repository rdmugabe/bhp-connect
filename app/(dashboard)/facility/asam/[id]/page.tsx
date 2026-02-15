import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "PENDING":
      return <Badge variant="outline">Pending Review</Badge>;
    case "APPROVED":
      return <Badge className="bg-green-500">Approved</Badge>;
    case "CONDITIONAL":
      return <Badge className="bg-yellow-500">Conditional</Badge>;
    case "DENIED":
      return <Badge variant="destructive">Denied</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

const getSeverityLabel = (severity: number | null) => {
  if (severity === null) return "Not Rated";
  const labels = ["None", "Mild", "Moderate", "Severe", "Very Severe"];
  return labels[severity] || "Not Rated";
};

export default async function ViewASAMPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "BHRF") {
    redirect("/login");
  }

  const bhrfProfile = await prisma.bHRFProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!bhrfProfile) {
    redirect("/login");
  }

  const assessment = await prisma.aSAMAssessment.findUnique({
    where: { id: params.id },
    include: {
      facility: true,
    },
  });

  if (!assessment || assessment.facilityId !== bhrfProfile.facilityId) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/facility/asam">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              ASAM Assessment: {assessment.patientName}
            </h1>
            <p className="text-muted-foreground">
              Submitted on {formatDate(assessment.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(assessment.status)}
          <Link href={`/api/asam/${assessment.id}/pdf`} target="_blank">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </Link>
        </div>
      </div>

      {assessment.decisionReason && (
        <Card className={assessment.status === "DENIED" ? "border-red-200 bg-red-50" : assessment.status === "CONDITIONAL" ? "border-yellow-200 bg-yellow-50" : "border-green-200 bg-green-50"}>
          <CardHeader>
            <CardTitle className="text-lg">BHP Decision</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{assessment.decisionReason}</p>
            {assessment.decidedAt && (
              <p className="text-sm text-muted-foreground mt-2">
                Decision made on {formatDate(assessment.decidedAt)}
              </p>
            )}
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
              <span className="text-muted-foreground">Insurance:</span>
              <span className="font-medium">{assessment.insuranceType || "N/A"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Level of Care</CardTitle>
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
    </div>
  );
}
