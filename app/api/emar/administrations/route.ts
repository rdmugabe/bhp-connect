import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, parseISO, subDays } from "date-fns";

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

    // Build date filter
    let dateFilter: { gte?: Date; lte?: Date } = {};

    if (dateStr) {
      const targetDate = parseISO(dateStr);
      dateFilter = {
        gte: startOfDay(targetDate),
        lte: endOfDay(targetDate),
      };
    } else if (startDateStr && endDateStr) {
      dateFilter = {
        gte: startOfDay(parseISO(startDateStr)),
        lte: endOfDay(parseISO(endDateStr)),
      };
    } else {
      // Default to last 7 days
      dateFilter = {
        gte: startOfDay(subDays(new Date(), 7)),
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
          prnFollowupAt: { not: null },
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
