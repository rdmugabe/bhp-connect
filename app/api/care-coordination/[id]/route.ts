import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { careCoordinationEntryUpdateSchema, careCoordinationArchiveSchema } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { parseJsonBody } from "@/lib/api-utils";
import { parseOptionalDate } from "@/lib/date-utils";
import { createEditHistoryEntry, appendEditHistory } from "@/lib/care-coordination";
import { CareCoordinationActivityType } from "@prisma/client";

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

    const entry = await prisma.careCoordinationEntry.findUnique({
      where: { id },
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
            bhpId: true,
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
                authorName: true,
              },
            },
          },
        },
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Check authorization
    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile || bhrfProfile.facilityId !== entry.facilityId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile || bhpProfile.id !== entry.facility.bhpId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Get care coordination entry error:", error);
    return NextResponse.json(
      { error: "Failed to fetch entry" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    // Get existing entry
    const existingEntry = await prisma.careCoordinationEntry.findUnique({
      where: { id },
      include: {
        intake: {
          select: {
            residentName: true,
          },
        },
      },
    });

    if (!existingEntry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    if (existingEntry.facilityId !== bhrfProfile.facilityId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (existingEntry.archivedAt) {
      return NextResponse.json(
        { error: "Cannot edit archived entry" },
        { status: 400 }
      );
    }

    const parseResult = await parseJsonBody<Record<string, unknown>>(request);
    if (!parseResult.success) {
      return parseResult.error;
    }

    const validatedData = careCoordinationEntryUpdateSchema.parse(parseResult.data);

    // Create edit history entry with previous values
    const previousData: Record<string, unknown> = {};
    const updateData: Record<string, unknown> = {};

    if (validatedData.activityType !== undefined) {
      previousData.activityType = existingEntry.activityType;
      updateData.activityType = validatedData.activityType as CareCoordinationActivityType;
    }
    if (validatedData.activityDate !== undefined) {
      previousData.activityDate = existingEntry.activityDate;
      updateData.activityDate = parseOptionalDate(validatedData.activityDate);
    }
    if (validatedData.activityTime !== undefined) {
      previousData.activityTime = existingEntry.activityTime;
      updateData.activityTime = validatedData.activityTime;
    }
    if (validatedData.description !== undefined) {
      previousData.description = existingEntry.description;
      updateData.description = validatedData.description;
    }
    if (validatedData.outcome !== undefined) {
      previousData.outcome = existingEntry.outcome;
      updateData.outcome = validatedData.outcome;
    }
    if (validatedData.followUpNeeded !== undefined) {
      previousData.followUpNeeded = existingEntry.followUpNeeded;
      updateData.followUpNeeded = validatedData.followUpNeeded;
    }
    if (validatedData.followUpDate !== undefined) {
      previousData.followUpDate = existingEntry.followUpDate;
      updateData.followUpDate = validatedData.followUpDate ? parseOptionalDate(validatedData.followUpDate) : null;
    }
    if (validatedData.followUpNotes !== undefined) {
      previousData.followUpNotes = existingEntry.followUpNotes;
      updateData.followUpNotes = validatedData.followUpNotes;
    }
    if (validatedData.contactName !== undefined) {
      previousData.contactName = existingEntry.contactName;
      updateData.contactName = validatedData.contactName;
    }
    if (validatedData.contactRole !== undefined) {
      previousData.contactRole = existingEntry.contactRole;
      updateData.contactRole = validatedData.contactRole;
    }
    if (validatedData.contactPhone !== undefined) {
      previousData.contactPhone = existingEntry.contactPhone;
      updateData.contactPhone = validatedData.contactPhone;
    }
    if (validatedData.contactEmail !== undefined) {
      previousData.contactEmail = existingEntry.contactEmail;
      updateData.contactEmail = validatedData.contactEmail;
    }

    // Only save edit history if there are actual changes
    if (Object.keys(previousData).length > 0) {
      const editHistoryEntry = createEditHistoryEntry(
        session.user.id,
        session.user.name || "Unknown",
        previousData
      );
      updateData.editHistory = appendEditHistory(
        existingEntry.editHistory,
        editHistoryEntry
      );
    }

    const entry = await prisma.careCoordinationEntry.update({
      where: { id },
      data: updateData,
      include: {
        intake: {
          select: {
            id: true,
            residentName: true,
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
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.CARE_COORDINATION_UPDATED,
      entityType: "CareCoordinationEntry",
      entityId: entry.id,
      details: {
        intakeId: entry.intakeId,
        residentName: entry.intake.residentName,
        changes: Object.keys(previousData),
      },
    });

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Update care coordination entry error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update entry" },
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

    // Only ADMIN can delete (soft delete)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 401 });
    }

    const { id } = await params;

    const parseResult = await parseJsonBody<Record<string, unknown>>(request);
    if (!parseResult.success) {
      return parseResult.error;
    }

    const validatedData = careCoordinationArchiveSchema.parse(parseResult.data);

    const existingEntry = await prisma.careCoordinationEntry.findUnique({
      where: { id },
      include: {
        intake: {
          select: {
            residentName: true,
          },
        },
      },
    });

    if (!existingEntry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    if (existingEntry.archivedAt) {
      return NextResponse.json(
        { error: "Entry is already archived" },
        { status: 400 }
      );
    }

    // Soft delete - set archivedAt timestamp
    const entry = await prisma.careCoordinationEntry.update({
      where: { id },
      data: {
        archivedAt: new Date(),
        archivedById: session.user.id,
        archivedByName: session.user.name || "Unknown",
        archiveReason: validatedData.archiveReason,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.CARE_COORDINATION_ARCHIVED,
      entityType: "CareCoordinationEntry",
      entityId: entry.id,
      details: {
        intakeId: entry.intakeId,
        residentName: existingEntry.intake.residentName,
        archiveReason: validatedData.archiveReason,
      },
    });

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error("Archive care coordination entry error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to archive entry" },
      { status: 500 }
    );
  }
}
