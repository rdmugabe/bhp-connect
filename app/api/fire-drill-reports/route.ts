import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fireDrillReportSchema } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    let facilityId: string | null = null;

    if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile) {
        return NextResponse.json({ reports: [] });
      }

      // Get all facilities for this BHP
      const facilities = await prisma.facility.findMany({
        where: { bhpId: bhpProfile.id },
        select: { id: true },
      });

      const reports = await prisma.fireDrillReport.findMany({
        where: {
          facilityId: { in: facilities.map((f) => f.id) },
          ...(year && { reportYear: parseInt(year) }),
          ...(month && { reportMonth: parseInt(month) }),
        },
        include: {
          facility: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ reportYear: "desc" }, { reportMonth: "desc" }, { shift: "asc" }],
      });

      return NextResponse.json({ reports });
    } else if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile) {
        return NextResponse.json({ reports: [] });
      }

      facilityId = bhrfProfile.facilityId;

      const reports = await prisma.fireDrillReport.findMany({
        where: {
          facilityId,
          ...(year && { reportYear: parseInt(year) }),
          ...(month && { reportMonth: parseInt(month) }),
        },
        include: {
          facility: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ reportYear: "desc" }, { reportMonth: "desc" }, { shift: "asc" }],
      });

      return NextResponse.json({ reports });
    }

    return NextResponse.json({ reports: [] });
  } catch (error) {
    console.error("Get fire drill reports error:", error);
    return NextResponse.json(
      { error: "Failed to fetch fire drill reports" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "BHRF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!bhrfProfile) {
      return NextResponse.json(
        { error: "Facility not assigned" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = fireDrillReportSchema.parse(body);

    // Parse the drill date to get month and year
    const drillDate = new Date(validatedData.drillDate);
    const reportMonth = drillDate.getMonth() + 1; // JavaScript months are 0-indexed
    const reportYear = drillDate.getFullYear();

    // Check for duplicate (same facility, month, year, shift)
    const existing = await prisma.fireDrillReport.findUnique({
      where: {
        facilityId_reportMonth_reportYear_shift: {
          facilityId: bhrfProfile.facilityId,
          reportMonth,
          reportYear,
          shift: validatedData.shift,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `A ${validatedData.shift} shift fire drill report already exists for ${drillDate.toLocaleString("default", { month: "long" })} ${reportYear}`,
        },
        { status: 400 }
      );
    }

    const report = await prisma.fireDrillReport.create({
      data: {
        facilityId: bhrfProfile.facilityId,
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
        submittedBy: session.user.id,
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
      action: AuditActions.FIRE_DRILL_SUBMITTED,
      entityType: "FireDrillReport",
      entityId: report.id,
      details: {
        reportMonth,
        reportYear,
        shift: validatedData.shift,
        drillResult: validatedData.drillResult,
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("Create fire drill report error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create fire drill report" },
      { status: 500 }
    );
  }
}
