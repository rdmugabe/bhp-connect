import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { careCoordinationEntrySchema } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { parseJsonBody } from "@/lib/api-utils";
import { parseRequiredDate, parseOptionalDate } from "@/lib/date-utils";
import { CareCoordinationActivityType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const intakeId = searchParams.get("intakeId");
    const facilityId = searchParams.get("facilityId");
    const activityType = searchParams.get("activityType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const followUpNeeded = searchParams.get("followUpNeeded");
    const includeArchived = searchParams.get("includeArchived") === "true";

    let entries;

    if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile) {
        return NextResponse.json({ entries: [] });
      }

      entries = await prisma.careCoordinationEntry.findMany({
        where: {
          facility: {
            bhpId: bhpProfile.id,
            ...(facilityId && { id: facilityId }),
          },
          ...(intakeId && { intakeId }),
          ...(activityType && { activityType: activityType as CareCoordinationActivityType }),
          ...(!includeArchived && { archivedAt: null }),
          ...(followUpNeeded === "true" && { followUpNeeded: true }),
          ...(startDate && endDate && {
            activityDate: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }),
        },
        include: {
          intake: {
            select: {
              id: true,
              residentName: true,
              dateOfBirth: true,
            },
          },
          facility: {
            select: {
              id: true,
              name: true,
            },
          },
          attachments: true,
          progressNoteLinks: {
            include: {
              progressNote: {
                select: {
                  id: true,
                  noteDate: true,
                  status: true,
                },
              },
            },
          },
        },
        orderBy: [
          { activityDate: "desc" },
          { createdAt: "desc" },
        ],
      });
    } else if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile) {
        return NextResponse.json({ entries: [] });
      }

      entries = await prisma.careCoordinationEntry.findMany({
        where: {
          facilityId: bhrfProfile.facilityId,
          ...(intakeId && { intakeId }),
          ...(activityType && { activityType: activityType as CareCoordinationActivityType }),
          ...(!includeArchived && { archivedAt: null }),
          ...(followUpNeeded === "true" && { followUpNeeded: true }),
          ...(startDate && endDate && {
            activityDate: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }),
        },
        include: {
          intake: {
            select: {
              id: true,
              residentName: true,
              dateOfBirth: true,
            },
          },
          facility: {
            select: {
              id: true,
              name: true,
            },
          },
          attachments: true,
          progressNoteLinks: {
            include: {
              progressNote: {
                select: {
                  id: true,
                  noteDate: true,
                  status: true,
                },
              },
            },
          },
        },
        orderBy: [
          { activityDate: "desc" },
          { createdAt: "desc" },
        ],
      });
    }

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Get care coordination entries error:", error);
    return NextResponse.json(
      { error: "Failed to fetch care coordination entries" },
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

    const parseResult = await parseJsonBody<Record<string, unknown>>(request);
    if (!parseResult.success) {
      return parseResult.error;
    }

    const validatedData = careCoordinationEntrySchema.parse(parseResult.data);

    // Verify the intake exists and belongs to the facility
    const intake = await prisma.intake.findUnique({
      where: { id: validatedData.intakeId },
    });

    if (!intake || intake.facilityId !== bhrfProfile.facilityId) {
      return NextResponse.json(
        { error: "Resident not found or unauthorized" },
        { status: 404 }
      );
    }

    const entry = await prisma.careCoordinationEntry.create({
      data: {
        intakeId: validatedData.intakeId,
        facilityId: bhrfProfile.facilityId,
        activityType: validatedData.activityType as CareCoordinationActivityType,
        activityDate: parseRequiredDate(validatedData.activityDate, "Activity date"),
        activityTime: validatedData.activityTime || null,
        description: validatedData.description,
        outcome: validatedData.outcome || null,
        followUpNeeded: validatedData.followUpNeeded,
        followUpDate: validatedData.followUpDate ? parseOptionalDate(validatedData.followUpDate) : null,
        followUpNotes: validatedData.followUpNotes || null,
        contactName: validatedData.contactName || null,
        contactRole: validatedData.contactRole || null,
        contactPhone: validatedData.contactPhone || null,
        contactEmail: validatedData.contactEmail || null,
        createdById: session.user.id,
        createdByName: session.user.name || "Unknown",
      },
      include: {
        intake: {
          select: {
            id: true,
            residentName: true,
          },
        },
        attachments: true,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.CARE_COORDINATION_CREATED,
      entityType: "CareCoordinationEntry",
      entityId: entry.id,
      details: {
        intakeId: validatedData.intakeId,
        residentName: entry.intake.residentName,
        activityType: entry.activityType,
        activityDate: entry.activityDate,
      },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error("Create care coordination entry error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create care coordination entry" },
      { status: 500 }
    );
  }
}
