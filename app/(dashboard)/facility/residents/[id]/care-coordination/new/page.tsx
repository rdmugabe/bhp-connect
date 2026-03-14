import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { CareCoordinationForm } from "@/components/care-coordination/care-coordination-form";

export default async function NewCareCoordinationEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "BHRF") {
    redirect("/login");
  }

  const { id } = await params;

  const bhrfProfile = await prisma.bHRFProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!bhrfProfile) {
    redirect("/login");
  }

  // Get the resident (intake)
  const resident = await prisma.intake.findUnique({
    where: { id },
    select: {
      id: true,
      residentName: true,
      dateOfBirth: true,
      facilityId: true,
      status: true,
    },
  });

  if (!resident || resident.facilityId !== bhrfProfile.facilityId) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/facility/residents/${id}/care-coordination`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            New Care Coordination Entry
          </h1>
          <p className="text-muted-foreground">
            for {resident.residentName}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Care Coordination Entry
          </CardTitle>
          <CardDescription>
            Document a care coordination activity such as appointments, calls,
            referrals, or follow-ups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CareCoordinationForm
            intakeId={id}
            residentName={resident.residentName || "Unknown"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
