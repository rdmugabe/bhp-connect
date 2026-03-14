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
import { ArrowLeft, Plus, ClipboardList } from "lucide-react";
import { CareCoordinationTimeline } from "@/components/care-coordination/care-coordination-timeline";
import { ResidentTabs } from "@/components/residents/resident-tabs";

export default async function ResidentCareCoordinationPage({
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
      dischargedAt: true,
    },
  });

  if (!resident || resident.facilityId !== bhrfProfile.facilityId) {
    notFound();
  }

  // Get count of care coordination entries
  const entryCount = await prisma.careCoordinationEntry.count({
    where: {
      intakeId: id,
      archivedAt: null,
    },
  });

  // Get pending follow-ups count
  const pendingFollowUps = await prisma.careCoordinationEntry.count({
    where: {
      intakeId: id,
      archivedAt: null,
      followUpNeeded: true,
      OR: [
        { followUpDate: null },
        { followUpDate: { lte: new Date() } },
      ],
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/facility/residents">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {resident.residentName}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <span>{entryCount} coordination entries</span>
              {pendingFollowUps > 0 && (
                <span className="text-yellow-600 font-medium">
                  {pendingFollowUps} pending follow-ups
                </span>
              )}
            </div>
          </div>
        </div>
        <Link href={`/facility/residents/${id}/care-coordination/new`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Button>
        </Link>
      </div>

      <ResidentTabs
        residentId={id}
        isApproved={resident.status === "APPROVED"}
        isDischarged={!!resident.dischargedAt}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Care Coordination Timeline
          </CardTitle>
          <CardDescription>
            Track all care coordination activities, contacts, and follow-ups for this resident
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CareCoordinationTimeline
            intakeId={id}
            residentName={resident.residentName || "Unknown"}
            isAdmin={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
