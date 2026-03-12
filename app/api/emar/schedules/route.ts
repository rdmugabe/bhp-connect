import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, addDays, parseISO } from "date-fns";

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

    let queryFacilityId: string | undefined;

    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile) {
        return NextResponse.json({ schedules: [] });
      }

      queryFacilityId = bhrfProfile.facilityId;
    } else if (session.user.role === "BHP") {
      const facilityId = searchParams.get("facilityId");

      if (!facilityId) {
        return NextResponse.json({ schedules: [] });
      }

      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile) {
        return NextResponse.json({ schedules: [] });
      }

      // Verify the facility belongs to this BHP
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

    // Parse date or use today
    const targetDate = dateStr ? parseISO(dateStr) : new Date();
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    const schedules = await prisma.medicationSchedule.findMany({
      where: {
        scheduledDateTime: {
          gte: dayStart,
          lte: dayEnd,
        },
        medicationOrder: {
          ...(queryFacilityId && { facilityId: queryFacilityId }),
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
