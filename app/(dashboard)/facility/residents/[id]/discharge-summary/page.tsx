import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DischargeSummaryForm } from "@/components/discharge-summaries/discharge-summary-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Edit } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ResidentTabs } from "@/components/residents/resident-tabs";

export const metadata: Metadata = {
  title: "Discharge Summary",
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}

export default async function DischargeSummaryPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "BHRF") {
    redirect("/login");
  }

  const { id: intakeId } = await params;
  const { edit } = await searchParams;
  const isEditMode = edit === "true";

  const bhrfProfile = await prisma.bHRFProfile.findUnique({
    where: { userId: session.user.id },
    include: { facility: true },
  });

  if (!bhrfProfile) {
    redirect("/facility");
  }

  // Get the intake (resident) with their discharge summary and related data
  const intake = await prisma.intake.findUnique({
    where: { id: intakeId },
    include: {
      facility: true,
      dischargeSummary: true,
      medications: true,
      asamAssessments: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  // Get current medications from eMAR if available
  const medicationOrders = intake ? await prisma.medicationOrder.findMany({
    where: {
      intakeId: intake.id,
      status: "ACTIVE",
      discontinuedAt: null,
    },
    select: {
      medicationName: true,
      dose: true,
      frequency: true,
      prescriberName: true,
    },
  }) : [];

  if (!intake || intake.facilityId !== bhrfProfile.facilityId) {
    notFound();
  }

  // Only allow discharge summary for approved residents
  if (intake.status !== "APPROVED") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/facility/residents/${intakeId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Discharge Summary</h1>
            <p className="text-muted-foreground">
              {intake.residentName}
            </p>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">Resident Not Approved</h4>
          <p className="text-sm text-yellow-700">
            Discharge summaries can only be created for approved residents. This resident&apos;s
            intake status is currently: {intake.status}
          </p>
        </div>
      </div>
    );
  }

  const dischargeSummary = intake.dischargeSummary;
  const hasExistingSummary = !!dischargeSummary;

  // Determine if we're viewing read-only or editing
  const isReadOnly = hasExistingSummary && !isEditMode && dischargeSummary.status !== "DRAFT";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/facility/residents">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {intake.residentName}
            </h1>
            <p className="text-muted-foreground">
              DOB: {formatDate(intake.dateOfBirth)}
            </p>
          </div>
        </div>
        {hasExistingSummary && (
          <div className="flex items-center gap-2">
            <Badge
              variant={
                dischargeSummary.status === "APPROVED"
                  ? "default"
                  : dischargeSummary.status === "PENDING"
                  ? "secondary"
                  : "outline"
              }
            >
              {dischargeSummary.status}
            </Badge>
            {isReadOnly && (
              <Button variant="outline" asChild>
                <Link href={`/facility/residents/${intakeId}/discharge-summary?edit=true`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <a
                href={`/api/discharge-summaries/${dischargeSummary.id}/pdf`}
                download
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </a>
            </Button>
          </div>
        )}
      </div>

      <ResidentTabs residentId={intakeId} isApproved={intake.status === "APPROVED"} isDischarged={!!intake.dischargedAt} />

      <DischargeSummaryForm
        resident={{
          id: intake.id,
          residentName: intake.residentName || "Unknown",
          dateOfBirth: intake.dateOfBirth,
          policyNumber: intake.policyNumber,
          ahcccsHealthPlan: intake.ahcccsHealthPlan,
          admissionDate: intake.admissionDate,
          // Clinical data for pre-filling from Intake
          diagnosis: intake.diagnosis,
          allergies: intake.allergies,
          treatmentObjectives: intake.treatmentObjectives,
          // Build presenting problem from multiple intake sources
          presentingProblem: [
            intake.reasonForServices,
            intake.currentBehavioralSymptoms,
            intake.personalPsychHX,
          ].filter(Boolean).join("\n\n") || null,
          // ASAM data for pre-filling
          asamLevelOfCare: intake.asamAssessments[0]?.recommendedLevelOfCare || null,
          asamReasonForTreatment: intake.asamAssessments[0]?.reasonForTreatment || null,
          asamCurrentSymptoms: intake.asamAssessments[0]?.currentSymptoms || null,
        }}
        prefillMedications={[
          // From intake medications
          ...intake.medications.map((med) => ({
            medication: med.name,
            dosage: med.dosage || "",
            frequency: med.frequency || "",
            prescriber: med.prescriber || "",
          })),
          // From active medication orders (eMAR)
          ...medicationOrders.map((order) => ({
            medication: order.medicationName,
            dosage: order.dose || "",
            frequency: order.frequency || "",
            prescriber: order.prescriberName || "",
          })),
        ].filter((med, index, self) =>
          // Remove duplicates by medication name
          index === self.findIndex((m) => m.medication.toLowerCase() === med.medication.toLowerCase())
        )}
        initialData={
          dischargeSummary
            ? {
                id: dischargeSummary.id,
                dischargeDate: dischargeSummary.dischargeDate,
                dischargeStartTime: dischargeSummary.dischargeStartTime,
                dischargeEndTime: dischargeSummary.dischargeEndTime,
                enrolledProgram: dischargeSummary.enrolledProgram,
                dischargeType: dischargeSummary.dischargeType,
                recommendedLevelOfCare: dischargeSummary.recommendedLevelOfCare,
                contactPhoneAfterDischarge: dischargeSummary.contactPhoneAfterDischarge,
                contactAddressAfterDischarge: dischargeSummary.contactAddressAfterDischarge,
                // Clinical info - prefilled
                diagnoses: dischargeSummary.diagnoses,
                allergies: dischargeSummary.allergies,
                asamLevelOfCare: dischargeSummary.asamLevelOfCare,
                // Clinical content
                presentingIssuesAtAdmission: dischargeSummary.presentingIssuesAtAdmission,
                treatmentSummary: dischargeSummary.treatmentSummary,
                objectivesAttained: dischargeSummary.objectivesAttained as Array<{
                  objective: string;
                  attained: "Fully Attained" | "Partially Attained" | "Not Attained" | "N/A";
                }>,
                objectiveNarratives: dischargeSummary.objectiveNarratives as {
                  fullyAttained?: string;
                  partiallyAttained?: string;
                  notAttained?: string;
                },
                completedServices: dischargeSummary.completedServices,
                actualDischargeDate: dischargeSummary.actualDischargeDate,
                dischargeSummaryNarrative: dischargeSummary.dischargeSummaryNarrative,
                dischargingTo: dischargeSummary.dischargingTo,
                personalItemsReceived: dischargeSummary.personalItemsReceived,
                personalItemsStoredDays: dischargeSummary.personalItemsStoredDays,
                itemsRemainAtFacility: dischargeSummary.itemsRemainAtFacility,
                dischargeMedications: dischargeSummary.dischargeMedications as Array<{
                  medication: string;
                  dosage: string;
                  frequency: string;
                  prescriber: string;
                }>,
                serviceReferrals: dischargeSummary.serviceReferrals as Array<{
                  service: string;
                  provider: string;
                  phone: string;
                  address: string;
                  appointmentDate: string;
                }>,
                clinicalRecommendations: dischargeSummary.clinicalRecommendations,
                // Relapse prevention & crisis
                relapsePreventionPlan: dischargeSummary.relapsePreventionPlan,
                crisisResources: dischargeSummary.crisisResources,
                // Patient education
                patientEducationProvided: dischargeSummary.patientEducationProvided,
                specialInstructions: dischargeSummary.specialInstructions,
                culturalPreferencesConsidered: dischargeSummary.culturalPreferencesConsidered,
                suicidePreventionEducation: dischargeSummary.suicidePreventionEducation,
                clientSignature: dischargeSummary.clientSignature,
                clientSignatureDate: dischargeSummary.clientSignatureDate,
                staffSignature: dischargeSummary.staffSignature,
                staffCredentials: dischargeSummary.staffCredentials,
                staffSignatureDate: dischargeSummary.staffSignatureDate,
                reviewerSignature: dischargeSummary.reviewerSignature,
                reviewerCredentials: dischargeSummary.reviewerCredentials,
                reviewerSignatureDate: dischargeSummary.reviewerSignatureDate,
                status: dischargeSummary.status,
              }
            : undefined
        }
        mode={hasExistingSummary ? "edit" : "create"}
        readOnly={isReadOnly}
      />
    </div>
  );
}
