import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getReEvaluationState, compareByUrgency } from "@/lib/evaluation-cycles";

/**
 * Returns per-resident Re-Evaluation Countdown status for every active
 * resident visible to the caller. Sorted most-urgent first.
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let facilityIds: string[] = [];

    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (!bhrfProfile) {
        return NextResponse.json({ residents: [], counts: zeroCounts() });
      }
      facilityIds = [bhrfProfile.facilityId];
    } else if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (!bhpProfile) {
        return NextResponse.json({ residents: [], counts: zeroCounts() });
      }
      const facilities = await prisma.facility.findMany({
        where: { bhpId: bhpProfile.id },
        select: { id: true },
      });
      facilityIds = facilities.map((f) => f.id);
    } else if (session.user.role !== "ADMIN") {
      return NextResponse.json({ residents: [], counts: zeroCounts() });
    }

    const residents = await prisma.intake.findMany({
      where: {
        status: "APPROVED",
        dischargedAt: null,
        ...(facilityIds.length > 0 && { facilityId: { in: facilityIds } }),
      },
      select: {
        id: true,
        residentName: true,
        dateOfBirth: true,
        admissionDate: true,
        facilityId: true,
        facility: { select: { name: true } },
        nextReEvaluationDueDate: true,
        residentEvaluations: {
          select: {
            id: true,
            cycleNumber: true,
            completedDate: true,
            fileName: true,
          },
          orderBy: { completedDate: "desc" },
          take: 1,
        },
      },
    });

    const today = new Date();

    const enriched = residents.map((r) => {
      const state = getReEvaluationState(r.nextReEvaluationDueDate, today);
      const latest = r.residentEvaluations[0] ?? null;
      return {
        intakeId: r.id,
        residentName: r.residentName,
        dateOfBirth: r.dateOfBirth,
        admissionDate: r.admissionDate,
        facilityId: r.facilityId,
        facilityName: r.facility?.name ?? null,
        state,
        latestEvaluation: latest
          ? {
              id: latest.id,
              completedDate: latest.completedDate,
              fileName: latest.fileName,
            }
          : null,
      };
    });

    enriched.sort((a, b) => compareByUrgency(a.state, b.state));

    const counts = {
      total: enriched.length,
      overdue: enriched.filter((r) => r.state.status === "OVERDUE").length,
      dueSoon: enriched.filter((r) => r.state.status === "DUE_SOON").length,
      notYet: enriched.filter((r) => r.state.status === "NOT_YET").length,
      unscheduled: enriched.filter((r) => r.state.status === "UNSCHEDULED").length,
    };

    return NextResponse.json({ residents: enriched, counts });
  } catch (error) {
    console.error("Re-evaluation status error:", error);
    return NextResponse.json(
      { error: "Failed to load re-evaluation status" },
      { status: 500 }
    );
  }
}

function zeroCounts() {
  return { total: 0, overdue: 0, dueSoon: 0, notYet: 0, unscheduled: 0 };
}
