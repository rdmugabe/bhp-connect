"use client";

import { cn } from "@/lib/utils";
import {
  getEventColor,
  getResidentInitials,
  formatTime,
  EVENT_TYPE_LABELS,
  EVENT_STATUS_LABELS,
  type EventType,
} from "@/lib/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Clock, MapPin, CheckCircle, XCircle } from "lucide-react";

interface CalendarEventData {
  id: string;
  title: string;
  description?: string | null;
  eventType: string;
  location?: string | null;
  startDateTime: Date | string;
  endDateTime: Date | string;
  allDay: boolean;
  color?: string | null;
  status: string;
  intake?: {
    id: string;
    residentName: string;
  } | null;
}

interface EventCardProps {
  event: CalendarEventData;
  compact?: boolean;
  onClick?: () => void;
}

export function EventCard({ event, compact = false, onClick }: EventCardProps) {
  const color = getEventColor(event.eventType, event.color);
  const initials = event.intake?.residentName
    ? getResidentInitials(event.intake.residentName)
    : "?";
  const startTime = new Date(event.startDateTime);
  const endTime = new Date(event.endDateTime);

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onClick}
              className={cn(
                "w-full text-left text-xs p-1 rounded truncate hover:opacity-80 transition-opacity cursor-pointer",
                event.status === "CANCELLED" && "opacity-50 line-through"
              )}
              style={{
                backgroundColor: `${color}20`,
                borderLeft: `3px solid ${color}`,
              }}
            >
              <div className="flex items-center gap-1">
                <span
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-medium text-white flex-shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {initials}
                </span>
                <span className="truncate">{event.title}</span>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-semibold">{event.title}</p>
              <p className="text-sm text-muted-foreground">
                {event.intake?.residentName}
              </p>
              <p className="text-sm">
                {event.allDay
                  ? "All Day"
                  : `${formatTime(startTime)} - ${formatTime(endTime)}`}
              </p>
              {event.location && (
                <p className="text-sm text-muted-foreground">{event.location}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow",
        event.status === "CANCELLED" && "opacity-50"
      )}
      style={{
        borderLeftWidth: "4px",
        borderLeftColor: color,
      }}
    >
      <div className="flex items-start gap-3">
        <span
          className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium text-white flex-shrink-0"
          style={{ backgroundColor: color }}
        >
          {initials}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4
              className={cn(
                "font-medium truncate",
                event.status === "CANCELLED" && "line-through"
              )}
            >
              {event.title}
            </h4>
            {event.status === "COMPLETED" && (
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
            )}
            {event.status === "CANCELLED" && (
              <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {event.intake?.residentName}
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                {event.allDay
                  ? "All Day"
                  : `${formatTime(startTime)} - ${formatTime(endTime)}`}
              </span>
            </div>
            {event.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-[100px]">{event.location}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              variant="secondary"
              className="text-xs"
              style={{ backgroundColor: `${color}20`, color: color }}
            >
              {EVENT_TYPE_LABELS[event.eventType as EventType] || event.eventType}
            </Badge>
            {event.status !== "SCHEDULED" && (
              <Badge
                variant={event.status === "COMPLETED" ? "default" : "destructive"}
                className="text-xs"
              >
                {EVENT_STATUS_LABELS[event.status as keyof typeof EVENT_STATUS_LABELS]}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
