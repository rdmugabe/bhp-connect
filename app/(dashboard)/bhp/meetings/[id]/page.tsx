"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { formatDateTime } from "@/lib/utils";
import {
  Video,
  Calendar,
  Clock,
  Building2,
  ExternalLink,
  ArrowLeft,
  Edit,
  X,
  Play,
  Square,
  FileText,
} from "lucide-react";
import { MeetingFormDialog } from "@/components/meetings/meeting-form-dialog";

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

export default function BHPMeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [facilities, setFacilities] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [meetingNotes, setMeetingNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMeeting = async () => {
    try {
      const [meetingRes, facilitiesRes] = await Promise.all([
        fetch(`/api/meetings/${params.id}`),
        fetch("/api/facilities"),
      ]);

      if (meetingRes.ok) {
        const data = await meetingRes.json();
        setMeeting(data.meeting);
        setMeetingNotes(data.meeting.notes || "");
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Meeting not found",
        });
        router.push("/bhp/meetings");
      }

      if (facilitiesRes.ok) {
        const facilitiesData = await facilitiesRes.json();
        setFacilities(facilitiesData.facilities || []);
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

  const handleStartMeeting = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/meetings/${params.id}/start`, {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Meeting started",
          description: "The meeting has been marked as in progress",
        });
        fetchMeeting();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start meeting",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndMeeting = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/meetings/${params.id}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: meetingNotes }),
      });

      if (response.ok) {
        toast({
          title: "Meeting ended",
          description: "The meeting has been marked as completed",
        });
        setEndDialogOpen(false);
        fetchMeeting();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to end meeting",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelMeeting = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/meetings/${params.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Meeting cancelled",
          description: "The meeting has been cancelled",
        });
        setCancelDialogOpen(false);
        fetchMeeting();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel meeting",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/meetings/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: meetingNotes }),
      });

      if (response.ok) {
        toast({
          title: "Notes saved",
          description: "Meeting notes have been saved",
        });
        fetchMeeting();
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save notes",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/bhp/meetings">
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

  const canEdit = meeting.status === "SCHEDULED";
  const canStart = meeting.status === "SCHEDULED";
  const canEnd = meeting.status === "IN_PROGRESS" || meeting.status === "SCHEDULED";
  const canCancel = meeting.status === "SCHEDULED";
  const canJoin = (meeting.status === "SCHEDULED" || meeting.status === "IN_PROGRESS") && meeting.meetingUrl;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/bhp/meetings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Meetings
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {canCancel && (
            <Button variant="outline" onClick={() => setCancelDialogOpen(true)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
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
                      Created {formatDateTime(meeting.createdAt)}
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
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Facility</p>
                    <p className="font-medium">{meeting.facility.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Scheduled</p>
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

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <CardTitle>Meeting Notes</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Add notes about this meeting..."
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                rows={5}
              />
              <Button
                onClick={handleSaveNotes}
                disabled={isSubmitting || meetingNotes === (meeting.notes || "")}
              >
                Save Notes
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canJoin && (
                <a
                  href={meeting.meetingUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Join Meeting
                  </Button>
                </a>
              )}

              {canStart && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleStartMeeting}
                  disabled={isSubmitting}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Meeting
                </Button>
              )}

              {canEnd && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setEndDialogOpen(true)}
                  disabled={isSubmitting}
                >
                  <Square className="h-4 w-4 mr-2" />
                  End Meeting
                </Button>
              )}

              {!canJoin && !canStart && !canEnd && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No actions available for this meeting
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <MeetingFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        meeting={meeting}
        facilities={facilities}
        onSuccess={fetchMeeting}
      />

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Meeting</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this meeting? The facility will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Meeting</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelMeeting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Meeting
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Meeting</AlertDialogTitle>
            <AlertDialogDescription>
              Mark this meeting as completed. You can add notes before ending.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="endNotes">Meeting Notes</Label>
            <Textarea
              id="endNotes"
              placeholder="Add any final notes..."
              value={meetingNotes}
              onChange={(e) => setMeetingNotes(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndMeeting}>
              End Meeting
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
