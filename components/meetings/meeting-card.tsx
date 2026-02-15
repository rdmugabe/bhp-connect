"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { Video, Calendar, Clock, ExternalLink, Building2 } from "lucide-react";

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  duration: number;
  meetingUrl: string | null;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  facility: {
    id: string;
    name: string;
  };
}

interface MeetingCardProps {
  meeting: Meeting;
  basePath: string;
  showFacility?: boolean;
}

export function MeetingCard({ meeting, basePath, showFacility = true }: MeetingCardProps) {
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

  const isUpcoming = meeting.status === "SCHEDULED" && new Date(meeting.scheduledAt) > new Date();
  const isHappeningNow = meeting.status === "IN_PROGRESS";

  return (
    <Card className={isHappeningNow ? "border-primary" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-lg">{meeting.title}</CardTitle>
          </div>
          <Badge variant={statusVariant[meeting.status]}>
            {statusLabel[meeting.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showFacility && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>{meeting.facility.name}</span>
          </div>
        )}

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatDateTime(meeting.scheduledAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{meeting.duration} min</span>
          </div>
        </div>

        {meeting.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {meeting.description}
          </p>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Link href={`${basePath}/meetings/${meeting.id}`}>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </Link>

          {(isUpcoming || isHappeningNow) && meeting.meetingUrl && (
            <a
              href={meeting.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" variant={isHappeningNow ? "default" : "secondary"}>
                <ExternalLink className="h-4 w-4 mr-1" />
                Join Meeting
              </Button>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
