import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, parseISO, subDays, format } from "date-fns";

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

    // Default to last 7 days
    const endDate = endDateStr ? parseISO(endDateStr) : new Date();
    const startDate = startDateStr ? parseISO(startDateStr) : subDays(endDate, 7);
    const reportStart = startOfDay(startDate);
    const reportEnd = endOfDay(endDate);

    // Get all missed, refused, and held doses
    const missedDoses = await prisma.medicationSchedule.findMany({
      where: {
        scheduledDateTime: { gte: reportStart, lte: reportEnd },
        status: { in: ["MISSED", "REFUSED", "HELD"] },
        medicationOrder: {
          facilityId,
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
              },
            },
          },
        },
        administration: {
          select: {
            refusedReason: true,
            heldReason: true,
            notGivenReason: true,
            notes: true,
          },
        },
      },
      orderBy: {
        scheduledDateTime: "desc",
      },
    });

    // Group by status
    const byStatus = {
      MISSED: missedDoses.filter((d) => d.status === "MISSED"),
      REFUSED: missedDoses.filter((d) => d.status === "REFUSED"),
      HELD: missedDoses.filter((d) => d.status === "HELD"),
    };

    // Group by patient
    const byPatientMap: Record<string, {
      patient: { id: string; name: string };
      missed: number;
      refused: number;
      held: number;
      doses: typeof missedDoses;
    }> = {};

    for (const dose of missedDoses) {
      const patientId = dose.medicationOrder.intake.id;
      if (!byPatientMap[patientId]) {
        byPatientMap[patientId] = {
          patient: {
            id: patientId,
            name: dose.medicationOrder.intake.residentName,
          },
          missed: 0,
          refused: 0,
          held: 0,
          doses: [],
        };
      }

      if (dose.status === "MISSED") byPatientMap[patientId].missed++;
      if (dose.status === "REFUSED") byPatientMap[patientId].refused++;
      if (dose.status === "HELD") byPatientMap[patientId].held++;
      byPatientMap[patientId].doses.push(dose);
    }

    // Group by medication
    const byMedicationMap: Record<string, {
      medication: string;
      missed: number;
      refused: number;
      held: number;
    }> = {};

    for (const dose of missedDoses) {
      const medName = dose.medicationOrder.medicationName;
      if (!byMedicationMap[medName]) {
        byMedicationMap[medName] = {
          medication: medName,
          missed: 0,
          refused: 0,
          held: 0,
        };
      }

      if (dose.status === "MISSED") byMedicationMap[medName].missed++;
      if (dose.status === "REFUSED") byMedicationMap[medName].refused++;
      if (dose.status === "HELD") byMedicationMap[medName].held++;
    }

    // Format the doses for output
    const formattedDoses = missedDoses.map((dose) => ({
      id: dose.id,
      scheduledDateTime: dose.scheduledDateTime.toISOString(),
      scheduledDateFormatted: format(dose.scheduledDateTime, "MMM d, yyyy h:mm a"),
      status: dose.status,
      medication: dose.medicationOrder.medicationName,
      dose: dose.medicationOrder.dose,
      route: dose.medicationOrder.route,
      patient: dose.medicationOrder.intake.residentName,
      patientId: dose.medicationOrder.intake.id,
      reason:
        dose.administration?.refusedReason ||
        dose.administration?.heldReason ||
        dose.administration?.notGivenReason ||
        null,
      notes: dose.administration?.notes,
    }));

    return NextResponse.json({
      reportPeriod: {
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
      },
      summary: {
        total: missedDoses.length,
        missed: byStatus.MISSED.length,
        refused: byStatus.REFUSED.length,
        held: byStatus.HELD.length,
      },
      doses: formattedDoses,
      byPatient: Object.values(byPatientMap).sort(
        (a, b) => b.missed + b.refused + b.held - (a.missed + a.refused + a.held)
      ),
      byMedication: Object.values(byMedicationMap).sort(
        (a, b) => b.missed + b.refused + b.held - (a.missed + a.refused + a.held)
      ),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get missed doses report error:", error);
    return NextResponse.json(
      { error: "Failed to generate missed doses report" },
      { status: 500 }
    );
  }
}
