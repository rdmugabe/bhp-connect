import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, parseISO, setHours, addHours, format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    const shift = searchParams.get("shift") || "ALL"; // DAY, NIGHT, ALL
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

    const targetDate = dateStr ? parseISO(dateStr) : new Date();

    // Define shift times
    let shiftStart: Date;
    let shiftEnd: Date;

    if (shift === "DAY") {
      shiftStart = setHours(startOfDay(targetDate), 7); // 7 AM
      shiftEnd = setHours(startOfDay(targetDate), 19); // 7 PM
    } else if (shift === "NIGHT") {
      shiftStart = setHours(startOfDay(targetDate), 19); // 7 PM
      shiftEnd = addHours(setHours(startOfDay(targetDate), 7), 24); // 7 AM next day
    } else {
      shiftStart = startOfDay(targetDate);
      shiftEnd = endOfDay(targetDate);
    }

    // Get all schedules for the shift
    const schedules = await prisma.medicationSchedule.findMany({
      where: {
        scheduledDateTime: {
          gte: shiftStart,
          lte: shiftEnd,
        },
        medicationOrder: {
          facilityId,
          status: "ACTIVE",
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
              },
            },
          },
        },
        administration: true,
      },
      orderBy: {
        scheduledDateTime: "asc",
      },
    });

    // Group schedules by hour
    const byHour: Record<string, typeof schedules> = {};

    for (const schedule of schedules) {
      const hour = format(schedule.scheduledDateTime, "HH:00");
      if (!byHour[hour]) {
        byHour[hour] = [];
      }
      byHour[hour].push(schedule);
    }

    // Group by patient
    const byPatient: Record<string, {
      patient: { id: string; residentName: string; dateOfBirth: Date };
      schedules: typeof schedules;
    }> = {};

    for (const schedule of schedules) {
      const patientId = schedule.medicationOrder.intake.id;
      if (!byPatient[patientId]) {
        byPatient[patientId] = {
          patient: schedule.medicationOrder.intake,
          schedules: [],
        };
      }
      byPatient[patientId].schedules.push(schedule);
    }

    // Generate timeline hours
    const timelineHours: string[] = [];
    let currentHour = new Date(shiftStart);

    while (currentHour <= shiftEnd) {
      timelineHours.push(format(currentHour, "HH:00"));
      currentHour = addHours(currentHour, 1);
    }

    return NextResponse.json({
      shift,
      shiftStart: shiftStart.toISOString(),
      shiftEnd: shiftEnd.toISOString(),
      schedules,
      byHour,
      byPatient: Object.values(byPatient),
      timelineHours,
      stats: {
        total: schedules.length,
        given: schedules.filter((s) => s.status === "GIVEN").length,
        due: schedules.filter((s) => s.status === "DUE").length,
        scheduled: schedules.filter((s) => s.status === "SCHEDULED").length,
        missed: schedules.filter((s) => s.status === "MISSED").length,
        refused: schedules.filter((s) => s.status === "REFUSED").length,
      },
    });
  } catch (error) {
    console.error("Get timeline error:", error);
    return NextResponse.json(
      { error: "Failed to fetch timeline data" },
      { status: 500 }
    );
  }
}
