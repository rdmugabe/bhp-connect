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
import { ClipboardList, Eye } from "lucide-react";
import { ARTMeetingBadge } from "@/components/art-meetings/art-meeting-badge";
import { formatDate } from "@/lib/utils";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default async function BHPARTMeetingsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "BHP") {
    redirect("/login");
  }

  const bhpProfile = await prisma.bHPProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!bhpProfile) {
    redirect("/login");
  }

  // Get all ART meetings for facilities under this BHP
  const artMeetings = await prisma.aRTMeeting.findMany({
    where: {
      facility: {
        bhpId: bhpProfile.id,
      },
    },
    include: {
      intake: {
        select: {
          id: true,
          residentName: true,
        },
      },
      facility: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      { meetingYear: "desc" },
      { meetingMonth: "desc" },
      { createdAt: "desc" },
    ],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ART Meetings</h1>
        <p className="text-muted-foreground">
          All ART meeting worksheets across your facilities
        </p>
      </div>

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
            Monthly Assessment and Recovery Team meeting worksheets
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resident</TableHead>
                <TableHead>Facility</TableHead>
                <TableHead>Month/Year</TableHead>
                <TableHead>Meeting Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {artMeetings.map((meeting) => (
                <TableRow key={meeting.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/bhp/residents/${meeting.intakeId}`}
                      className="hover:underline"
                    >
                      {meeting.intake.residentName}
                    </Link>
                  </TableCell>
                  <TableCell>{meeting.facility.name}</TableCell>
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
                    <Link
                      href={`/bhp/residents/${meeting.intakeId}/art-meetings/${meeting.id}`}
                    >
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {artMeetings.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
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
