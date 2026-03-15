import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseISO, subDays } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

// Use consistent timezone for all facilities (Arizona)
const FACILITY_TIMEZONE = "America/Phoenix";

// Helper to get start of day in facility timezone
function getStartOfDayUTC(date: Date): Date {
  const zonedDate = toZonedTime(date, FACILITY_TIMEZONE);
  zonedDate.setHours(0, 0, 0, 0);
  return fromZonedTime(zonedDate, FACILITY_TIMEZONE);
}

// Helper to get end of day in facility timezone
function getEndOfDayUTC(date: Date): Date {
  const zonedDate = toZonedTime(date, FACILITY_TIMEZONE);
  zonedDate.setHours(23, 59, 59, 999);
  return fromZonedTime(zonedDate, FACILITY_TIMEZONE);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const intakeId = searchParams.get("intakeId");
    const medicationOrderId = searchParams.get("medicationOrderId");
    const dateStr = searchParams.get("date");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const status = searchParams.get("status");
    const needsPRNFollowup = searchParams.get("needsPRNFollowup") === "true";
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    let queryFacilityId: string | undefined;

    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile) {
        return NextResponse.json({ administrations: [] });
      }

      queryFacilityId = bhrfProfile.facilityId;
    } else if (session.user.role === "BHP") {
      const facilityId = searchParams.get("facilityId");

      if (!facilityId) {
        return NextResponse.json({ administrations: [] });
      }

      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile) {
        return NextResponse.json({ administrations: [] });
      }

      const facility = await prisma.facility.findFirst({
        where: {
          id: facilityId,
          bhpId: bhpProfile.id,
        },
      });

      if (!facility) {
        return NextResponse.json({ error: "Facility not found" }, { status: 404 });
      }

      queryFacilityId = facilityId;
    }

    // Build date filter with timezone handling
    let dateFilter: { gte?: Date; lte?: Date } = {};
    const now = new Date();

    if (needsPRNFollowup) {
      // For PRN follow-up queries, look back further (30 days)
      dateFilter = {
        gte: getStartOfDayUTC(subDays(now, 30)),
      };
    } else if (dateStr) {
      const targetDate = parseISO(dateStr);
      dateFilter = {
        gte: getStartOfDayUTC(targetDate),
        lte: getEndOfDayUTC(targetDate),
      };
    } else if (startDateStr && endDateStr) {
      dateFilter = {
        gte: getStartOfDayUTC(parseISO(startDateStr)),
        lte: getEndOfDayUTC(parseISO(endDateStr)),
      };
    } else {
      // Default to last 7 days
      dateFilter = {
        gte: getStartOfDayUTC(subDays(now, 7)),
      };
    }

    const administrations = await prisma.medicationAdministration.findMany({
      where: {
        administeredAt: dateFilter,
        medicationOrder: {
          ...(queryFacilityId && { facilityId: queryFacilityId }),
          ...(intakeId && { intakeId }),
          // Only include PRN medications if needsPRNFollowup is requested
          ...(needsPRNFollowup && { isPRN: true }),
        },
        ...(medicationOrderId && { medicationOrderId }),
        ...(status && { status: status as "GIVEN" | "REFUSED" | "HELD" | "MISSED" }),
        // Filter for administrations that need PRN follow-up
        ...(needsPRNFollowup && {
          status: "GIVEN",
          prnFollowupAt: { not: null, lte: new Date() },
          prnFollowupNotes: null,
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
              },
            },
          },
        },
      },
      orderBy: {
        administeredAt: "desc",
      },
      take: limit,
    });

    return NextResponse.json({ administrations });
  } catch (error) {
    console.error("Get administrations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch administrations" },
      { status: 500 }
    );
  }
}
