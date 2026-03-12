"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarView } from "@/components/calendar/calendar-view";
import { EventForm } from "@/components/calendar/event-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { startOfMonth, endOfMonth, addMonths } from "@/lib/calendar";
import type { CalendarEventInput } from "@/lib/validations";

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
}

export default function FacilityCalendarPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Check for eventId in URL to open specific event
  useEffect(() => {
    const eventId = searchParams.get("eventId");
    if (eventId && events.length > 0) {
      const event = events.find((e) => e.id === eventId);
      if (event) {
        setSelectedEvent(event);
        setIsFormOpen(true);
      }
    }
  }, [searchParams, events]);

  const fetchEvents = useCallback(async () => {
    try {
      // Fetch events for a 3-month window
      const start = startOfMonth(addMonths(currentMonth, -1));
      const end = endOfMonth(addMonths(currentMonth, 1));

      const response = await fetch(
        `/api/calendar?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
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
  }, [currentMonth, toast]);

  const fetchResidents = useCallback(async () => {
    try {
      const response = await fetch("/api/intakes?status=APPROVED&active=true");
      if (response.ok) {
        const data = await response.json();
        setResidents(
          data.intakes?.map((i: { id: string; residentName: string }) => ({
            id: i.id,
            residentName: i.residentName,
          })) || []
        );
      }
    } catch (error) {
      console.error("Failed to fetch residents:", error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchEvents(), fetchResidents()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchEvents, fetchResidents]);

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
      const url = selectedEvent?.id
        ? `/api/calendar/${selectedEvent.id}`
        : "/api/calendar";
      const method = selectedEvent?.id ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
    if (!event) return null;

    return {
      id: event.id,
      intakeId: event.intake?.id || "",
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <CalendarDays className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            Manage appointments and events for all residents
          </p>
        </div>
      </div>

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
        residents={residents}
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
