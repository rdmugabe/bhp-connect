"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { type CalendarEventInput, RECURRENCE_TYPES, DAYS_OF_WEEK } from "@/lib/validations";
import {
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  REMINDER_OPTIONS,
  type EventType,
} from "@/lib/calendar";
import { Loader2, X, Repeat } from "lucide-react";

const RECURRENCE_TYPE_LABELS: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  BIWEEKLY: "Every 2 Weeks",
  MONTHLY: "Monthly",
};

const DAY_LABELS: Record<string, string> = {
  SUN: "Sun",
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
};

interface Resident {
  id: string;
  residentName: string;
}

interface EventFormData {
  id?: string;
  intakeId: string;
  title: string;
  description?: string;
  eventType: string;
  location?: string;
  startDateTime: string;
  endDateTime: string;
  allDay: boolean;
  color?: string;
  reminderMinutes: number[];
  status?: string;
  // Recurrence fields
  isRecurring?: boolean;
  recurrenceType?: string;
  recurrenceEndDate?: string;
  recurrenceDays?: string[];
  parentEventId?: string;
}

interface EventFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: EventFormData | null;
  residents: Resident[];
  onSubmit: (data: CalendarEventInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  onComplete?: () => Promise<void>;
}

export function EventForm({
  open,
  onOpenChange,
  event,
  residents,
  onSubmit,
  onDelete,
  onComplete,
}: EventFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [intakeId, setIntakeId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<string>("OTHER");
  const [location, setLocation] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState<number[]>([60]);
  // Recurrence state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<string>("");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>([]);

  useEffect(() => {
    if (event) {
      setIntakeId(event.intakeId);
      setTitle(event.title);
      setDescription(event.description || "");
      setEventType(event.eventType);
      setLocation(event.location || "");
      setStartDateTime(event.startDateTime);
      setEndDateTime(event.endDateTime);
      setAllDay(event.allDay);
      setReminderMinutes(event.reminderMinutes || []);
      // Recurrence fields
      setIsRecurring(event.isRecurring || false);
      setRecurrenceType(event.recurrenceType || "");
      setRecurrenceEndDate(event.recurrenceEndDate || "");
      setRecurrenceDays(event.recurrenceDays || []);
    } else {
      // Default to current time rounded to nearest 30 min
      const now = new Date();
      now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30, 0, 0);
      const end = new Date(now);
      end.setHours(end.getHours() + 1);

      setIntakeId("");
      setTitle("");
      setDescription("");
      setEventType("OTHER");
      setLocation("");
      setStartDateTime(now.toISOString().slice(0, 16));
      setEndDateTime(end.toISOString().slice(0, 16));
      setAllDay(false);
      setReminderMinutes([60]);
      // Reset recurrence
      setIsRecurring(false);
      setRecurrenceType("");
      setRecurrenceEndDate("");
      setRecurrenceDays([]);
    }
    setErrors({});
  }, [event, open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!intakeId) newErrors.intakeId = "Resident is required";
    if (!title) newErrors.title = "Title is required";
    if (!startDateTime) newErrors.startDateTime = "Start date/time is required";
    if (!endDateTime) newErrors.endDateTime = "End date/time is required";

    if (startDateTime && endDateTime) {
      const start = new Date(startDateTime);
      const end = new Date(endDateTime);
      if (end < start) {
        newErrors.endDateTime = "End time must be after start time";
      }
    }

    // Recurrence validation
    if (isRecurring) {
      if (!recurrenceType) {
        newErrors.recurrenceType = "Recurrence type is required";
      }
      if (recurrenceType === "WEEKLY" && recurrenceDays.length === 0) {
        newErrors.recurrenceDays = "Select at least one day";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);
    try {
      const data: CalendarEventInput = {
        intakeId,
        title,
        description: description || undefined,
        eventType: eventType as CalendarEventInput["eventType"],
        location: location || undefined,
        startDateTime,
        endDateTime,
        allDay,
        reminderMinutes,
        // Recurrence fields
        isRecurring,
        recurrenceType: isRecurring ? recurrenceType as CalendarEventInput["recurrenceType"] : undefined,
        recurrenceEndDate: isRecurring && recurrenceEndDate ? recurrenceEndDate : undefined,
        recurrenceDays: isRecurring && recurrenceType === "WEEKLY" ? recurrenceDays as CalendarEventInput["recurrenceDays"] : [],
      };
      await onSubmit(data);
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting event:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleComplete = async () => {
    if (!onComplete) return;
    setIsCompleting(true);
    try {
      await onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Error completing event:", error);
    } finally {
      setIsCompleting(false);
    }
  };

  const toggleReminder = (value: number) => {
    if (reminderMinutes.includes(value)) {
      setReminderMinutes(reminderMinutes.filter((v) => v !== value));
    } else {
      setReminderMinutes([...reminderMinutes, value]);
    }
  };

  const toggleRecurrenceDay = (day: string) => {
    if (recurrenceDays.includes(day)) {
      setRecurrenceDays(recurrenceDays.filter((d) => d !== day));
    } else {
      setRecurrenceDays([...recurrenceDays, day]);
    }
  };

  const isEditing = !!event?.id;
  const canComplete = isEditing && event?.status === "SCHEDULED";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Event" : "New Event"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resident">Resident *</Label>
            <Select value={intakeId} onValueChange={setIntakeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a resident" />
              </SelectTrigger>
              <SelectContent>
                {residents.map((resident) => (
                  <SelectItem key={resident.id} value={resident.id}>
                    {resident.residentName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.intakeId && (
              <p className="text-sm text-destructive">{errors.intakeId}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Event title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventType">Event Type *</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EVENT_TYPES).map(([key, value]) => (
                  <SelectItem key={value} value={value}>
                    {EVENT_TYPE_LABELS[value as EventType]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Event description (optional)"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="Event location (optional)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="allDay"
              checked={allDay}
              onCheckedChange={(checked) => setAllDay(checked === true)}
            />
            <Label htmlFor="allDay" className="font-normal">
              All day event
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDateTime">Start *</Label>
              <Input
                id="startDateTime"
                type="datetime-local"
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
              />
              {errors.startDateTime && (
                <p className="text-sm text-destructive">{errors.startDateTime}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDateTime">End *</Label>
              <Input
                id="endDateTime"
                type="datetime-local"
                value={endDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}
              />
              {errors.endDateTime && (
                <p className="text-sm text-destructive">{errors.endDateTime}</p>
              )}
            </div>
          </div>

          {/* Recurrence Section */}
          <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isRecurring"
                checked={isRecurring}
                onCheckedChange={(checked) => {
                  setIsRecurring(checked === true);
                  if (!checked) {
                    setRecurrenceType("");
                    setRecurrenceEndDate("");
                    setRecurrenceDays([]);
                  }
                }}
              />
              <Label htmlFor="isRecurring" className="font-normal flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                Repeat this event
              </Label>
            </div>

            {isRecurring && (
              <div className="space-y-3 pl-6">
                <div className="space-y-2">
                  <Label>Repeat *</Label>
                  <Select value={recurrenceType} onValueChange={setRecurrenceType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {RECURRENCE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {RECURRENCE_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.recurrenceType && (
                    <p className="text-sm text-destructive">{errors.recurrenceType}</p>
                  )}
                </div>

                {recurrenceType === "WEEKLY" && (
                  <div className="space-y-2">
                    <Label>Repeat on *</Label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <Badge
                          key={day}
                          variant={recurrenceDays.includes(day) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleRecurrenceDay(day)}
                        >
                          {DAY_LABELS[day]}
                        </Badge>
                      ))}
                    </div>
                    {errors.recurrenceDays && (
                      <p className="text-sm text-destructive">{errors.recurrenceDays}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="recurrenceEndDate">End Date (optional)</Label>
                  <Input
                    id="recurrenceEndDate"
                    type="date"
                    value={recurrenceEndDate}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to repeat indefinitely
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Reminders</Label>
            <div className="flex flex-wrap gap-2">
              {REMINDER_OPTIONS.map((option) => (
                <Badge
                  key={option.value}
                  variant={
                    reminderMinutes.includes(option.value) ? "default" : "outline"
                  }
                  className="cursor-pointer"
                  onClick={() => toggleReminder(option.value)}
                >
                  {option.label}
                  {reminderMinutes.includes(option.value) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting || isLoading || isCompleting}
                className="sm:mr-auto"
              >
                {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete
              </Button>
            )}
            {canComplete && onComplete && (
              <Button
                type="button"
                variant="outline"
                onClick={handleComplete}
                disabled={isDeleting || isLoading || isCompleting}
              >
                {isCompleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Mark Complete
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isDeleting || isLoading || isCompleting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isDeleting || isLoading || isCompleting}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
