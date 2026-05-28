import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDueSchedules, updateScheduleStatuses } from "@/lib/emar/schedule-generator";
import { getFacilityScope } from "@/lib/facility-scope";

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

    // Always derive facility scope from the caller — never leave it unset.
    const scope = await getFacilityScope(session, searchParams.get("facilityId"));
    if (!scope.ok) {
      return NextResponse.json({ error: scope.error }, { status: scope.status });
    }

    // First, update schedule statuses
    await updateScheduleStatuses();

    // Get due schedules (scoped to facilities the caller can access)
    const schedules = await getDueSchedules({
      facilityScope: scope.where,
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
