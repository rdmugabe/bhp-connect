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
import { ARTMeetingList } from "@/components/art-meetings/art-meeting-list";

export default async function BHPResidentARTMeetingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "BHP") {
    redirect("/login");
  }

  const { id } = await params;

  const bhpProfile = await prisma.bHPProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!bhpProfile) {
    redirect("/login");
  }

  // Get the resident (intake)
  const resident = await prisma.intake.findUnique({
    where: { id },
    select: {
      id: true,
      residentName: true,
      dateOfBirth: true,
      facility: {
        select: {
          id: true,
          name: true,
          bhpId: true,
        },
      },
    },
  });

  if (!resident || resident.facility.bhpId !== bhpProfile.id) {
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
      <div className="flex items-center gap-4">
        <Link href={`/bhp/residents/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            ART Meetings
          </h1>
          <p className="text-muted-foreground">
            {resident.residentName} - {resident.facility.name}
          </p>
        </div>
      </div>

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
            basePath="/bhp/residents"
            showActions={true}
            readOnly={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
