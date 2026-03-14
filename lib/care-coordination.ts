import { CareCoordinationActivityType } from "@prisma/client";
import {
  Stethoscope,
  Brain,
  Car,
  Shield,
  Users,
  Calendar,
  Pill,
  Heart,
  ArrowRightCircle,
  MoreHorizontal,
  LucideIcon,
} from "lucide-react";

// Activity type configuration with colors and icons
export interface ActivityTypeConfig {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  icon: LucideIcon;
}

export const ACTIVITY_TYPE_CONFIG: Record<CareCoordinationActivityType, ActivityTypeConfig> = {
  MEDICAL: {
    label: "Medical",
    color: "red",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    borderColor: "border-red-200",
    icon: Stethoscope,
  },
  BEHAVIORAL_HEALTH: {
    label: "Behavioral Health",
    color: "purple",
    bgColor: "bg-purple-50",
    textColor: "text-purple-700",
    borderColor: "border-purple-200",
    icon: Brain,
  },
  TRANSPORTATION: {
    label: "Transportation",
    color: "blue",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
    icon: Car,
  },
  INSURANCE: {
    label: "Insurance",
    color: "green",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200",
    icon: Shield,
  },
  CASE_MANAGER: {
    label: "Case Manager",
    color: "yellow",
    bgColor: "bg-yellow-50",
    textColor: "text-yellow-700",
    borderColor: "border-yellow-200",
    icon: Users,
  },
  APPOINTMENTS: {
    label: "Appointments",
    color: "cyan",
    bgColor: "bg-cyan-50",
    textColor: "text-cyan-700",
    borderColor: "border-cyan-200",
    icon: Calendar,
  },
  MEDICATIONS: {
    label: "Medications",
    color: "orange",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
    borderColor: "border-orange-200",
    icon: Pill,
  },
  FAMILY: {
    label: "Family",
    color: "pink",
    bgColor: "bg-pink-50",
    textColor: "text-pink-700",
    borderColor: "border-pink-200",
    icon: Heart,
  },
  REFERRALS: {
    label: "Referrals",
    color: "indigo",
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-700",
    borderColor: "border-indigo-200",
    icon: ArrowRightCircle,
  },
  OTHER: {
    label: "Other",
    color: "gray",
    bgColor: "bg-gray-50",
    textColor: "text-gray-700",
    borderColor: "border-gray-200",
    icon: MoreHorizontal,
  },
};

// Helper function to get activity type config
export function getActivityTypeConfig(type: CareCoordinationActivityType): ActivityTypeConfig {
  return ACTIVITY_TYPE_CONFIG[type] || ACTIVITY_TYPE_CONFIG.OTHER;
}

// Activity type options for select dropdowns
export const ACTIVITY_TYPE_OPTIONS = Object.entries(ACTIVITY_TYPE_CONFIG).map(([value, config]) => ({
  value: value as CareCoordinationActivityType,
  label: config.label,
  icon: config.icon,
}));

// Helper to format activity date/time
export function formatActivityDateTime(date: Date, time?: string | null): string {
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (time) {
    return `${dateStr} at ${time}`;
  }
  return dateStr;
}

// Group entries by date for timeline display
export interface TimelineGroup {
  date: string;
  dateFormatted: string;
  entries: CareCoordinationEntryWithDetails[];
}

export interface CareCoordinationEntryWithDetails {
  id: string;
  activityType: CareCoordinationActivityType;
  activityDate: Date;
  activityTime: string | null;
  description: string;
  outcome: string | null;
  followUpNeeded: boolean;
  followUpDate: Date | null;
  followUpNotes: string | null;
  contactName: string | null;
  contactRole: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  createdById: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
  editHistory: unknown;
  archivedAt: Date | null;
  attachments: {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
    uploadedByName: string;
    uploadedAt: Date;
  }[];
  progressNoteLinks: {
    id: string;
    progressNoteId: string;
    linkedByName: string;
    linkedAt: Date;
    progressNote: {
      id: string;
      noteDate: Date;
      status: string;
    };
  }[];
}

export function groupEntriesByDate(entries: CareCoordinationEntryWithDetails[]): TimelineGroup[] {
  const groups: Map<string, TimelineGroup> = new Map();

  entries.forEach((entry) => {
    // Handle both Date objects and ISO string dates from API
    const activityDate = typeof entry.activityDate === 'string'
      ? new Date(entry.activityDate)
      : entry.activityDate;
    const dateKey = activityDate.toISOString().split("T")[0];

    if (!groups.has(dateKey)) {
      groups.set(dateKey, {
        date: dateKey,
        dateFormatted: activityDate.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        entries: [],
      });
    }

    groups.get(dateKey)!.entries.push(entry);
  });

  // Sort entries within each group by time
  groups.forEach((group) => {
    group.entries.sort((a, b) => {
      if (a.activityTime && b.activityTime) {
        return b.activityTime.localeCompare(a.activityTime);
      }
      // Handle both Date objects and ISO string dates from API
      const aTime = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : a.createdAt.getTime();
      const bTime = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : b.createdAt.getTime();
      return bTime - aTime;
    });
  });

  // Sort groups by date (most recent first)
  return Array.from(groups.values()).sort((a, b) => b.date.localeCompare(a.date));
}

// Edit history entry type
export interface EditHistoryEntry {
  editedAt: string;
  editedBy: string;
  editedById: string;
  previousData: Record<string, unknown>;
}

// Create an edit history entry
export function createEditHistoryEntry(
  userId: string,
  userName: string,
  previousData: Record<string, unknown>
): EditHistoryEntry {
  return {
    editedAt: new Date().toISOString(),
    editedBy: userName,
    editedById: userId,
    previousData,
  };
}

// Append to edit history
export function appendEditHistory(
  existingHistory: unknown,
  newEntry: EditHistoryEntry
): EditHistoryEntry[] {
  const history = Array.isArray(existingHistory) ? existingHistory : [];
  return [...history, newEntry];
}
