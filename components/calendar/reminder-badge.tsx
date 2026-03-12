"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check, Clock, User } from "lucide-react";
import { formatTime, getEventColor, EVENT_TYPE_LABELS, type EventType } from "@/lib/calendar";
import Link from "next/link";

interface CalendarReminder {
  id: string;
  reminderTime: string;
  event: {
    id: string;
    title: string;
    eventType: string;
    startDateTime: string;
    location?: string | null;
    intake?: {
      id: string;
      residentName: string;
    } | null;
  };
}

interface ReminderBadgeProps {
  className?: string;
}

export function ReminderBadge({ className }: ReminderBadgeProps) {
  const [reminders, setReminders] = useState<CalendarReminder[]>([]);
  const [count, setCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchReminders = useCallback(async () => {
    try {
      const response = await fetch("/api/calendar/reminders");
      if (response.ok) {
        const data = await response.json();
        setReminders(data.reminders || []);
        setCount(data.count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch reminders:", error);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
    // Refresh every 30 seconds
    const interval = setInterval(fetchReminders, 30000);
    return () => clearInterval(interval);
  }, [fetchReminders]);

  const handleAcknowledge = async (reminderId: string) => {
    try {
      const response = await fetch(
        `/api/calendar/reminders/${reminderId}/acknowledge`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        // Remove the acknowledged reminder from the list
        setReminders((prev) => prev.filter((r) => r.id !== reminderId));
        setCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to acknowledge reminder:", error);
    }
  };

  if (count === 0) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className}
        >
          <div className="relative">
            <Bell className="h-5 w-5" />
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 min-w-[20px] px-1 text-xs"
            >
              {count > 99 ? "99+" : count}
            </Badge>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <h4 className="font-semibold">Calendar Reminders</h4>
          <p className="text-sm text-muted-foreground">
            {count} upcoming {count === 1 ? "event" : "events"}
          </p>
        </div>
        <ScrollArea className="max-h-[300px]">
          <div className="p-2 space-y-2">
            {reminders.map((reminder) => {
              const color = getEventColor(reminder.event.eventType);
              const eventTime = new Date(reminder.event.startDateTime);

              return (
                <div
                  key={reminder.id}
                  className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  style={{ borderLeftWidth: "3px", borderLeftColor: color }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/facility/calendar?eventId=${reminder.event.id}`}
                        className="font-medium text-sm hover:underline"
                        onClick={() => setIsOpen(false)}
                      >
                        {reminder.event.title}
                      </Link>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <User className="h-3 w-3" />
                        <span>{reminder.event.intake?.residentName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {eventTime.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          at {formatTime(eventTime)}
                        </span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-xs mt-1"
                        style={{ backgroundColor: `${color}20`, color: color }}
                      >
                        {EVENT_TYPE_LABELS[reminder.event.eventType as EventType] ||
                          reminder.event.eventType}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => handleAcknowledge(reminder.id)}
                      title="Acknowledge"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <div className="p-2 border-t">
          <Link href="/facility/calendar" onClick={() => setIsOpen(false)}>
            <Button variant="ghost" className="w-full" size="sm">
              View Calendar
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
