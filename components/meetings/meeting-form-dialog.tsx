"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
}

interface MeetingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting?: Meeting | null;
  facilities: Facility[];
  onSuccess: () => void;
}

export function MeetingFormDialog({
  open,
  onOpenChange,
  meeting,
  facilities,
  onSuccess,
}: MeetingFormDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    facilityId: "",
    title: "",
    description: "",
    scheduledAt: "",
    duration: 30,
    meetingUrl: "",
  });

  useEffect(() => {
    if (meeting) {
      const scheduledDate = new Date(meeting.scheduledAt);
      const localDateTime = new Date(scheduledDate.getTime() - scheduledDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);

      setFormData({
        facilityId: meeting.facilityId,
        title: meeting.title,
        description: meeting.description || "",
        scheduledAt: localDateTime,
        duration: meeting.duration,
        meetingUrl: meeting.meetingUrl || "",
      });
    } else {
      // Default to tomorrow at 10 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      const localDateTime = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);

      setFormData({
        facilityId: facilities.length === 1 ? facilities[0].id : "",
        title: "",
        description: "",
        scheduledAt: localDateTime,
        duration: 30,
        meetingUrl: "",
      });
    }
  }, [meeting, open, facilities]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = meeting
        ? `/api/meetings/${meeting.id}`
        : "/api/meetings";
      const method = meeting ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          duration: Number(formData.duration),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save meeting");
      }

      toast({
        title: "Success",
        description: meeting
          ? "Meeting updated successfully"
          : "Meeting scheduled successfully",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save meeting",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {meeting ? "Edit Meeting" : "Schedule Meeting"}
          </DialogTitle>
          <DialogDescription>
            {meeting
              ? "Update meeting details"
              : "Schedule a video consultation with a facility"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="facilityId">Facility *</Label>
            <Select
              value={formData.facilityId}
              onValueChange={(value) =>
                setFormData({ ...formData, facilityId: value })
              }
              disabled={!!meeting}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a facility" />
              </SelectTrigger>
              <SelectContent>
                {facilities.map((facility) => (
                  <SelectItem key={facility.id} value={facility.id}>
                    {facility.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">Meeting Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
              className="mt-1"
              placeholder="e.g., Monthly Check-in, Compliance Review"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="mt-1"
              placeholder="Meeting agenda or notes..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scheduledAt">Date & Time *</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) =>
                  setFormData({ ...formData, scheduledAt: e.target.value })
                }
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Select
                value={String(formData.duration)}
                onValueChange={(value) =>
                  setFormData({ ...formData, duration: Number(value) })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="meetingUrl">Meeting URL</Label>
            <Input
              id="meetingUrl"
              type="url"
              value={formData.meetingUrl}
              onChange={(e) =>
                setFormData({ ...formData, meetingUrl: e.target.value })
              }
              className="mt-1"
              placeholder="https://zoom.us/j/... or https://meet.google.com/..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Paste your Zoom, Google Meet, or other video conferencing link
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.facilityId}>
              {isLoading ? "Saving..." : meeting ? "Update" : "Schedule Meeting"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
