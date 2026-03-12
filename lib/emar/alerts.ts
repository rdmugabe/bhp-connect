import { AlertType, AlertSeverity, AdministrationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { addMinutes, subMinutes, differenceInMinutes } from "date-fns";

interface CreateAlertParams {
  facilityId: string;
  intakeId?: string;
  medicationOrderId?: string;
  scheduleId?: string;
  alertType: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  expiresAt?: Date;
}

/**
 * Create a new medication alert
 */
export async function createAlert(params: CreateAlertParams): Promise<void> {
  const {
    facilityId,
    intakeId,
    medicationOrderId,
    scheduleId,
    alertType,
    severity,
    title,
    message,
    expiresAt,
  } = params;

  // Check if a similar active alert already exists
  const existingActiveAlert = await prisma.medicationAlert.findFirst({
    where: {
      facilityId,
      intakeId: intakeId || undefined,
      medicationOrderId: medicationOrderId || undefined,
      scheduleId: scheduleId || undefined,
      alertType,
      isActive: true,
    },
  });

  if (existingActiveAlert) {
    // Update existing alert instead of creating duplicate
    await prisma.medicationAlert.update({
      where: { id: existingActiveAlert.id },
      data: {
        severity,
        title,
        message,
        triggeredAt: new Date(),
        expiresAt,
      },
    });
    return;
  }

  // Also check for recently acknowledged alerts (within last 2 hours) to prevent
  // recreating alerts that were just acknowledged but underlying issue persists
  if (scheduleId) {
    const recentlyAcknowledgedAlert = await prisma.medicationAlert.findFirst({
      where: {
        scheduleId,
        alertType,
        isActive: false,
        acknowledgedAt: {
          gte: subMinutes(new Date(), 120), // Within last 2 hours
        },
      },
    });

    if (recentlyAcknowledgedAlert) {
      // Don't recreate the alert - it was recently acknowledged
      return;
    }
  }

  await prisma.medicationAlert.create({
    data: {
      facilityId,
      intakeId,
      medicationOrderId,
      scheduleId,
      alertType,
      severity,
      title,
      message,
      expiresAt,
    },
  });
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(
  alertId: string,
  acknowledgedById: string,
  acknowledgedBy: string
): Promise<void> {
  await prisma.medicationAlert.update({
    where: { id: alertId },
    data: {
      isActive: false,
      acknowledgedAt: new Date(),
      acknowledgedById,
      acknowledgedBy,
    },
  });
}

/**
 * Check for and create medication due/overdue alerts
 */
export async function checkMedicationAlerts(facilityId: string): Promise<{
  dueAlerts: number;
  overdueAlerts: number;
  missedAlerts: number;
}> {
  const now = new Date();
  let dueAlerts = 0;
  let overdueAlerts = 0;
  let missedAlerts = 0;

  // Get schedules that are due (within admin window)
  const dueSchedules = await prisma.medicationSchedule.findMany({
    where: {
      status: "DUE",
      medicationOrder: {
        facilityId,
        status: "ACTIVE",
      },
    },
    include: {
      medicationOrder: {
        include: {
          intake: {
            select: {
              id: true,
              residentName: true,
            },
          },
        },
      },
    },
  });

  for (const schedule of dueSchedules) {
    const minutesOverdue = differenceInMinutes(now, schedule.scheduledDateTime);

    // If more than 15 minutes past scheduled time, it's overdue
    if (minutesOverdue > 15) {
      await createAlert({
        facilityId,
        intakeId: schedule.medicationOrder.intakeId,
        medicationOrderId: schedule.medicationOrderId,
        scheduleId: schedule.id,
        alertType: "MEDICATION_OVERDUE",
        severity: "WARNING",
        title: "Medication Overdue",
        message: `${schedule.medicationOrder.medicationName} for ${schedule.medicationOrder.intake.residentName} is ${minutesOverdue} minutes overdue`,
        expiresAt: schedule.windowEndTime,
      });
      overdueAlerts++;
    } else {
      await createAlert({
        facilityId,
        intakeId: schedule.medicationOrder.intakeId,
        medicationOrderId: schedule.medicationOrderId,
        scheduleId: schedule.id,
        alertType: "MEDICATION_DUE",
        severity: "INFO",
        title: "Medication Due",
        message: `${schedule.medicationOrder.medicationName} for ${schedule.medicationOrder.intake.residentName} is due now`,
        expiresAt: schedule.windowEndTime,
      });
      dueAlerts++;
    }
  }

  // Get missed doses and create alerts
  const missedSchedules = await prisma.medicationSchedule.findMany({
    where: {
      status: "MISSED",
      medicationOrder: {
        facilityId,
        status: "ACTIVE",
      },
      // Only check schedules from the last 24 hours
      scheduledDateTime: {
        gte: subMinutes(now, 24 * 60),
      },
    },
    include: {
      medicationOrder: {
        include: {
          intake: {
            select: {
              id: true,
              residentName: true,
            },
          },
        },
      },
    },
  });

  for (const schedule of missedSchedules) {
    // Check if there's already an active missed dose alert
    const existingAlert = await prisma.medicationAlert.findFirst({
      where: {
        scheduleId: schedule.id,
        alertType: "MISSED_DOSE",
        isActive: true,
      },
    });

    if (!existingAlert) {
      await createAlert({
        facilityId,
        intakeId: schedule.medicationOrder.intakeId,
        medicationOrderId: schedule.medicationOrderId,
        scheduleId: schedule.id,
        alertType: "MISSED_DOSE",
        severity: "CRITICAL",
        title: "Missed Dose",
        message: `${schedule.medicationOrder.medicationName} for ${schedule.medicationOrder.intake.residentName} was missed`,
      });
      missedAlerts++;
    }
  }

  return { dueAlerts, overdueAlerts, missedAlerts };
}

/**
 * Check for PRN follow-up alerts
 */
export async function checkPRNFollowupAlerts(facilityId: string): Promise<number> {
  const now = new Date();
  let alertsCreated = 0;

  // Find PRN administrations that need follow-up
  const prnAdmins = await prisma.medicationAdministration.findMany({
    where: {
      prnFollowupAt: { lte: now },
      prnFollowupNotes: null,
      status: "GIVEN",
      medicationOrder: {
        facilityId,
        isPRN: true,
        status: "ACTIVE",
      },
    },
    include: {
      medicationOrder: {
        include: {
          intake: {
            select: {
              id: true,
              residentName: true,
            },
          },
        },
      },
    },
  });

  for (const admin of prnAdmins) {
    // Check if there's already an active follow-up alert
    const existingAlert = await prisma.medicationAlert.findFirst({
      where: {
        medicationOrderId: admin.medicationOrderId,
        alertType: "PRN_FOLLOWUP_DUE",
        isActive: true,
        // Created after this administration
        triggeredAt: { gte: admin.administeredAt },
      },
    });

    if (existingAlert) {
      continue;
    }

    // Also check for recently acknowledged PRN follow-up alerts
    const recentlyAcknowledgedAlert = await prisma.medicationAlert.findFirst({
      where: {
        medicationOrderId: admin.medicationOrderId,
        alertType: "PRN_FOLLOWUP_DUE",
        isActive: false,
        acknowledgedAt: {
          gte: subMinutes(new Date(), 120), // Within last 2 hours
        },
        triggeredAt: { gte: admin.administeredAt },
      },
    });

    if (!recentlyAcknowledgedAlert) {
      await createAlert({
        facilityId,
        intakeId: admin.medicationOrder.intakeId,
        medicationOrderId: admin.medicationOrderId,
        alertType: "PRN_FOLLOWUP_DUE",
        severity: "WARNING",
        title: "PRN Follow-up Due",
        message: `Document effectiveness of ${admin.medicationOrder.medicationName} for ${admin.medicationOrder.intake.residentName}`,
      });
      alertsCreated++;
    }
  }

  return alertsCreated;
}

/**
 * Check for allergy warnings when creating/updating medication orders
 */
export async function checkAllergyWarning(
  intakeId: string,
  medicationName: string
): Promise<{ hasWarning: boolean; allergyInfo: string | null }> {
  const intake = await prisma.intake.findUnique({
    where: { id: intakeId },
    select: {
      allergies: true,
      facilityId: true,
      residentName: true,
    },
  });

  if (!intake || !intake.allergies) {
    return { hasWarning: false, allergyInfo: null };
  }

  const allergies = intake.allergies.toLowerCase();
  const medName = medicationName.toLowerCase();

  // Simple allergy check - in production, this would use a drug database
  const allergyWords = allergies.split(/[,;]\s*/);

  for (const allergy of allergyWords) {
    const allergyTrimmed = allergy.trim();
    if (allergyTrimmed && medName.includes(allergyTrimmed)) {
      return {
        hasWarning: true,
        allergyInfo: `Patient has documented allergy to "${allergyTrimmed}"`,
      };
    }
  }

  return { hasWarning: false, allergyInfo: null };
}

/**
 * Check for duplicate medication orders
 */
export async function checkDuplicateMedication(
  intakeId: string,
  medicationName: string,
  excludeOrderId?: string
): Promise<{ isDuplicate: boolean; existingOrders: string[] }> {
  const existingOrders = await prisma.medicationOrder.findMany({
    where: {
      intakeId,
      status: "ACTIVE",
      ...(excludeOrderId && { id: { not: excludeOrderId } }),
    },
    select: {
      id: true,
      medicationName: true,
      genericName: true,
    },
  });

  const medNameLower = medicationName.toLowerCase();
  const duplicates: string[] = [];

  for (const order of existingOrders) {
    const orderNameLower = order.medicationName.toLowerCase();
    const genericLower = order.genericName?.toLowerCase() || "";

    // Check for exact or partial match
    if (
      orderNameLower === medNameLower ||
      genericLower === medNameLower ||
      orderNameLower.includes(medNameLower) ||
      medNameLower.includes(orderNameLower)
    ) {
      duplicates.push(order.medicationName);
    }
  }

  return {
    isDuplicate: duplicates.length > 0,
    existingOrders: duplicates,
  };
}

/**
 * Get active alerts for a facility
 */
export async function getActiveAlerts(options: {
  facilityId: string;
  intakeId?: string;
  severity?: AlertSeverity;
  limit?: number;
}) {
  const { facilityId, intakeId, severity, limit = 50 } = options;

  return prisma.medicationAlert.findMany({
    where: {
      facilityId,
      isActive: true,
      ...(intakeId && { intakeId }),
      ...(severity && { severity }),
    },
    include: {
      intake: {
        select: {
          residentName: true,
        },
      },
    },
    orderBy: [
      { severity: "desc" }, // CRITICAL first
      { triggeredAt: "desc" },
    ],
    take: limit,
  });
}

/**
 * Expire old alerts
 */
export async function expireAlerts(): Promise<number> {
  const now = new Date();

  const result = await prisma.medicationAlert.updateMany({
    where: {
      isActive: true,
      expiresAt: { lt: now },
    },
    data: {
      isActive: false,
    },
  });

  return result.count;
}

/**
 * Deactivate alerts related to a schedule when administered
 */
export async function deactivateScheduleAlerts(scheduleId: string): Promise<void> {
  await prisma.medicationAlert.updateMany({
    where: {
      scheduleId,
      isActive: true,
    },
    data: {
      isActive: false,
      acknowledgedAt: new Date(),
    },
  });
}

/**
 * Get alert counts by severity for dashboard
 */
export async function getAlertCounts(facilityId: string): Promise<{
  critical: number;
  warning: number;
  info: number;
  total: number;
}> {
  const alerts = await prisma.medicationAlert.groupBy({
    by: ["severity"],
    where: {
      facilityId,
      isActive: true,
    },
    _count: true,
  });

  const counts = {
    critical: 0,
    warning: 0,
    info: 0,
    total: 0,
  };

  for (const alert of alerts) {
    const count = alert._count;
    switch (alert.severity) {
      case "CRITICAL":
        counts.critical = count;
        break;
      case "WARNING":
        counts.warning = count;
        break;
      case "INFO":
        counts.info = count;
        break;
    }
    counts.total += count;
  }

  return counts;
}
