import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subDays, subHours, format } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { getAlertCounts } from "@/lib/emar/alerts";
import { updateScheduleStatuses } from "@/lib/emar/schedule-generator";

// Use consistent timezone for all facilities (Arizona)
const FACILITY_TIMEZONE = "America/Phoenix";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let facilityId: string | undefined;

    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile) {
        return NextResponse.json({ error: "Facility not assigned" }, { status: 400 });
      }

      facilityId = bhrfProfile.facilityId;
    } else if (session.user.role === "BHP") {
      const { searchParams } = new URL(request.url);
      const reqFacilityId = searchParams.get("facilityId");

      if (!reqFacilityId) {
        return NextResponse.json({ error: "Facility ID required" }, { status: 400 });
      }

      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 400 });
      }

      const facility = await prisma.facility.findFirst({
        where: {
          id: reqFacilityId,
          bhpId: bhpProfile.id,
        },
      });

      if (!facility) {
        return NextResponse.json({ error: "Facility not found" }, { status: 404 });
      }

      facilityId = reqFacilityId;
    }

    if (!facilityId) {
      return NextResponse.json({ error: "Facility not found" }, { status: 400 });
    }

    // Update schedule statuses
    await updateScheduleStatuses();

    // Use facility timezone for consistent date calculations
    const now = new Date();
    const zonedNow = toZonedTime(now, FACILITY_TIMEZONE);

    // Get start and end of day in facility timezone
    const zonedStart = new Date(zonedNow);
    zonedStart.setHours(0, 0, 0, 0);
    const zonedEnd = new Date(zonedNow);
    zonedEnd.setHours(23, 59, 59, 999);

    // Convert back to UTC for database queries
    const todayStart = fromZonedTime(zonedStart, FACILITY_TIMEZONE);
    const todayEnd = fromZonedTime(zonedEnd, FACILITY_TIMEZONE);

    // Get facility info
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      select: { name: true },
    });

    // Get active patient count
    const activePatients = await prisma.intake.count({
      where: {
        facilityId,
        status: "APPROVED",
        dischargedAt: null,
      },
    });

    // Get active medication orders count
    const activeOrders = await prisma.medicationOrder.count({
      where: {
        facilityId,
        status: "ACTIVE",
      },
    });

    // Get today's schedule stats
    const [scheduledCount, dueCount, givenCount, missedCount, refusedCount] = await Promise.all([
      prisma.medicationSchedule.count({
        where: {
          scheduledDateTime: { gte: todayStart, lte: todayEnd },
          medicationOrder: { facilityId, status: "ACTIVE" },
          status: "SCHEDULED",
        },
      }),
      prisma.medicationSchedule.count({
        where: {
          scheduledDateTime: { gte: todayStart, lte: todayEnd },
          medicationOrder: { facilityId, status: "ACTIVE" },
          status: "DUE",
        },
      }),
      prisma.medicationSchedule.count({
        where: {
          scheduledDateTime: { gte: todayStart, lte: todayEnd },
          medicationOrder: { facilityId, status: "ACTIVE" },
          status: "GIVEN",
        },
      }),
      prisma.medicationSchedule.count({
        where: {
          scheduledDateTime: { gte: todayStart, lte: todayEnd },
          medicationOrder: { facilityId, status: "ACTIVE" },
          status: "MISSED",
        },
      }),
      prisma.medicationSchedule.count({
        where: {
          scheduledDateTime: { gte: todayStart, lte: todayEnd },
          medicationOrder: { facilityId, status: "ACTIVE" },
          status: "REFUSED",
        },
      }),
    ]);

    // Get PRN count for today
    const prnAdministrations = await prisma.medicationAdministration.count({
      where: {
        administeredAt: { gte: todayStart, lte: todayEnd },
        medicationOrder: {
          facilityId,
          isPRN: true,
        },
      },
    });

    // Get alert counts
    const alertCounts = await getAlertCounts(facilityId);

    // Get 7-day adherence trend (using facility timezone)
    const adherenceTrend = await Promise.all(
      Array.from({ length: 7 }, async (_, i) => {
        const date = subDays(zonedNow, 6 - i);

        // Get start and end of day in facility timezone
        const dayStartZoned = new Date(date);
        dayStartZoned.setHours(0, 0, 0, 0);
        const dayEndZoned = new Date(date);
        dayEndZoned.setHours(23, 59, 59, 999);

        // Convert to UTC for database queries
        const dayStart = fromZonedTime(dayStartZoned, FACILITY_TIMEZONE);
        const dayEnd = fromZonedTime(dayEndZoned, FACILITY_TIMEZONE);

        const [total, given] = await Promise.all([
          prisma.medicationSchedule.count({
            where: {
              scheduledDateTime: { gte: dayStart, lte: dayEnd },
              medicationOrder: { facilityId, status: "ACTIVE" },
              status: { not: "DISCONTINUED" },
            },
          }),
          prisma.medicationSchedule.count({
            where: {
              scheduledDateTime: { gte: dayStart, lte: dayEnd },
              medicationOrder: { facilityId, status: "ACTIVE" },
              status: "GIVEN",
            },
          }),
        ]);

        return {
          date: format(date, "MMM d"),
          total,
          given,
          rate: total > 0 ? Math.round((given / total) * 100) : 100,
        };
      })
    );

    // Get patients with due medications
    const patientsWithDueMeds = await prisma.intake.findMany({
      where: {
        facilityId,
        status: "APPROVED",
        dischargedAt: null,
        medicationOrders: {
          some: {
            status: "ACTIVE",
            schedules: {
              some: {
                status: { in: ["DUE", "SCHEDULED"] },
                windowStartTime: { lte: now },
              },
            },
          },
        },
      },
      select: {
        id: true,
        residentName: true,
        medicationOrders: {
          where: {
            status: "ACTIVE",
            schedules: {
              some: {
                status: { in: ["DUE", "SCHEDULED"] },
                windowStartTime: { lte: now },
              },
            },
          },
          select: {
            id: true,
            medicationName: true,
            schedules: {
              where: {
                status: { in: ["DUE", "SCHEDULED"] },
                windowStartTime: { lte: now },
              },
              take: 5,
              orderBy: { scheduledDateTime: "asc" },
            },
          },
        },
      },
    });

    // Get patients with PRN medications available
    const patientsWithPrnMeds = await prisma.intake.findMany({
      where: {
        facilityId,
        status: "APPROVED",
        dischargedAt: null,
        medicationOrders: {
          some: {
            status: "ACTIVE",
            isPRN: true,
          },
        },
      },
      select: {
        id: true,
        residentName: true,
        medicationOrders: {
          where: {
            status: "ACTIVE",
            isPRN: true,
          },
          select: {
            id: true,
            medicationName: true,
            prnReason: true,
            prnMinIntervalHours: true,
            prnMaxDailyDoses: true,
            administrations: {
              where: {
                status: "GIVEN",
                administeredAt: { gte: todayStart },
              },
              orderBy: { administeredAt: "desc" },
              take: 1,
              select: {
                administeredAt: true,
              },
            },
          },
        },
      },
    });

    // Process PRN medications to determine availability
    const prnMedicationsAvailable = patientsWithPrnMeds.map((patient) => {
      const availableMeds = patient.medicationOrders.map((order) => {
        let canAdminister = true;
        let reason: string | null = null;

        // Check min interval
        if (order.prnMinIntervalHours && order.administrations.length > 0) {
          const lastAdmin = new Date(order.administrations[0].administeredAt);
          const minTime = subHours(now, order.prnMinIntervalHours);
          if (lastAdmin > minTime) {
            canAdminister = false;
            const nextAvailable = new Date(lastAdmin.getTime() + order.prnMinIntervalHours * 60 * 60 * 1000);
            reason = `Available at ${format(nextAvailable, "h:mm a")}`;
          }
        }

        // Check max daily doses
        if (canAdminister && order.prnMaxDailyDoses) {
          // Need to count all today's administrations
          const todayCount = order.administrations.length;
          if (todayCount >= order.prnMaxDailyDoses) {
            canAdminister = false;
            reason = `Max daily doses (${order.prnMaxDailyDoses}) reached`;
          }
        }

        return {
          id: order.id,
          medicationName: order.medicationName,
          prnReason: order.prnReason,
          canAdminister,
          reason,
        };
      });

      return {
        id: patient.id,
        residentName: patient.residentName,
        prnMedications: availableMeds,
      };
    }).filter((p) => p.prnMedications.length > 0);

    return NextResponse.json({
      facilityName: facility?.name,
      summary: {
        activePatients,
        activeOrders,
        alerts: alertCounts,
      },
      today: {
        scheduled: scheduledCount,
        due: dueCount,
        given: givenCount,
        missed: missedCount,
        refused: refusedCount,
        prnGiven: prnAdministrations,
        total: scheduledCount + dueCount + givenCount + missedCount + refusedCount,
        completionRate:
          scheduledCount + dueCount + givenCount + missedCount + refusedCount > 0
            ? Math.round(
                (givenCount /
                  (scheduledCount + dueCount + givenCount + missedCount + refusedCount)) *
                  100
              )
            : 100,
      },
      adherenceTrend,
      patientsWithDueMeds,
      prnMedicationsAvailable,
    });
  } catch (error) {
    console.error("Get dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
