"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { addMonths } from "@/lib/calendar";

export type CalendarViewType = "month" | "week" | "day";

interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarViewType;
  onDateChange: (date: Date) => void;
  onViewChange: (view: CalendarViewType) => void;
  onAddEvent: () => void;
}

export function CalendarHeader({
  currentDate,
  view,
  onDateChange,
  onViewChange,
  onAddEvent,
}: CalendarHeaderProps) {
  const handlePrevious = () => {
    if (view === "month") {
      onDateChange(addMonths(currentDate, -1));
    } else if (view === "week") {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      onDateChange(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 1);
      onDateChange(newDate);
    }
  };

  const handleNext = () => {
    if (view === "month") {
      onDateChange(addMonths(currentDate, 1));
    } else if (view === "week") {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      onDateChange(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 1);
      onDateChange(newDate);
    }
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const getTitle = () => {
    if (view === "month") {
      return currentDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    } else if (view === "week") {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        return `${startOfWeek.toLocaleDateString("en-US", { month: "long" })} ${startOfWeek.getDate()} - ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
      } else {
        return `${startOfWeek.toLocaleDateString("en-US", { month: "short" })} ${startOfWeek.getDate()} - ${endOfWeek.toLocaleDateString("en-US", { month: "short" })} ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
      }
    } else {
      return currentDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleToday}>
          Today
        </Button>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h2 className="text-xl font-semibold ml-2">{getTitle()}</h2>
      </div>

      <div className="flex items-center gap-2">
        <Select value={view} onValueChange={(v) => onViewChange(v as CalendarViewType)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="day">Day</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={onAddEvent}>
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>
    </div>
  );
}
