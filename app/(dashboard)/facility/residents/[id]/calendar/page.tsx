"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CalendarView } from "@/components/calendar/calendar-view";
import { EventForm } from "@/components/calendar/event-form";
import { EventCard } from "@/components/calendar/event-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CalendarDays, Loader2, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { startOfMonth, endOfMonth, addMonths } from "@/lib/calendar";
import { formatDate } from "@/lib/utils";
import type { CalendarEventInput } from "@/lib/validations";
import { ResidentTabs } from "@/components/residents/resident-tabs";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  eventType: string;
  location?: string | null;
  startDateTime: string;
  endDateTime: string;
  allDay: boolean;
  color?: string | null;
  status: string;
  reminderMinutes: number[];
  intake?: {
    id: string;
    residentName: string;
  } | null;
}

interface Resident {
  id: string;
  residentName: string;
  dateOfBirth?: string;
  admissionDate?: string;
}

export default function ResidentCalendarPage() {
  const params = useParams();
  const intakeId = params.id as string;
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [resident, setResident] = useState<Resident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchEvents = useCallback(async () => {
    try {
      // Fetch events for a 3-month window
      const start = startOfMonth(addMonths(currentMonth, -1));
      const end = endOfMonth(addMonths(currentMonth, 1));

      const response = await fetch(
        `/api/calendar?intakeId=${intakeId}&startDate=${start.toISOString()}&endDate=${end.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
      toast({
        title: "Error",
        description: "Failed to load calendar events",
        variant: "destructive",
      });
    }
  }, [intakeId, currentMonth, toast]);

  const fetchResident = useCallback(async () => {
    try {
      const response = await fetch(`/api/intakes/${intakeId}`);
      if (response.ok) {
        const data = await response.json();
        setResident({
          id: data.intake.id,
          residentName: data.intake.residentName,
          dateOfBirth: data.intake.dateOfBirth,
          admissionDate: data.intake.admissionDate || data.intake.createdAt,
        });
      }
    } catch (error) {
      console.error("Failed to fetch resident:", error);
    }
  }, [intakeId]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchEvents(), fetchResident()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchEvents, fetchResident]);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsFormOpen(true);
  };

  const handleAddEvent = () => {
    setSelectedEvent(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (data: CalendarEventInput) => {
    try {
      // Ensure intakeId is set to the current resident
      const eventData = { ...data, intakeId };

      const url = selectedEvent?.id
        ? `/api/calendar/${selectedEvent.id}`
        : "/api/calendar";
      const method = selectedEvent?.id ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save event");
      }

      toast({
        title: "Success",
        description: selectedEvent?.id
          ? "Event updated successfully"
          : "Event created successfully",
      });

      await fetchEvents();
    } catch (error) {
      console.error("Error saving event:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save event",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent?.id) return;

    try {
      const response = await fetch(`/api/calendar/${selectedEvent.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      toast({
        title: "Success",
        description: "Event deleted successfully",
      });

      await fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleComplete = async () => {
    if (!selectedEvent?.id) return;

    try {
      const response = await fetch(
        `/api/calendar/${selectedEvent.id}/complete`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to complete event");
      }

      toast({
        title: "Success",
        description: "Event marked as completed",
      });

      await fetchEvents();
    } catch (error) {
      console.error("Error completing event:", error);
      toast({
        title: "Error",
        description: "Failed to complete event",
        variant: "destructive",
      });
      throw error;
    }
  };

  const formatEventForForm = (event: CalendarEvent | null) => {
    if (!event) {
      // Pre-fill with resident ID
      return {
        intakeId,
        title: "",
        description: "",
        eventType: "OTHER" as const,
        location: "",
        startDateTime: new Date().toISOString().slice(0, 16),
        endDateTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
        allDay: false,
        color: "",
        reminderMinutes: [60],
      };
    }

    return {
      id: event.id,
      intakeId: event.intake?.id || intakeId,
      title: event.title,
      description: event.description || undefined,
      eventType: event.eventType,
      location: event.location || undefined,
      startDateTime: new Date(event.startDateTime).toISOString().slice(0, 16),
      endDateTime: new Date(event.endDateTime).toISOString().slice(0, 16),
      allDay: event.allDay,
      color: event.color || undefined,
      reminderMinutes: event.reminderMinutes || [],
      status: event.status,
    };
  };

  // Get upcoming events
  const upcomingEvents = events
    .filter(
      (e) =>
        e.status === "SCHEDULED" && new Date(e.startDateTime) >= new Date()
    )
    .sort(
      (a, b) =>
        new Date(a.startDateTime).getTime() -
        new Date(b.startDateTime).getTime()
    )
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/facility/residents">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {resident?.residentName || "Resident"}
            </h1>
            {resident && (
              <p className="text-muted-foreground">
                DOB: {formatDate(new Date(resident.dateOfBirth || ""))} | Admitted:{" "}
                {formatDate(new Date(resident.admissionDate || ""))}
              </p>
            )}
          </div>
        </div>
        <Button onClick={handleAddEvent}>
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>

      <ResidentTabs residentId={intakeId} isApproved={true} isDischarged={false} />

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Upcoming Events
              <Badge variant="secondary">{upcomingEvents.length}</Badge>
            </CardTitle>
            <CardDescription>
              Next scheduled appointments and events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={{
                    ...event,
                    startDateTime: new Date(event.startDateTime),
                    endDateTime: new Date(event.endDateTime),
                  }}
                  onClick={() => handleEventClick(event)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar View */}
      <Card>
        <CardContent className="pt-6">
          <CalendarView
            events={events.map((e) => ({
              ...e,
              startDateTime: new Date(e.startDateTime),
              endDateTime: new Date(e.endDateTime),
            }))}
            onEventClick={(event) => {
              const fullEvent = events.find((e) => e.id === event.id);
              if (fullEvent) handleEventClick(fullEvent);
            }}
            onAddEvent={handleAddEvent}
          />
        </CardContent>
      </Card>

      <EventForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        event={formatEventForForm(selectedEvent)}
        residents={resident ? [resident] : []}
        onSubmit={handleSubmit}
        onDelete={selectedEvent?.id ? handleDelete : undefined}
        onComplete={
          selectedEvent?.id && selectedEvent.status === "SCHEDULED"
            ? handleComplete
            : undefined
        }
      />
    </div>
  );
}
