import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDueSchedules, updateScheduleStatuses } from "@/lib/emar/schedule-generator";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const intakeId = searchParams.get("intakeId");
    const includeUpcoming = searchParams.get("includeUpcoming") === "true";
    const hoursAhead = parseInt(searchParams.get("hoursAhead") || "2", 10);

    let facilityId: string | undefined;

    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile) {
        return NextResponse.json({ schedules: [] });
      }

      facilityId = bhrfProfile.facilityId;
    } else if (session.user.role === "BHP") {
      // BHP needs to specify a facility
      facilityId = searchParams.get("facilityId") || undefined;

      if (facilityId) {
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
      }
    }

    // First, update schedule statuses
    await updateScheduleStatuses();

    // Get due schedules
    const schedules = await getDueSchedules({
      facilityId,
      intakeId: intakeId || undefined,
      includeUpcoming,
      hoursAhead,
    });

    // Group by patient for easier display
    const byPatient = schedules.reduce((acc, schedule) => {
      const patientId = schedule.medicationOrder.intake.id;
      if (!acc[patientId]) {
        acc[patientId] = {
          patient: schedule.medicationOrder.intake,
          schedules: [],
        };
      }
      acc[patientId].schedules.push(schedule);
      return acc;
    }, {} as Record<string, { patient: typeof schedules[0]["medicationOrder"]["intake"]; schedules: typeof schedules }>);

    return NextResponse.json({
      schedules,
      byPatient: Object.values(byPatient),
      total: schedules.length,
    });
  } catch (error) {
    console.error("Get due schedules error:", error);
    return NextResponse.json(
      { error: "Failed to fetch due schedules" },
      { status: 500 }
    );
  }
}
