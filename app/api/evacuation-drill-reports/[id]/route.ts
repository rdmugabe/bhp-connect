import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evacuationDrillReportSchema } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const report = await prisma.evacuationDrillReport.findUnique({
      where: { id },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            address: true,
            bhp: {
              select: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Verify access
    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile || bhrfProfile.facilityId !== report.facilityId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      const facility = await prisma.facility.findUnique({
        where: { id: report.facilityId },
      });

      if (!bhpProfile || !facility || facility.bhpId !== bhpProfile.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Get evacuation drill report error:", error);
    return NextResponse.json(
      { error: "Failed to fetch evacuation drill report" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "BHRF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!bhrfProfile) {
      return NextResponse.json(
        { error: "Facility not assigned" },
        { status: 400 }
      );
    }

    const existingReport = await prisma.evacuationDrillReport.findUnique({
      where: { id },
    });

    if (!existingReport) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (existingReport.facilityId !== bhrfProfile.facilityId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = evacuationDrillReportSchema.parse(body);

    // Check for duplicate if quarter/year/shift/type changed
    if (
      validatedData.quarter !== existingReport.quarter ||
      validatedData.year !== existingReport.year ||
      validatedData.shift !== existingReport.shift ||
      validatedData.drillType !== existingReport.drillType
    ) {
      const duplicate = await prisma.evacuationDrillReport.findFirst({
        where: {
          facilityId: bhrfProfile.facilityId,
          drillType: validatedData.drillType,
          quarter: validatedData.quarter,
          year: validatedData.year,
          shift: validatedData.shift,
          id: { not: id },
        },
      });

      const quarterNames: Record<string, string> = {
        Q1: "Q1 (Jan-Mar)",
        Q2: "Q2 (Apr-Jun)",
        Q3: "Q3 (Jul-Sep)",
        Q4: "Q4 (Oct-Dec)",
      };

      if (duplicate) {
        return NextResponse.json(
          {
            error: `A ${validatedData.drillType.toLowerCase()} drill report for ${validatedData.shift} shift already exists for ${quarterNames[validatedData.quarter]} ${validatedData.year}`,
          },
          { status: 400 }
        );
      }
    }

    const report = await prisma.evacuationDrillReport.update({
      where: { id },
      data: {
        drillType: validatedData.drillType,
        drillDate: new Date(validatedData.drillDate),
        drillTime: validatedData.drillTime,
        dayOfWeek: validatedData.dayOfWeek,
        totalLengthMinutes: validatedData.totalLengthMinutes,
        shift: validatedData.shift,
        quarter: validatedData.quarter,
        year: validatedData.year,
        disasterDrillType: validatedData.disasterDrillType,
        staffInvolved: validatedData.staffInvolved,
        residentsInvolved: validatedData.residentsInvolved,
        exitBlocked: validatedData.exitBlocked,
        exitUsed: validatedData.exitUsed,
        assemblyPoint: validatedData.assemblyPoint,
        correctLocation: validatedData.correctLocation,
        allAccountedFor: validatedData.allAccountedFor,
        issuesIdentified: validatedData.issuesIdentified,
        observations: validatedData.observations,
        drillResult: validatedData.drillResult,
        signatures: validatedData.signatures,
      },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.EVACUATION_DRILL_UPDATED,
      entityType: "EvacuationDrillReport",
      entityId: report.id,
      details: {
        drillType: validatedData.drillType,
        quarter: validatedData.quarter,
        year: validatedData.year,
        shift: validatedData.shift,
        drillResult: validatedData.drillResult,
      },
    });

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Update evacuation drill report error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update evacuation drill report" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "BHRF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!bhrfProfile) {
      return NextResponse.json(
        { error: "Facility not assigned" },
        { status: 400 }
      );
    }

    const report = await prisma.evacuationDrillReport.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (report.facilityId !== bhrfProfile.facilityId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.evacuationDrillReport.delete({
      where: { id },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.EVACUATION_DRILL_DELETED,
      entityType: "EvacuationDrillReport",
      entityId: id,
      details: {
        drillType: report.drillType,
        quarter: report.quarter,
        year: report.year,
        shift: report.shift,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete evacuation drill report error:", error);
    return NextResponse.json(
      { error: "Failed to delete evacuation drill report" },
      { status: 500 }
    );
  }
}
