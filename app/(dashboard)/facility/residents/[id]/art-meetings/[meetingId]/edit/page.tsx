import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ARTMeetingForm } from "@/components/art-meetings/art-meeting-form";
import { ARTMeetingBadge } from "@/components/art-meetings/art-meeting-badge";

export default async function EditARTMeetingPage({
  params,
}: {
  params: Promise<{ id: string; meetingId: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "BHRF") {
    redirect("/login");
  }

  const { id, meetingId } = await params;

  const bhrfProfile = await prisma.bHRFProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!bhrfProfile) {
    redirect("/login");
  }

  // Get the ART meeting
  const artMeeting = await prisma.aRTMeeting.findUnique({
    where: { id: meetingId },
    include: {
      intake: {
        select: {
          id: true,
          residentName: true,
          dateOfBirth: true,
          policyNumber: true,
          ahcccsHealthPlan: true,
          facilityId: true,
        },
      },
    },
  });

  if (!artMeeting || artMeeting.intake.facilityId !== bhrfProfile.facilityId) {
    notFound();
  }

  // Verify the URL matches the intake
  if (artMeeting.intakeId !== id) {
    notFound();
  }

  // Cannot edit skipped or approved meetings
  if (artMeeting.isSkipped || artMeeting.status === "APPROVED") {
    redirect(`/facility/residents/${id}/art-meetings/${meetingId}`);
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/facility/residents/${id}/art-meetings`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Edit ART Meeting
            </h1>
            <ARTMeetingBadge status={artMeeting.status} />
          </div>
          <p className="text-muted-foreground">
            {artMeeting.intake.residentName} - {monthNames[artMeeting.meetingMonth - 1]} {artMeeting.meetingYear}
          </p>
        </div>
      </div>

      <ARTMeetingForm
        resident={artMeeting.intake}
        initialData={artMeeting}
        meetingMonth={artMeeting.meetingMonth}
        meetingYear={artMeeting.meetingYear}
        mode="edit"
        readOnly={false}
      />
    </div>
  );
}
