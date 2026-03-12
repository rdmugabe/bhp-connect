import { MedicationFrequency, AdministrationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { addDays, startOfDay, setHours, setMinutes, addMinutes, subMinutes, format, parseISO, isValid } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

const ARIZONA_TZ = "America/Phoenix";

// Default times for each frequency (Arizona time)
const DEFAULT_TIMES: Record<MedicationFrequency, string[]> = {
  ONCE: ["09:00"],
  DAILY: ["09:00"],
  BID: ["09:00", "21:00"],
  TID: ["08:00", "14:00", "20:00"],
  QID: ["08:00", "12:00", "16:00", "20:00"],
  Q4H: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"],
  Q6H: ["06:00", "12:00", "18:00", "00:00"],
  Q8H: ["06:00", "14:00", "22:00"],
  Q12H: ["09:00", "21:00"],
  QHS: ["21:00"], // At bedtime
  QAM: ["08:00"], // In the morning
  PRN: [], // No scheduled times for PRN
  WEEKLY: ["09:00"],
  CUSTOM: [], // User-defined times
};

// Administration window in minutes (±30 minutes from scheduled time)
const ADMIN_WINDOW_MINUTES = 30;

interface ScheduleGeneratorParams {
  medicationOrderId: string;
  startDate: Date;
  endDate?: Date | null;
  frequency: MedicationFrequency;
  scheduleTimes?: string[];
  daysToGenerate?: number;
}

/**
 * Parse a time string (HH:mm) and set it on a given date
 */
function setTimeOnDate(date: Date, timeString: string): Date {
  const [hours, minutes] = timeString.split(":").map(Number);
  let result = setHours(date, hours);
  result = setMinutes(result, minutes);
  return result;
}

/**
 * Convert a local Arizona time to UTC for storage
 */
function arizonaToUTC(date: Date): Date {
  return fromZonedTime(date, ARIZONA_TZ);
}

/**
 * Convert UTC to Arizona local time for display
 */
export function utcToArizona(date: Date): Date {
  return toZonedTime(date, ARIZONA_TZ);
}

/**
 * Get the scheduled times for a frequency
 */
export function getScheduleTimes(
  frequency: MedicationFrequency,
  customTimes?: string[]
): string[] {
  if (frequency === "CUSTOM" && customTimes && customTimes.length > 0) {
    return customTimes;
  }
  if (frequency === "PRN") {
    return [];
  }
  return DEFAULT_TIMES[frequency] || DEFAULT_TIMES.DAILY;
}

/**
 * Generate medication schedules for a given medication order
 */
export async function generateSchedules({
  medicationOrderId,
  startDate,
  endDate,
  frequency,
  scheduleTimes,
  daysToGenerate = 7,
}: ScheduleGeneratorParams): Promise<{ created: number; skipped: number }> {
  // PRN medications don't have scheduled doses
  if (frequency === "PRN") {
    return { created: 0, skipped: 0 };
  }

  const times = getScheduleTimes(frequency, scheduleTimes);
  if (times.length === 0) {
    return { created: 0, skipped: 0 };
  }

  // Calculate the end date for schedule generation
  const scheduleEndDate = endDate
    ? new Date(Math.min(endDate.getTime(), addDays(new Date(), daysToGenerate).getTime()))
    : addDays(new Date(), daysToGenerate);

  const schedulesToCreate: {
    medicationOrderId: string;
    scheduledDate: Date;
    scheduledTime: string;
    scheduledDateTime: Date;
    status: AdministrationStatus;
    windowStartTime: Date;
    windowEndTime: Date;
  }[] = [];

  let currentDate = startOfDay(startDate);
  let created = 0;
  let skipped = 0;

  // For WEEKLY, we only generate on the same day of week as start date
  const weeklyDayOfWeek = frequency === "WEEKLY" ? startDate.getDay() : null;

  while (currentDate <= scheduleEndDate) {
    // Skip if WEEKLY and not the right day
    if (frequency === "WEEKLY" && currentDate.getDay() !== weeklyDayOfWeek) {
      currentDate = addDays(currentDate, 1);
      continue;
    }

    for (const time of times) {
      // Create scheduled datetime in Arizona time
      const scheduledDateTimeArizona = setTimeOnDate(currentDate, time);

      // Skip if the scheduled time is before the start date
      if (scheduledDateTimeArizona < startDate) {
        skipped++;
        continue;
      }

      // Skip if past the end date
      if (endDate && scheduledDateTimeArizona > endDate) {
        skipped++;
        continue;
      }

      // Convert to UTC for storage
      const scheduledDateTimeUTC = arizonaToUTC(scheduledDateTimeArizona);
      const windowStartUTC = arizonaToUTC(subMinutes(scheduledDateTimeArizona, ADMIN_WINDOW_MINUTES));
      const windowEndUTC = arizonaToUTC(addMinutes(scheduledDateTimeArizona, ADMIN_WINDOW_MINUTES));

      schedulesToCreate.push({
        medicationOrderId,
        scheduledDate: startOfDay(currentDate),
        scheduledTime: time,
        scheduledDateTime: scheduledDateTimeUTC,
        status: "SCHEDULED",
        windowStartTime: windowStartUTC,
        windowEndTime: windowEndUTC,
      });
      created++;
    }

    // Move to next day (or next week for WEEKLY)
    currentDate = frequency === "WEEKLY" ? addDays(currentDate, 7) : addDays(currentDate, 1);
  }

  // Check for existing schedules to avoid duplicates
  const existingSchedules = await prisma.medicationSchedule.findMany({
    where: {
      medicationOrderId,
      scheduledDateTime: {
        in: schedulesToCreate.map((s) => s.scheduledDateTime),
      },
    },
    select: {
      scheduledDateTime: true,
    },
  });

  const existingTimes = new Set(
    existingSchedules.map((s) => s.scheduledDateTime.toISOString())
  );

  const newSchedules = schedulesToCreate.filter(
    (s) => !existingTimes.has(s.scheduledDateTime.toISOString())
  );

  if (newSchedules.length > 0) {
    await prisma.medicationSchedule.createMany({
      data: newSchedules,
    });
  }

  return {
    created: newSchedules.length,
    skipped: created - newSchedules.length + skipped,
  };
}

/**
 * Update schedule statuses based on current time
 * - SCHEDULED -> DUE when entering admin window
 * - DUE -> MISSED when past admin window without administration
 */
export async function updateScheduleStatuses(): Promise<{
  markedDue: number;
  markedMissed: number;
}> {
  const now = new Date();

  // Mark schedules as DUE if we're in the administration window
  const markedDue = await prisma.medicationSchedule.updateMany({
    where: {
      status: "SCHEDULED",
      windowStartTime: { lte: now },
      windowEndTime: { gte: now },
    },
    data: {
      status: "DUE",
    },
  });

  // Mark schedules as MISSED if we're past the administration window
  const markedMissed = await prisma.medicationSchedule.updateMany({
    where: {
      status: { in: ["SCHEDULED", "DUE"] },
      windowEndTime: { lt: now },
      administrationId: null,
    },
    data: {
      status: "MISSED",
    },
  });

  return {
    markedDue: markedDue.count,
    markedMissed: markedMissed.count,
  };
}

/**
 * Get schedules due for a specific facility or patient
 */
export async function getDueSchedules(options: {
  facilityId?: string;
  intakeId?: string;
  includeUpcoming?: boolean;
  hoursAhead?: number;
}) {
  const {
    facilityId,
    intakeId,
    includeUpcoming = false,
    hoursAhead = 2,
  } = options;

  const now = new Date();
  const upcoming = includeUpcoming
    ? addMinutes(now, hoursAhead * 60)
    : now;

  return prisma.medicationSchedule.findMany({
    where: {
      status: { in: ["SCHEDULED", "DUE"] },
      windowStartTime: { lte: upcoming },
      medicationOrder: {
        status: "ACTIVE",
        ...(facilityId && { facilityId }),
        ...(intakeId && { intakeId }),
      },
    },
    include: {
      medicationOrder: {
        include: {
          intake: {
            select: {
              id: true,
              residentName: true,
              dateOfBirth: true,
              allergies: true,
            },
          },
        },
      },
    },
    orderBy: {
      scheduledDateTime: "asc",
    },
  });
}

/**
 * Delete future schedules for a medication order
 * Used when discontinuing or modifying a medication order
 */
export async function deleteFutureSchedules(
  medicationOrderId: string
): Promise<number> {
  const now = new Date();

  const result = await prisma.medicationSchedule.deleteMany({
    where: {
      medicationOrderId,
      scheduledDateTime: { gte: now },
      status: { in: ["SCHEDULED", "DUE"] },
      administrationId: null,
    },
  });

  return result.count;
}

/**
 * Regenerate schedules for a medication order
 */
export async function regenerateSchedules(
  medicationOrderId: string,
  daysAhead: number = 7
): Promise<{ deleted: number; created: number; skipped: number }> {
  // Get the medication order
  const order = await prisma.medicationOrder.findUnique({
    where: { id: medicationOrderId },
  });

  if (!order || order.status !== "ACTIVE") {
    return { deleted: 0, created: 0, skipped: 0 };
  }

  // Delete existing future schedules
  const deleted = await deleteFutureSchedules(medicationOrderId);

  // Generate new schedules starting from now
  const { created, skipped } = await generateSchedules({
    medicationOrderId,
    startDate: new Date(),
    endDate: order.endDate,
    frequency: order.frequency,
    scheduleTimes: order.scheduleTimes,
    daysToGenerate: daysAhead,
  });

  return { deleted, created, skipped };
}

/**
 * Format schedule time for display
 */
export function formatScheduleTime(dateTime: Date): string {
  const arizonaTime = utcToArizona(dateTime);
  return format(arizonaTime, "h:mm a");
}

/**
 * Format schedule date for display
 */
export function formatScheduleDate(dateTime: Date): string {
  const arizonaTime = utcToArizona(dateTime);
  return format(arizonaTime, "MMM d, yyyy");
}

/**
 * Get friendly frequency label
 */
export function getFrequencyLabel(frequency: MedicationFrequency): string {
  const labels: Record<MedicationFrequency, string> = {
    ONCE: "Once",
    DAILY: "Once daily",
    BID: "Twice daily",
    TID: "Three times daily",
    QID: "Four times daily",
    Q4H: "Every 4 hours",
    Q6H: "Every 6 hours",
    Q8H: "Every 8 hours",
    Q12H: "Every 12 hours",
    QHS: "At bedtime",
    QAM: "In the morning",
    PRN: "As needed",
    WEEKLY: "Once weekly",
    CUSTOM: "Custom schedule",
  };
  return labels[frequency] || frequency;
}
