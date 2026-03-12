"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { CalendarHeader, type CalendarViewType } from "./calendar-header";
import { EventCard } from "./event-card";
import {
  getCalendarDays,
  getWeekDays,
  getHoursArray,
  formatHour,
  isToday,
  isSameDay,
  startOfDay,
  endOfDay,
} from "@/lib/calendar";

interface CalendarEvent {
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

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onAddEvent: () => void;
  onDateClick?: (date: Date) => void;
}

export function CalendarView({
  events,
  onEventClick,
  onAddEvent,
  onDateClick,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarViewType>("month");

  const getEventsForDay = useCallback(
    (date: Date) => {
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      return events.filter((event) => {
        const eventStart = new Date(event.startDateTime);
        const eventEnd = new Date(event.endDateTime);
        return eventStart <= dayEnd && eventEnd >= dayStart;
      });
    },
    [events]
  );

  const renderMonthView = () => {
    const days = getCalendarDays(
      currentDate.getFullYear(),
      currentDate.getMonth()
    );
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
      <div className="border rounded-lg overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-muted">
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-muted-foreground border-b"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {days.map((date, index) => {
            const dayEvents = getEventsForDay(date);
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            const today = isToday(date);

            return (
              <div
                key={index}
                className={cn(
                  "min-h-[100px] border-b border-r p-1 cursor-pointer hover:bg-muted/50 transition-colors",
                  !isCurrentMonth && "bg-muted/30",
                  index % 7 === 0 && "border-l"
                )}
                onClick={() => onDateClick?.(date)}
              >
                <div
                  className={cn(
                    "text-sm font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                    today && "bg-primary text-primary-foreground",
                    !isCurrentMonth && "text-muted-foreground"
                  )}
                >
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      compact
                      onClick={() => onEventClick(event)}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const days = getWeekDays(currentDate);
    const hours = getHoursArray();

    return (
      <div className="border rounded-lg overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-8 bg-muted border-b">
          <div className="p-2 text-center text-sm font-medium text-muted-foreground border-r">
            Time
          </div>
          {days.map((date, index) => {
            const today = isToday(date);
            return (
              <div
                key={index}
                className={cn(
                  "p-2 text-center border-r last:border-r-0",
                  today && "bg-primary/10"
                )}
              >
                <div className="text-sm font-medium">
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div
                  className={cn(
                    "text-lg font-bold",
                    today && "text-primary"
                  )}
                >
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div className="max-h-[600px] overflow-y-auto">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b">
              <div className="p-2 text-xs text-muted-foreground border-r text-right">
                {formatHour(hour)}
              </div>
              {days.map((date, dayIndex) => {
                const dayEvents = getEventsForDay(date).filter((event) => {
                  if (event.allDay) return hour === 0;
                  const eventStart = new Date(event.startDateTime);
                  return eventStart.getHours() === hour;
                });

                return (
                  <div
                    key={dayIndex}
                    className="min-h-[60px] p-1 border-r last:border-r-0 cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      const clickedDate = new Date(date);
                      clickedDate.setHours(hour, 0, 0, 0);
                      onDateClick?.(clickedDate);
                    }}
                  >
                    {dayEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        compact
                        onClick={() => onEventClick(event)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const hours = getHoursArray();
    const dayEvents = getEventsForDay(currentDate);
    const allDayEvents = dayEvents.filter((e) => e.allDay);
    const timedEvents = dayEvents.filter((e) => !e.allDay);

    return (
      <div className="border rounded-lg overflow-hidden">
        {/* Day header */}
        <div className="p-4 bg-muted border-b">
          <div className="text-lg font-semibold">
            {currentDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </div>
          {isToday(currentDate) && (
            <div className="text-sm text-primary font-medium">Today</div>
          )}
        </div>

        {/* All day events */}
        {allDayEvents.length > 0 && (
          <div className="p-2 border-b bg-muted/50">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              ALL DAY
            </div>
            <div className="space-y-1">
              {allDayEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  compact
                  onClick={() => onEventClick(event)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Time grid */}
        <div className="max-h-[600px] overflow-y-auto">
          {hours.map((hour) => {
            const hourEvents = timedEvents.filter((event) => {
              const eventStart = new Date(event.startDateTime);
              return eventStart.getHours() === hour;
            });

            return (
              <div key={hour} className="flex border-b">
                <div className="w-20 p-2 text-xs text-muted-foreground border-r text-right flex-shrink-0">
                  {formatHour(hour)}
                </div>
                <div
                  className="flex-1 min-h-[60px] p-2 cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    const clickedDate = new Date(currentDate);
                    clickedDate.setHours(hour, 0, 0, 0);
                    onDateClick?.(clickedDate);
                  }}
                >
                  <div className="space-y-1">
                    {hourEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onClick={() => onEventClick(event)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onDateChange={setCurrentDate}
        onViewChange={setView}
        onAddEvent={onAddEvent}
      />

      {view === "month" && renderMonthView()}
      {view === "week" && renderWeekView()}
      {view === "day" && renderDayView()}
    </div>
  );
}
