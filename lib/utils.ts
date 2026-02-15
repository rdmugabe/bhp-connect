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
