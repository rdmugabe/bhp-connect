"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MeetingCard } from "@/components/meetings/meeting-card";
import { Video } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Meeting {
  id: string;
  facilityId: string;
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

export default function FacilityMeetingsPage() {
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMeetings = async () => {
    try {
      const response = await fetch("/api/meetings");

      if (response.ok) {
        const data = await response.json();
        setMeetings(data.meetings || []);
      }
    } catch (error) {
      console.error("Failed to fetch meetings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load meetings",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const scheduledMeetings = meetings.filter((m) => m.status === "SCHEDULED");
  const inProgressMeetings = meetings.filter((m) => m.status === "IN_PROGRESS");
  const completedMeetings = meetings.filter((m) => m.status === "COMPLETED");
  const cancelledMeetings = meetings.filter((m) => m.status === "CANCELLED");
  const upcomingMeetings = [...scheduledMeetings, ...inProgressMeetings].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );

  const MeetingsGrid = ({ items }: { items: Meeting[] }) => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((meeting) => (
        <MeetingCard
          key={meeting.id}
          meeting={meeting}
          basePath="/facility"
          showFacility={false}
        />
      ))}
      {items.length === 0 && (
        <div className="col-span-full text-center py-8 text-muted-foreground">
          <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No meetings found</p>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
        <p className="text-muted-foreground">
          View scheduled video consultations with your BHP
        </p>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingMeetings.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedMeetings.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({cancelledMeetings.length})
          </TabsTrigger>
          <TabsTrigger value="all">All ({meetings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <Card>
            <CardContent className="pt-6">
              <MeetingsGrid items={upcomingMeetings} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardContent className="pt-6">
              <MeetingsGrid items={completedMeetings} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cancelled">
          <Card>
            <CardContent className="pt-6">
              <MeetingsGrid items={cancelledMeetings} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardContent className="pt-6">
              <MeetingsGrid items={meetings} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
