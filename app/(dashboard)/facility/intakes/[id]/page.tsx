import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function FacilityIntakeDetailPage({
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

  const intake = await prisma.intake.findUnique({
    where: { id: params.id },
    include: {
      medications: true,
      facility: true,
    },
  });

  if (!intake || intake.facilityId !== bhrfProfile.facilityId) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/facility/intakes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {intake.residentName}
            </h1>
            <p className="text-muted-foreground">
              Intake Assessment - {formatDate(intake.createdAt)}
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

      {/* Referral */}
      {intake.reasonsForReferral && (
        <Card>
          <CardHeader>
            <CardTitle>Referral Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Reasons for Referral</p>
              <p className="mt-1">{intake.reasonsForReferral}</p>
            </div>
            {intake.residentNeeds && (
              <div>
                <p className="text-sm text-muted-foreground">Resident Needs</p>
                <p className="mt-1">{intake.residentNeeds}</p>
              </div>
            )}
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
              <p className="text-sm text-muted-foreground mb-2">Current Medications</p>
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
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg border">
              <p className="text-sm text-muted-foreground">Current Suicidal Ideation</p>
              <Badge variant={intake.currentSuicideIdeation ? "danger" : "success"} className="mt-1">
                {intake.currentSuicideIdeation ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="text-sm text-muted-foreground">History of Self-Harm</p>
              <Badge variant={intake.historySelfHarm ? "warning" : "success"} className="mt-1">
                {intake.historySelfHarm ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="text-sm text-muted-foreground">History Harming Others</p>
              <Badge variant={intake.historyHarmingOthers ? "warning" : "success"} className="mt-1">
                {intake.historyHarmingOthers ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="text-sm text-muted-foreground">Potential Violence</p>
              <Badge variant={intake.potentialViolence ? "danger" : "success"} className="mt-1">
                {intake.potentialViolence ? "Yes" : "No"}
              </Badge>
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
              <div className="text-3xl font-bold">{intake.phq9TotalScore}</div>
              <div>
                <p className="text-sm text-muted-foreground">Total Score</p>
                <p className="font-medium">
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

      {/* Treatment Planning */}
      {intake.treatmentObjectives && (
        <Card>
          <CardHeader>
            <CardTitle>Treatment Planning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Treatment Objectives</p>
              <p className="mt-1">{intake.treatmentObjectives}</p>
            </div>
            {intake.dischargePlanObjectives && (
              <div>
                <p className="text-sm text-muted-foreground">Discharge Plan Objectives</p>
                <p className="mt-1">{intake.dischargePlanObjectives}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
