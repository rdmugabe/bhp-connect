"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ARTMeetingBadge } from "./art-meeting-badge";
import { ARTMeetingSkipDialog } from "./art-meeting-skip-dialog";
import { Eye, Edit, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ARTMeeting {
  id: string;
  meetingMonth: number;
  meetingYear: number;
  meetingDate: Date | string | null;
  status: string;
  isSkipped: boolean;
  skipReason: string | null;
  createdAt: Date | string;
  intake: {
    id: string;
    residentName: string;
  };
}

interface ARTMeetingListProps {
  meetings: ARTMeeting[];
  residentId: string;
  residentName: string;
  basePath?: string;
  showActions?: boolean;
  readOnly?: boolean;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function ARTMeetingList({
  meetings,
  residentId,
  residentName,
  basePath = "/facility/residents",
  showActions = true,
  readOnly = false,
}: ARTMeetingListProps) {
  // Check if current month needs a meeting
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const hasCurrentMonthMeeting = meetings.some(
    (m) => m.meetingMonth === currentMonth && m.meetingYear === currentYear
  );

  return (
    <div className="space-y-4">
      {showActions && !readOnly && !hasCurrentMonthMeeting && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-yellow-800">
              No ART meeting for {monthNames[currentMonth - 1]} {currentYear}
            </p>
            <p className="text-sm text-yellow-700">
              A monthly ART meeting is required for this resident.
            </p>
          </div>
          <Link href={`${basePath}/${residentId}/art-meetings/new`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Meeting
            </Button>
          </Link>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Month/Year</TableHead>
            <TableHead>Meeting Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            {showActions && <TableHead className="w-[200px]">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {meetings.map((meeting) => (
            <TableRow key={meeting.id}>
              <TableCell className="font-medium">
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
              <TableCell>{formatDate(meeting.createdAt)}</TableCell>
              {showActions && (
                <TableCell>
                  <div className="flex gap-1">
                    <Link href={`${basePath}/${residentId}/art-meetings/${meeting.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    {!readOnly && !meeting.isSkipped && meeting.status !== "APPROVED" && (
                      <>
                        <Link href={`${basePath}/${residentId}/art-meetings/${meeting.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <ARTMeetingSkipDialog
                          meetingId={meeting.id}
                          residentName={residentName}
                          meetingMonth={meeting.meetingMonth}
                          meetingYear={meeting.meetingYear}
                        />
                      </>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
          {meetings.length === 0 && (
            <TableRow>
              <TableCell colSpan={showActions ? 5 : 4} className="text-center text-muted-foreground py-8">
                No ART meetings recorded yet.
                {!readOnly && (
                  <>
                    {" "}
                    <Link
                      href={`${basePath}/${residentId}/art-meetings/new`}
                      className="text-primary hover:underline"
                    >
                      Create the first one
                    </Link>
                  </>
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
