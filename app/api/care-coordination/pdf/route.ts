import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { CareCoordinationPDF } from "@/lib/pdf/care-coordination-template";
import { formatDateOnly, getTodayArizona } from "@/lib/date-utils";
import { generateCareCoordinationSummary, isAnthropicConfigured } from "@/lib/ai";
import { ACTIVITY_TYPE_CONFIG } from "@/lib/care-coordination";
import { CareCoordinationActivityType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const intakeId = searchParams.get("intakeId");

    if (!intakeId) {
      return NextResponse.json(
        { error: "Intake ID is required" },
        { status: 400 }
      );
    }

    // Parse optional filters
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const includeSummary = searchParams.get("includeSummary") === "true";
    const activityTypesParam = searchParams.get("activityTypes");
    const activityTypes = activityTypesParam
      ? activityTypesParam.split(",") as CareCoordinationActivityType[]
      : undefined;

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

    // Authorization check based on role
    if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (intake.facility.bhpId !== bhpProfile?.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (intake.facilityId !== bhrfProfile?.facilityId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    // Generate summary if requested and AI is configured
    let summary: {
      text: string;
      keyHighlights?: string[];
      pendingFollowUps?: string[];
      coordinationGaps?: string;
    } | undefined;

    if (includeSummary && isAnthropicConfigured() && entries.length > 0) {
      try {
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

        summary = {
          text: summaryResult.summary,
          keyHighlights: summaryResult.keyHighlights,
          pendingFollowUps: summaryResult.pendingFollowUps,
          coordinationGaps: summaryResult.coordinationGaps,
        };
      } catch (error) {
        console.error("Failed to generate summary for PDF:", error);
        // Continue without summary
      }
    }

    // Prepare PDF data
    const pdfData = {
      residentName: intake.residentName || "Unknown",
      dateOfBirth: intake.dateOfBirth?.toISOString() || "",
      ahcccsId: intake.policyNumber || undefined,
      facilityName: intake.facility.name,
      dateRange: startDate && endDate ? { startDate, endDate } : undefined,
      generatedAt: new Date().toISOString(),
      generatedBy: session.user.name || "Unknown",
      entries: entries.map((entry) => ({
        activityType: entry.activityType,
        activityDate: entry.activityDate.toISOString(),
        activityTime: entry.activityTime || undefined,
        description: entry.description,
        outcome: entry.outcome || undefined,
        followUpNeeded: entry.followUpNeeded,
        followUpDate: entry.followUpDate?.toISOString() || undefined,
        createdByName: entry.createdByName,
      })),
      summary,
    };

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      CareCoordinationPDF({ data: pdfData })
    );

    // Log the PDF download for HIPAA compliance
    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.CARE_COORDINATION_PDF_DOWNLOADED,
      entityType: "Intake",
      entityId: intakeId,
      details: {
        residentName: intake.residentName,
        facilityName: intake.facility.name,
        entriesCount: entries.length,
        dateRange: startDate && endDate ? { startDate, endDate } : null,
        includedSummary: !!summary,
        downloadedBy: session.user.name,
        downloadedByRole: session.user.role,
      },
    });

    // Create filename
    const dateStr = getTodayArizona();
    const residentName = (intake.residentName || "unknown")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 20);
    const filename = `care_coordination_${residentName}_${dateStr}.pdf`;

    // Return PDF response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
      },
    });
  } catch (error) {
    console.error("Generate Care Coordination PDF error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    return NextResponse.json(
      { error: "Failed to generate PDF", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
