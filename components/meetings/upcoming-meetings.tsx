"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { Video, Calendar, ExternalLink, ArrowRight } from "lucide-react";

interface Meeting {
  id: string;
  title: string;
  scheduledAt: string;
  duration: number;
  meetingUrl: string | null;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  facility: {
    id: string;
    name: string;
  };
}

interface UpcomingMeetingsProps {
  basePath: string;
  showFacility?: boolean;
  limit?: number;
}

export function UpcomingMeetings({
  basePath,
  showFacility = true,
  limit = 3,
}: UpcomingMeetingsProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const response = await fetch("/api/meetings?upcoming=true");
        if (response.ok) {
          const data = await response.json();
          setMeetings((data.meetings || []).slice(0, limit));
        }
      } catch (error) {
        console.error("Failed to fetch upcoming meetings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeetings();
  }, [limit]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Upcoming Meetings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Upcoming Meetings
        </CardTitle>
        <Link href={`${basePath}/meetings`}>
          <Button variant="ghost" size="sm">
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {meetings.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            No upcoming meetings
          </p>
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting) => {
              const isHappeningNow = meeting.status === "IN_PROGRESS";

              return (
                <div
                  key={meeting.id}
                  className={`flex items-start justify-between p-3 rounded-lg border ${
                    isHappeningNow ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{meeting.title}</p>
                      {isHappeningNow && (
                        <Badge variant="default" className="text-xs">
                          Live
                        </Badge>
                      )}
                    </div>
                    {showFacility && (
                      <p className="text-xs text-muted-foreground">
                        {meeting.facility.name}
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDateTime(meeting.scheduledAt)}</span>
                      <span>({meeting.duration} min)</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {meeting.meetingUrl && (
                      <a
                        href={meeting.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          size="sm"
                          variant={isHappeningNow ? "default" : "outline"}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Join
                        </Button>
                      </a>
                    )}
                    <Link href={`${basePath}/meetings/${meeting.id}`}>
                      <Button variant="ghost" size="sm" className="w-full">
                        Details
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
