"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { formatDateTime } from "@/lib/utils";
import {
  Video,
  Calendar,
  Clock,
  User,
  ExternalLink,
  ArrowLeft,
  FileText,
} from "lucide-react";

interface Meeting {
  id: string;
  facilityId: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  duration: number;
  meetingUrl: string | null;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  startedAt: string | null;
  endedAt: string | null;
  notes: string | null;
  createdAt: string;
  facility: {
    id: string;
    name: string;
    bhp: {
      user: {
        name: string;
        email: string;
      };
    };
  };
}

export default function FacilityMeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMeeting = async () => {
    try {
      const response = await fetch(`/api/meetings/${params.id}`);

      if (response.ok) {
        const data = await response.json();
        setMeeting(data.meeting);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Meeting not found",
        });
        router.push("/facility/meetings");
      }
    } catch (error) {
      console.error("Failed to fetch meeting:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load meeting details",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeeting();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/facility/meetings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Meetings
            </Button>
          </Link>
        </div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!meeting) {
    return null;
  }

  const statusVariant = {
    SCHEDULED: "secondary",
    IN_PROGRESS: "default",
    COMPLETED: "success",
    CANCELLED: "danger",
  } as const;

  const statusLabel = {
    SCHEDULED: "Scheduled",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };

  const canJoin = (meeting.status === "SCHEDULED" || meeting.status === "IN_PROGRESS") && meeting.meetingUrl;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/facility/meetings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Meetings
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Video className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-2xl">{meeting.title}</CardTitle>
                    <p className="text-muted-foreground">
                      Scheduled {formatDateTime(meeting.createdAt)}
                    </p>
                  </div>
                </div>
                <Badge variant={statusVariant[meeting.status]} className="text-sm">
                  {statusLabel[meeting.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Scheduled by</p>
                    <p className="font-medium">{meeting.facility.bhp.user.name}</p>
                    <p className="text-sm text-muted-foreground">{meeting.facility.bhp.user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date & Time</p>
                    <p className="font-medium">{formatDateTime(meeting.scheduledAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">{meeting.duration} minutes</p>
                  </div>
                </div>

                {meeting.meetingUrl && (
                  <div className="flex items-center gap-3">
                    <ExternalLink className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Meeting URL</p>
                      <a
                        href={meeting.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium truncate block max-w-[200px]"
                      >
                        {meeting.meetingUrl}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {meeting.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="whitespace-pre-wrap">{meeting.description}</p>
                </div>
              )}

              {(meeting.startedAt || meeting.endedAt) && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Meeting Timeline</p>
                  <div className="space-y-1 text-sm">
                    {meeting.startedAt && (
                      <p className="text-muted-foreground">
                        Started: {formatDateTime(meeting.startedAt)}
                      </p>
                    )}
                    {meeting.endedAt && (
                      <p className="text-muted-foreground">
                        Ended: {formatDateTime(meeting.endedAt)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {meeting.notes && meeting.status === "COMPLETED" && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <CardTitle>Meeting Notes</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {meeting.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Join Meeting</CardTitle>
            </CardHeader>
            <CardContent>
              {canJoin ? (
                <a
                  href={meeting.meetingUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full" size="lg">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Join Meeting
                  </Button>
                </a>
              ) : meeting.status === "COMPLETED" ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  This meeting has ended
                </p>
              ) : meeting.status === "CANCELLED" ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  This meeting was cancelled
                </p>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No meeting link available yet
                </p>
              )}
            </CardContent>
          </Card>

          {meeting.status === "SCHEDULED" && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Your BHP will share the meeting link when the meeting is ready to start.
                  You will be able to join using the button above.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
