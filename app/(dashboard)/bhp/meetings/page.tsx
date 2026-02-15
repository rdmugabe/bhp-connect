"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MeetingCard } from "@/components/meetings/meeting-card";
import { MeetingFormDialog } from "@/components/meetings/meeting-form-dialog";
import { Plus, Video } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Facility {
  id: string;
  name: string;
}

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

export default function BHPMeetingsPage() {
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterFacility, setFilterFacility] = useState<string>("all");

  const fetchData = async () => {
    try {
      const [meetingsRes, facilitiesRes] = await Promise.all([
        fetch("/api/meetings"),
        fetch("/api/facilities"),
      ]);

      if (meetingsRes.ok) {
        const meetingsData = await meetingsRes.json();
        setMeetings(meetingsData.meetings || []);
      }

      if (facilitiesRes.ok) {
        const facilitiesData = await facilitiesRes.json();
        setFacilities(facilitiesData.facilities || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
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
    fetchData();
  }, []);

  const filteredMeetings = meetings.filter(
    (m) => filterFacility === "all" || m.facilityId === filterFacility
  );

  const scheduledMeetings = filteredMeetings.filter((m) => m.status === "SCHEDULED");
  const inProgressMeetings = filteredMeetings.filter((m) => m.status === "IN_PROGRESS");
  const completedMeetings = filteredMeetings.filter((m) => m.status === "COMPLETED");
  const cancelledMeetings = filteredMeetings.filter((m) => m.status === "CANCELLED");
  const upcomingMeetings = [...scheduledMeetings, ...inProgressMeetings].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );

  const MeetingsGrid = ({ items }: { items: Meeting[] }) => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((meeting) => (
        <MeetingCard
          key={meeting.id}
          meeting={meeting}
          basePath="/bhp"
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
          <p className="text-muted-foreground">
            Schedule and manage video consultations with your facilities
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Meeting
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-64">
          <Select value={filterFacility} onValueChange={setFilterFacility}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by facility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Facilities</SelectItem>
              {facilities.map((facility) => (
                <SelectItem key={facility.id} value={facility.id}>
                  {facility.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
          <TabsTrigger value="all">All ({filteredMeetings.length})</TabsTrigger>
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
              <MeetingsGrid items={filteredMeetings} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <MeetingFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        facilities={facilities}
        onSuccess={fetchData}
      />
    </div>
  );
}
