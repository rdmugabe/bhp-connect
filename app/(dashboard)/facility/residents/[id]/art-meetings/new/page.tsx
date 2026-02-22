import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ARTMeetingForm } from "@/components/art-meetings/art-meeting-form";

export default async function NewARTMeetingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "BHRF") {
    redirect("/login");
  }

  const { id } = await params;
  const { month, year } = await searchParams;

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
      policyNumber: true,
      ahcccsHealthPlan: true,
      facilityId: true,
      status: true,
    },
  });

  if (!resident || resident.facilityId !== bhrfProfile.facilityId) {
    notFound();
  }

  if (resident.status !== "APPROVED") {
    redirect(`/facility/residents/${id}`);
  }

  // Parse month and year from search params, default to current month/year
  const meetingMonth = month ? parseInt(month) : new Date().getMonth() + 1;
  const meetingYear = year ? parseInt(year) : new Date().getFullYear();

  // Check if meeting already exists for this month/year
  const existingMeeting = await prisma.aRTMeeting.findUnique({
    where: {
      intakeId_meetingMonth_meetingYear: {
        intakeId: id,
        meetingMonth,
        meetingYear,
      },
    },
  });

  if (existingMeeting) {
    redirect(`/facility/residents/${id}/art-meetings/${existingMeeting.id}/edit`);
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
          <h1 className="text-3xl font-bold tracking-tight">
            New ART Meeting
          </h1>
          <p className="text-muted-foreground">
            {resident.residentName} - {monthNames[meetingMonth - 1]} {meetingYear}
          </p>
        </div>
      </div>

      <ARTMeetingForm
        resident={resident}
        meetingMonth={meetingMonth}
        meetingYear={meetingYear}
        mode="create"
      />
    </div>
  );
}
