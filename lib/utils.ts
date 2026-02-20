import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getExpirationStatus(
  expiresAt: Date | string | null
): "valid" | "expiring" | "expired" {
  if (!expiresAt) return "valid";

  const now = new Date();
  const expiration = new Date(expiresAt);
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (expiration < now) return "expired";
  if (expiration < thirtyDaysFromNow) return "expiring";
  return "valid";
}

export function getComplianceColor(
  status: "valid" | "expiring" | "expired"
): string {
  switch (status) {
    case "valid":
      return "text-green-600 bg-green-50";
    case "expiring":
      return "text-yellow-600 bg-yellow-50";
    case "expired":
      return "text-red-600 bg-red-50";
  }
}

// Bi-week utility functions for oversight training reports
// Uses ISO week pairs: weeks 1-2 = BiWeek 1, weeks 3-4 = BiWeek 2, etc. (26 bi-weeks per year)

export function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function getBiWeekNumber(date: Date): number {
  const isoWeek = getISOWeek(date);
  return Math.ceil(isoWeek / 2);
}

export function getBiWeekDateRange(biWeek: number, year: number): { start: Date; end: Date } {
  // Calculate the first day of the bi-week
  // BiWeek 1 = ISO weeks 1-2, BiWeek 2 = ISO weeks 3-4, etc.
  const startWeek = (biWeek - 1) * 2 + 1;
  const endWeek = startWeek + 1;

  // Get January 4th of the year (always in ISO week 1)
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() || 7;

  // Calculate first day of ISO week 1 (Monday)
  const week1Start = new Date(jan4);
  week1Start.setDate(jan4.getDate() - jan4Day + 1);

  // Calculate start of the bi-week
  const start = new Date(week1Start);
  start.setDate(week1Start.getDate() + (startWeek - 1) * 7);

  // Calculate end of the bi-week (Sunday of the second week)
  const end = new Date(start);
  end.setDate(start.getDate() + 13); // 14 days - 1

  return { start, end };
}

export function formatBiWeekLabel(biWeek: number, year: number): string {
  const { start, end } = getBiWeekDateRange(biWeek, year);
  const startMonth = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endMonth = end.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${startMonth} - ${endMonth}, ${year}`;
}

export function getCurrentBiWeekInfo(): { biWeek: number; year: number } {
  const now = new Date();
  // Use the ISO week year which might differ from calendar year at year boundaries
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const year = d.getUTCFullYear();
  const biWeek = getBiWeekNumber(now);
  return { biWeek, year };
}
