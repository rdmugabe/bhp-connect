import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFacilityScope } from "@/lib/facility-scope";
import { parseISO } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

// Use consistent timezone for all facilities (Arizona)
const FACILITY_TIMEZONE = "America/Phoenix";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    const intakeId = searchParams.get("intakeId");
    const status = searchParams.get("status");

    // Always derive facility scope from the caller — never leave it unset.
    const scope = await getFacilityScope(session, searchParams.get("facilityId"));
    if (!scope.ok) {
      return NextResponse.json({ error: scope.error }, { status: scope.status });
    }

    // Parse date or use today, with timezone handling
    // The date string (e.g., "2026-03-14") represents a date in the facility timezone
    let dayStart: Date;
    let dayEnd: Date;

    if (dateStr) {
      // Parse date string as facility timezone date (not UTC)
      const [year, month, day] = dateStr.split("-").map(Number);
      // Create start of day in facility timezone
      const startInFacilityTz = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endInFacilityTz = new Date(year, month - 1, day, 23, 59, 59, 999);
      // Convert to UTC for database queries
      dayStart = fromZonedTime(startInFacilityTz, FACILITY_TIMEZONE);
      dayEnd = fromZonedTime(endInFacilityTz, FACILITY_TIMEZONE);
    } else {
      // Use current time in facility timezone
      const now = new Date();
      const zonedNow = toZonedTime(now, FACILITY_TIMEZONE);
      const zonedStart = new Date(zonedNow);
      zonedStart.setHours(0, 0, 0, 0);
      const zonedEnd = new Date(zonedNow);
      zonedEnd.setHours(23, 59, 59, 999);
      dayStart = fromZonedTime(zonedStart, FACILITY_TIMEZONE);
      dayEnd = fromZonedTime(zonedEnd, FACILITY_TIMEZONE);
    }

    const schedules = await prisma.medicationSchedule.findMany({
      where: {
        scheduledDateTime: {
          gte: dayStart,
          lte: dayEnd,
        },
        medicationOrder: {
          ...scope.where,
          ...(intakeId && { intakeId }),
          status: "ACTIVE",
        },
        ...(status && {
          status: status as "SCHEDULED" | "DUE" | "GIVEN" | "REFUSED" | "HELD" | "MISSED",
        }),
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
        administration: true,
      },
      orderBy: {
        scheduledDateTime: "asc",
      },
    });

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error("Get schedules error:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}
