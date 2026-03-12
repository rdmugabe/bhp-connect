import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, parseISO, subDays, eachDayOfInterval, format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const intakeId = searchParams.get("intakeId");

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

    // Default to last 30 days
    const endDate = endDateStr ? parseISO(endDateStr) : new Date();
    const startDate = startDateStr ? parseISO(startDateStr) : subDays(endDate, 30);
    const reportStart = startOfDay(startDate);
    const reportEnd = endOfDay(endDate);

    // Get all days in the range
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Calculate daily adherence rates
    const dailyRates = await Promise.all(
      days.map(async (day) => {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);

        const [total, given, refused, held, missed] = await Promise.all([
          prisma.medicationSchedule.count({
            where: {
              scheduledDateTime: { gte: dayStart, lte: dayEnd },
              medicationOrder: {
                facilityId,
                status: { not: "DISCONTINUED" },
                ...(intakeId && { intakeId }),
              },
              status: { notIn: ["DISCONTINUED"] },
            },
          }),
          prisma.medicationSchedule.count({
            where: {
              scheduledDateTime: { gte: dayStart, lte: dayEnd },
              medicationOrder: {
                facilityId,
                ...(intakeId && { intakeId }),
              },
              status: "GIVEN",
            },
          }),
          prisma.medicationSchedule.count({
            where: {
              scheduledDateTime: { gte: dayStart, lte: dayEnd },
              medicationOrder: {
                facilityId,
                ...(intakeId && { intakeId }),
              },
              status: "REFUSED",
            },
          }),
          prisma.medicationSchedule.count({
            where: {
              scheduledDateTime: { gte: dayStart, lte: dayEnd },
              medicationOrder: {
                facilityId,
                ...(intakeId && { intakeId }),
              },
              status: "HELD",
            },
          }),
          prisma.medicationSchedule.count({
            where: {
              scheduledDateTime: { gte: dayStart, lte: dayEnd },
              medicationOrder: {
                facilityId,
                ...(intakeId && { intakeId }),
              },
              status: "MISSED",
            },
          }),
        ]);

        return {
          date: format(day, "yyyy-MM-dd"),
          label: format(day, "MMM d"),
          total,
          given,
          refused,
          held,
          missed,
          adherenceRate: total > 0 ? Math.round((given / total) * 100) : 100,
        };
      })
    );

    // Calculate overall stats
    const totals = dailyRates.reduce(
      (acc, day) => ({
        total: acc.total + day.total,
        given: acc.given + day.given,
        refused: acc.refused + day.refused,
        held: acc.held + day.held,
        missed: acc.missed + day.missed,
      }),
      { total: 0, given: 0, refused: 0, held: 0, missed: 0 }
    );

    // Get adherence by patient
    const patientAdherence = await prisma.intake.findMany({
      where: {
        facilityId,
        status: "APPROVED",
        ...(intakeId && { id: intakeId }),
        medicationOrders: {
          some: {
            status: { not: "DISCONTINUED" },
          },
        },
      },
      select: {
        id: true,
        residentName: true,
        medicationOrders: {
          where: {
            status: { not: "DISCONTINUED" },
          },
          select: {
            schedules: {
              where: {
                scheduledDateTime: { gte: reportStart, lte: reportEnd },
                status: { notIn: ["DISCONTINUED", "SCHEDULED"] },
              },
              select: {
                status: true,
              },
            },
          },
        },
      },
    });

    const patientStats = patientAdherence.map((patient) => {
      const schedules = patient.medicationOrders.flatMap((o) => o.schedules);
      const given = schedules.filter((s) => s.status === "GIVEN").length;
      const total = schedules.length;

      return {
        id: patient.id,
        name: patient.residentName,
        totalScheduled: total,
        given,
        adherenceRate: total > 0 ? Math.round((given / total) * 100) : 100,
      };
    });

    // Get adherence by medication
    const medicationAdherence = await prisma.medicationOrder.groupBy({
      by: ["medicationName"],
      where: {
        facilityId,
        status: { not: "DISCONTINUED" },
        ...(intakeId && { intakeId }),
        schedules: {
          some: {
            scheduledDateTime: { gte: reportStart, lte: reportEnd },
          },
        },
      },
      _count: true,
    });

    const medicationStats = await Promise.all(
      medicationAdherence.map(async (med) => {
        const [total, given] = await Promise.all([
          prisma.medicationSchedule.count({
            where: {
              scheduledDateTime: { gte: reportStart, lte: reportEnd },
              status: { notIn: ["DISCONTINUED", "SCHEDULED"] },
              medicationOrder: {
                facilityId,
                medicationName: med.medicationName,
                ...(intakeId && { intakeId }),
              },
            },
          }),
          prisma.medicationSchedule.count({
            where: {
              scheduledDateTime: { gte: reportStart, lte: reportEnd },
              status: "GIVEN",
              medicationOrder: {
                facilityId,
                medicationName: med.medicationName,
                ...(intakeId && { intakeId }),
              },
            },
          }),
        ]);

        return {
          medicationName: med.medicationName,
          totalScheduled: total,
          given,
          adherenceRate: total > 0 ? Math.round((given / total) * 100) : 100,
        };
      })
    );

    return NextResponse.json({
      reportPeriod: {
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
      },
      overall: {
        ...totals,
        adherenceRate: totals.total > 0 ? Math.round((totals.given / totals.total) * 100) : 100,
      },
      dailyRates,
      byPatient: patientStats.sort((a, b) => a.adherenceRate - b.adherenceRate),
      byMedication: medicationStats.sort((a, b) => a.adherenceRate - b.adherenceRate),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get adherence report error:", error);
    return NextResponse.json(
      { error: "Failed to generate adherence report" },
      { status: 500 }
    );
  }
}
