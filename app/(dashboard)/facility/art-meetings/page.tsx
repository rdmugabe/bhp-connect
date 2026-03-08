import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClipboardList, Eye, Edit, Plus, AlertTriangle } from "lucide-react";
import { ARTMeetingBadge } from "@/components/art-meetings/art-meeting-badge";
import { ARTMeetingSkipDialog } from "@/components/art-meetings/art-meeting-skip-dialog";
import { formatDate } from "@/lib/utils";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default async function FacilityARTMeetingsPage() {
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

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Get all ART meetings for the facility (exclude discharged patients)
  const artMeetings = await prisma.aRTMeeting.findMany({
    where: {
      facilityId: bhrfProfile.facilityId,
      intake: {
        dischargedAt: null,
      },
    },
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
      { createdAt: "desc" },
    ],
  });

  // Get residents needing meetings this month (exclude discharged patients)
  const residents = await prisma.intake.findMany({
    where: {
      facilityId: bhrfProfile.facilityId,
      status: "APPROVED",
      dischargedAt: null,
    },
    select: {
      id: true,
      residentName: true,
      artMeetings: {
        where: {
          meetingMonth: currentMonth,
          meetingYear: currentYear,
        },
        select: {
          id: true,
          status: true,
          isSkipped: true,
        },
      },
    },
  });

  const pendingResidents = residents.filter((resident) => {
    const meeting = resident.artMeetings[0];
    return !meeting || meeting.status === "DRAFT";
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ART Meetings</h1>
          <p className="text-muted-foreground">
            Monthly Assessment and Recovery Team meetings
          </p>
        </div>
      </div>

      {/* Pending Meetings Alert */}
      {pendingResidents.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Pending ART Meetings - {monthNames[currentMonth - 1]} {currentYear}
            </CardTitle>
            <CardDescription className="text-yellow-700">
              {pendingResidents.length} resident(s) need ART meetings this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {pendingResidents.map((resident) => (
                <Link
                  key={resident.id}
                  href={`/facility/residents/${resident.id}/art-meetings/new`}
                >
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    {resident.residentName}
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All ART Meetings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            All ART Meetings
            {artMeetings.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {artMeetings.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Complete list of ART meeting worksheets
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resident</TableHead>
                <TableHead>Month/Year</TableHead>
                <TableHead>Meeting Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[200px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {artMeetings.map((meeting) => (
                <TableRow key={meeting.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/facility/residents/${meeting.intakeId}`}
                      className="hover:underline"
                    >
                      {meeting.intake.residentName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {monthNames[meeting.meetingMonth - 1]} {meeting.meetingYear}
                  </TableCell>
                  <TableCell>
                    {meeting.meetingDate
                      ? formatDate(meeting.meetingDate)
                      : meeting.isSkipped
                      ? "Skipped"
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <ARTMeetingBadge
                      status={meeting.status}
                      isSkipped={meeting.isSkipped}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Link
                        href={`/facility/residents/${meeting.intakeId}/art-meetings/${meeting.id}`}
                      >
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      {!meeting.isSkipped && meeting.status !== "APPROVED" && (
                        <>
                          <Link
                            href={`/facility/residents/${meeting.intakeId}/art-meetings/${meeting.id}/edit`}
                          >
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </Link>
                          <ARTMeetingSkipDialog
                            meetingId={meeting.id}
                            residentName={meeting.intake.residentName}
                            meetingMonth={meeting.meetingMonth}
                            meetingYear={meeting.meetingYear}
                          />
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {artMeetings.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    No ART meetings recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
