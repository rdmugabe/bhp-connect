import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { generateCareCoordinationSummary, isAnthropicConfigured } from "@/lib/ai";
import { formatDateOnly } from "@/lib/date-utils";
import { CareCoordinationActivityType } from "@prisma/client";
import { ACTIVITY_TYPE_CONFIG } from "@/lib/care-coordination";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAnthropicConfigured()) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 503 }
      );
    }

    // Parse request body
    let intakeId: string | undefined;
    let startDate: string | undefined;
    let endDate: string | undefined;
    let activityTypes: CareCoordinationActivityType[] | undefined;

    try {
      const body = await request.json();
      intakeId = body.intakeId;
      startDate = body.startDate;
      endDate = body.endDate;
      activityTypes = body.activityTypes;
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    if (!intakeId) {
      return NextResponse.json(
        { error: "Intake ID is required" },
        { status: 400 }
      );
    }

    // Get the intake and verify access
    const intake = await prisma.intake.findUnique({
      where: { id: intakeId },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            bhpId: true,
          },
        },
      },
    });

    if (!intake) {
      return NextResponse.json({ error: "Resident not found" }, { status: 404 });
    }

    // Check authorization
    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile || bhrfProfile.facilityId !== intake.facilityId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile || bhpProfile.id !== intake.facility.bhpId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Build query filters
    const whereClause: Record<string, unknown> = {
      intakeId,
      archivedAt: null,
    };

    if (startDate && endDate) {
      whereClause.activityDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (activityTypes && activityTypes.length > 0) {
      whereClause.activityType = { in: activityTypes };
    }

    // Get care coordination entries
    const entries = await prisma.careCoordinationEntry.findMany({
      where: whereClause,
      orderBy: { activityDate: "desc" },
    });

    if (entries.length === 0) {
      return NextResponse.json(
        { error: "No care coordination entries found for summary" },
        { status: 400 }
      );
    }

    // Generate AI summary
    const summaryResult = await generateCareCoordinationSummary({
      residentName: intake.residentName || "Unknown",
      dateOfBirth: formatDateOnly(intake.dateOfBirth) || "Unknown",
      facilityName: intake.facility.name,
      dateRange: startDate && endDate ? { startDate, endDate } : undefined,
      entries: entries.map((entry) => ({
        activityType: ACTIVITY_TYPE_CONFIG[entry.activityType]?.label || entry.activityType,
        activityDate: formatDateOnly(entry.activityDate) || "Unknown",
        activityTime: entry.activityTime || undefined,
        description: entry.description,
        outcome: entry.outcome || undefined,
        followUpNeeded: entry.followUpNeeded,
        followUpDate: entry.followUpDate ? formatDateOnly(entry.followUpDate) || undefined : undefined,
        followUpNotes: entry.followUpNotes || undefined,
        contactName: entry.contactName || undefined,
        contactRole: entry.contactRole || undefined,
        createdByName: entry.createdByName,
      })),
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.CARE_COORDINATION_SUMMARY_GENERATED,
      entityType: "Intake",
      entityId: intakeId,
      details: {
        residentName: intake.residentName,
        entriesCount: entries.length,
        dateRange: startDate && endDate ? { startDate, endDate } : null,
      },
    });

    return NextResponse.json({
      summary: summaryResult,
      entriesCount: entries.length,
      dateRange: startDate && endDate ? { startDate, endDate } : null,
    });
  } catch (error) {
    console.error("Generate care coordination summary error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
