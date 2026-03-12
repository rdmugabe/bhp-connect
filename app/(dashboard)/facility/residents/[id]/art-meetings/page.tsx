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
import { ARTMeetingList } from "@/components/art-meetings/art-meeting-list";
import { ResidentTabs } from "@/components/residents/resident-tabs";

export default async function ResidentARTMeetingsPage({
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

  // Get all ART meetings for this resident
  const artMeetings = await prisma.aRTMeeting.findMany({
    where: { intakeId: id },
    include: {
      intake: {
        select: {
          id: true,
          residentName: true,
        },
      },
    },
    orderBy: [
      { meetingYear: "desc" },
      { meetingMonth: "desc" },
    ],
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
          </div>
        </div>
        <Link href={`/facility/residents/${id}/art-meetings/new`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New ART Meeting
          </Button>
        </Link>
      </div>

      <ResidentTabs residentId={id} isApproved={resident.status === "APPROVED"} isDischarged={false} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            ART Meeting Worksheets
          </CardTitle>
          <CardDescription>
            Monthly Assessment and Recovery Team meetings for this resident
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ARTMeetingList
            meetings={artMeetings}
            residentId={resident.id}
            residentName={resident.residentName}
            basePath="/facility/residents"
            showActions={true}
            readOnly={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
