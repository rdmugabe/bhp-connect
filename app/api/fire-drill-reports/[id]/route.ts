import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fireDrillReportSchema } from "@/lib/validations";
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

    const report = await prisma.fireDrillReport.findUnique({
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
    console.error("Get fire drill report error:", error);
    return NextResponse.json(
      { error: "Failed to fetch fire drill report" },
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

    const existingReport = await prisma.fireDrillReport.findUnique({
      where: { id },
    });

    if (!existingReport) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (existingReport.facilityId !== bhrfProfile.facilityId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = fireDrillReportSchema.parse(body);

    // Parse the drill date to get month and year
    const drillDate = new Date(validatedData.drillDate);
    const reportMonth = drillDate.getMonth() + 1;
    const reportYear = drillDate.getFullYear();

    // Check for duplicate if month/year/shift changed
    if (
      reportMonth !== existingReport.reportMonth ||
      reportYear !== existingReport.reportYear ||
      validatedData.shift !== existingReport.shift
    ) {
      const duplicate = await prisma.fireDrillReport.findFirst({
        where: {
          facilityId: bhrfProfile.facilityId,
          reportMonth,
          reportYear,
          shift: validatedData.shift,
          id: { not: id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            error: `A ${validatedData.shift} shift fire drill report already exists for ${drillDate.toLocaleString("default", { month: "long" })} ${reportYear}`,
          },
          { status: 400 }
        );
      }
    }

    const report = await prisma.fireDrillReport.update({
      where: { id },
      data: {
        reportMonth,
        reportYear,
        drillDate,
        drillTime: validatedData.drillTime,
        location: validatedData.location,
        shift: validatedData.shift,
        drillType: validatedData.drillType,
        conductedBy: validatedData.conductedBy,
        alarmActivatedTime: validatedData.alarmActivatedTime,
        buildingClearTime: validatedData.buildingClearTime,
        totalEvacuationTime: validatedData.totalEvacuationTime,
        numberEvacuated: validatedData.numberEvacuated,
        safetyChecklist: validatedData.safetyChecklist,
        residentsPresent: validatedData.residentsPresent,
        observations: validatedData.observations,
        correctiveActions: validatedData.correctiveActions,
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
      action: AuditActions.FIRE_DRILL_UPDATED,
      entityType: "FireDrillReport",
      entityId: report.id,
      details: {
        reportMonth,
        reportYear,
        shift: validatedData.shift,
        drillResult: validatedData.drillResult,
      },
    });

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Update fire drill report error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update fire drill report" },
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

    const report = await prisma.fireDrillReport.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (report.facilityId !== bhrfProfile.facilityId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.fireDrillReport.delete({
      where: { id },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.FIRE_DRILL_DELETED,
      entityType: "FireDrillReport",
      entityId: id,
      details: {
        reportMonth: report.reportMonth,
        reportYear: report.reportYear,
        shift: report.shift,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete fire drill report error:", error);
    return NextResponse.json(
      { error: "Failed to delete fire drill report" },
      { status: 500 }
    );
  }
}
