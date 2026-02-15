import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ASAMFormWizard } from "@/components/asam/asam-form-wizard";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export default async function EditASAMPage({
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
  });

  if (!assessment || assessment.facilityId !== bhrfProfile.facilityId) {
    notFound();
  }

  // Allow editing of any ASAM assessment

  // Convert assessment to form data format - transform null to undefined and dates to strings
  const initialData = Object.fromEntries(
    Object.entries(assessment).map(([key, value]) => [
      key,
      value === null ? undefined :
      value instanceof Date ? value.toISOString().split("T")[0] :
      value
    ])
  ) as Record<string, unknown>;

  // Ensure draftStep has a default value
  initialData.draftStep = assessment.draftStep || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/facility/asam">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Edit ASAM Assessment
          </h1>
          <p className="text-muted-foreground">
            Continue working on: {assessment.patientName}
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-blue-800">
            {assessment.status === "DRAFT" ? "Save Your Progress" : "Edit Assessment"}
          </p>
          <p className="text-sm text-blue-700">
            {assessment.status === "DRAFT"
              ? "You can save your progress as a draft at any time and continue later."
              : "You are editing a submitted assessment. Changes will be saved when you submit."}
          </p>
        </div>
      </div>

      <ASAMFormWizard assessmentId={params.id} initialData={initialData} />
    </div>
  );
}
