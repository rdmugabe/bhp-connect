import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evacuationDrillReportSchema } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const drillType = searchParams.get("drillType");

    let facilityId: string | null = null;

    if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile) {
        return NextResponse.json({ reports: [] });
      }

      const facilities = await prisma.facility.findMany({
        where: { bhpId: bhpProfile.id },
        select: { id: true },
      });

      const reports = await prisma.evacuationDrillReport.findMany({
        where: {
          facilityId: { in: facilities.map((f) => f.id) },
          ...(year && { year: parseInt(year) }),
          ...(drillType && { drillType: drillType as "EVACUATION" | "DISASTER" }),
        },
        include: {
          facility: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ year: "desc" }, { quarter: "desc" }, { drillDate: "desc" }],
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

      const reports = await prisma.evacuationDrillReport.findMany({
        where: {
          facilityId,
          ...(year && { year: parseInt(year) }),
          ...(drillType && { drillType: drillType as "EVACUATION" | "DISASTER" }),
        },
        include: {
          facility: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ year: "desc" }, { quarter: "desc" }, { drillDate: "desc" }],
      });

      return NextResponse.json({ reports });
    }

    return NextResponse.json({ reports: [] });
  } catch (error) {
    console.error("Get evacuation drill reports error:", error);
    return NextResponse.json(
      { error: "Failed to fetch evacuation drill reports" },
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
    const validatedData = evacuationDrillReportSchema.parse(body);

    // Check for duplicate (same facility, drill type, quarter, year, shift)
    const existing = await prisma.evacuationDrillReport.findUnique({
      where: {
        facilityId_drillType_quarter_year_shift: {
          facilityId: bhrfProfile.facilityId,
          drillType: validatedData.drillType,
          quarter: validatedData.quarter,
          year: validatedData.year,
          shift: validatedData.shift,
        },
      },
    });

    const quarterNames: Record<string, string> = {
      Q1: "Q1 (Jan-Mar)",
      Q2: "Q2 (Apr-Jun)",
      Q3: "Q3 (Jul-Sep)",
      Q4: "Q4 (Oct-Dec)",
    };

    if (existing) {
      return NextResponse.json(
        {
          error: `A ${validatedData.drillType.toLowerCase()} drill report for ${validatedData.shift} shift already exists for ${quarterNames[validatedData.quarter]} ${validatedData.year}`,
        },
        { status: 400 }
      );
    }

    const report = await prisma.evacuationDrillReport.create({
      data: {
        facilityId: bhrfProfile.facilityId,
        drillType: validatedData.drillType,
        drillDate: new Date(validatedData.drillDate),
        drillTime: validatedData.drillTime,
        dayOfWeek: validatedData.dayOfWeek,
        totalLengthMinutes: validatedData.totalLengthMinutes ?? undefined,
        shift: validatedData.shift,
        quarter: validatedData.quarter,
        year: validatedData.year,
        disasterDrillType: validatedData.disasterDrillType ?? undefined,
        staffInvolved: validatedData.staffInvolved,
        residentsInvolved: validatedData.residentsInvolved ?? undefined,
        exitBlocked: validatedData.exitBlocked ?? undefined,
        exitUsed: validatedData.exitUsed ?? undefined,
        assemblyPoint: validatedData.assemblyPoint ?? undefined,
        correctLocation: validatedData.correctLocation ?? undefined,
        allAccountedFor: validatedData.allAccountedFor ?? undefined,
        issuesIdentified: validatedData.issuesIdentified ?? undefined,
        observations: validatedData.observations ?? undefined,
        drillResult: validatedData.drillResult,
        signatures: validatedData.signatures ?? undefined,
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
      action: AuditActions.EVACUATION_DRILL_SUBMITTED,
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

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("Create evacuation drill report error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create evacuation drill report" },
      { status: 500 }
    );
  }
}
