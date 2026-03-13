// Calendar utility functions

export const EVENT_TYPES = {
  DOCTOR_VISIT: "DOCTOR_VISIT",
  THERAPY: "THERAPY",
  COURT_DATE: "COURT_DATE",
  FAMILY_VISIT: "FAMILY_VISIT",
  CASE_MANAGEMENT: "CASE_MANAGEMENT",
  TRANSPORTATION: "TRANSPORTATION",
  OTHER: "OTHER",
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  DOCTOR_VISIT: "Doctor Visit",
  THERAPY: "Therapy",
  COURT_DATE: "Court Date",
  FAMILY_VISIT: "Family Visit",
  CASE_MANAGEMENT: "Case Management",
  TRANSPORTATION: "Transportation",
  OTHER: "Other",
};

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  DOCTOR_VISIT: "#3B82F6", // Blue
  THERAPY: "#8B5CF6", // Purple
  COURT_DATE: "#EF4444", // Red
  FAMILY_VISIT: "#22C55E", // Green
  CASE_MANAGEMENT: "#F97316", // Orange
  TRANSPORTATION: "#14B8A6", // Teal
  OTHER: "#6B7280", // Gray
};

export const EVENT_STATUSES = {
  SCHEDULED: "SCHEDULED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type EventStatus = (typeof EVENT_STATUSES)[keyof typeof EVENT_STATUSES];

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

// Reminder options in minutes
export const REMINDER_OPTIONS = [
  { value: 15, label: "15 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 120, label: "2 hours before" },
  { value: 1440, label: "1 day before" },
  { value: 2880, label: "2 days before" },
];

/**
 * Get the color for an event type
 */
export function getEventColor(eventType: string, customColor?: string | null): string {
  if (customColor) return customColor;
  return EVENT_TYPE_COLORS[eventType as EventType] || EVENT_TYPE_COLORS.OTHER;
}

/**
 * Get initials from a resident name
 */
export function getResidentInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Format time for display (e.g., "9:00 AM")
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format date range for display
 */
export function formatDateRange(start: Date, end: Date, allDay: boolean): string {
  if (allDay) {
    return "All Day";
  }

  const sameDay = start.toDateString() === end.toDateString();

  if (sameDay) {
    return `${formatTime(start)} - ${formatTime(end)}`;
  }

  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${formatTime(start)} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${formatTime(end)}`;
}

/**
 * Get the start of a day (midnight)
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get the end of a day (11:59:59.999 PM)
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Get the start of a month
 */
export function startOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get the end of a month
 */
export function endOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1);
  result.setDate(0);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Get the start of a week (Sunday)
 */
export function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get the end of a week (Saturday)
 */
export function endOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() + (6 - day));
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add months to a date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.toDateString() === date2.toDateString();
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Get days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Get calendar days for a month view (including days from previous/next months)
 */
export function getCalendarDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Add days from previous month to fill the first week
  const firstDayOfWeek = firstDay.getDay();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    days.push(addDays(firstDay, -(i + 1)));
  }

  // Add all days in the month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  // Add days from next month to fill the last week
  const lastDayOfWeek = lastDay.getDay();
  for (let i = 1; i < 7 - lastDayOfWeek; i++) {
    days.push(addDays(lastDay, i));
  }

  return days;
}

/**
 * Get week days for a week view
 */
export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(start, i));
  }
  return days;
}

/**
 * Calculate reminder times from event start time and reminder minutes array
 */
export function calculateReminderTimes(
  startDateTime: Date,
  reminderMinutes: number[]
): Date[] {
  return reminderMinutes.map((minutes) => {
    const reminderTime = new Date(startDateTime);
    reminderTime.setMinutes(reminderTime.getMinutes() - minutes);
    return reminderTime;
  });
}

/**
 * Get hours array for day/week view
 */
export function getHoursArray(): number[] {
  return Array.from({ length: 24 }, (_, i) => i);
}

/**
 * Format hour for display (e.g., "9 AM")
 */
export function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
}

/**
 * Format a date for datetime-local input (YYYY-MM-DDTHH:mm) using local time
 */
export function formatDateTimeLocal(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Format a date for date input (YYYY-MM-DD) using local time
 */
export function formatDateLocal(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
