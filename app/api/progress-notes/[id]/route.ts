import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { progressNoteUpdateSchema } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { parseJsonBody } from "@/lib/api-utils";
import { parseOptionalDate } from "@/lib/date-utils";

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

    const progressNote = await prisma.progressNote.findUnique({
      where: { id },
      include: {
        intake: {
          select: {
            id: true,
            residentName: true,
            dateOfBirth: true,
            facilityId: true,
          },
        },
        facility: {
          select: {
            id: true,
            name: true,
            bhpId: true,
          },
        },
      },
    });

    if (!progressNote) {
      return NextResponse.json(
        { error: "Progress note not found" },
        { status: 404 }
      );
    }

    // Verify access
    if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile || progressNote.facility.bhpId !== bhpProfile.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile || progressNote.facilityId !== bhrfProfile.facilityId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    return NextResponse.json({ progressNote });
  } catch (error) {
    console.error("Get progress note error:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress note" },
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

    // Find the existing progress note
    const existingNote = await prisma.progressNote.findUnique({
      where: { id },
      include: {
        intake: {
          select: {
            residentName: true,
          },
        },
      },
    });

    if (!existingNote) {
      return NextResponse.json(
        { error: "Progress note not found" },
        { status: 404 }
      );
    }

    if (existingNote.facilityId !== bhrfProfile.facilityId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }


    const parseResult = await parseJsonBody<Record<string, unknown>>(request);
    if (!parseResult.success) {
      return parseResult.error;
    }
    const body = parseResult.data;

    const validatedData = progressNoteUpdateSchema.parse(body);

    const updateData: Record<string, unknown> = {};

    if (validatedData.noteDate !== undefined) {
      updateData.noteDate = parseOptionalDate(validatedData.noteDate);
    }
    if (validatedData.shift !== undefined) {
      updateData.shift = validatedData.shift;
    }
    if (validatedData.authorName !== undefined) {
      updateData.authorName = validatedData.authorName;
    }
    if (validatedData.authorTitle !== undefined) {
      updateData.authorTitle = validatedData.authorTitle;
    }
    if (validatedData.residentStatus !== undefined) {
      updateData.residentStatus = validatedData.residentStatus;
    }
    if (validatedData.observedBehaviors !== undefined) {
      updateData.observedBehaviors = validatedData.observedBehaviors;
    }
    if (validatedData.moodAffect !== undefined) {
      updateData.moodAffect = validatedData.moodAffect;
    }
    if (validatedData.activityParticipation !== undefined) {
      updateData.activityParticipation = validatedData.activityParticipation;
    }
    if (validatedData.staffInteractions !== undefined) {
      updateData.staffInteractions = validatedData.staffInteractions;
    }
    if (validatedData.peerInteractions !== undefined) {
      updateData.peerInteractions = validatedData.peerInteractions;
    }
    if (validatedData.medicationCompliance !== undefined) {
      updateData.medicationCompliance = validatedData.medicationCompliance;
    }
    if (validatedData.hygieneAdl !== undefined) {
      updateData.hygieneAdl = validatedData.hygieneAdl;
    }
    if (validatedData.mealsAppetite !== undefined) {
      updateData.mealsAppetite = validatedData.mealsAppetite;
    }
    if (validatedData.sleepPattern !== undefined) {
      updateData.sleepPattern = validatedData.sleepPattern;
    }
    if (validatedData.staffInterventions !== undefined) {
      updateData.staffInterventions = validatedData.staffInterventions;
    }
    if (validatedData.residentResponse !== undefined) {
      updateData.residentResponse = validatedData.residentResponse;
    }
    if (validatedData.notableEvents !== undefined) {
      updateData.notableEvents = validatedData.notableEvents;
    }
    if (validatedData.additionalNotes !== undefined) {
      updateData.additionalNotes = validatedData.additionalNotes;
    }
    if (validatedData.generatedNote !== undefined) {
      updateData.generatedNote = validatedData.generatedNote;
    }
    if (validatedData.riskFlagsDetected !== undefined) {
      updateData.riskFlagsDetected = validatedData.riskFlagsDetected;
    }
    // BHT Signature fields
    if (validatedData.bhtSignature !== undefined) {
      updateData.bhtSignature = validatedData.bhtSignature;
    }
    if (validatedData.bhtCredentials !== undefined) {
      updateData.bhtCredentials = validatedData.bhtCredentials;
    }
    if (validatedData.bhtSignatureDate !== undefined) {
      updateData.bhtSignatureDate = parseOptionalDate(validatedData.bhtSignatureDate);
    }
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
      if (validatedData.status === "FINAL") {
        updateData.submittedAt = new Date();
      }
    }

    const progressNote = await prisma.progressNote.update({
      where: { id },
      data: updateData,
      include: {
        intake: {
          select: {
            id: true,
            residentName: true,
          },
        },
      },
    });

    const action = validatedData.status === "FINAL"
      ? AuditActions.PROGRESS_NOTE_FINALIZED
      : AuditActions.PROGRESS_NOTE_UPDATED;

    await createAuditLog({
      userId: session.user.id,
      action,
      entityType: "ProgressNote",
      entityId: progressNote.id,
      details: {
        intakeId: progressNote.intakeId,
        residentName: progressNote.intake.residentName,
        updatedFields: Object.keys(updateData),
      },
    });

    return NextResponse.json({ progressNote });
  } catch (error) {
    console.error("Update progress note error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update progress note" },
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

    // Find the existing progress note
    const existingNote = await prisma.progressNote.findUnique({
      where: { id },
      include: {
        intake: {
          select: {
            residentName: true,
          },
        },
      },
    });

    if (!existingNote) {
      return NextResponse.json(
        { error: "Progress note not found" },
        { status: 404 }
      );
    }

    if (existingNote.facilityId !== bhrfProfile.facilityId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Soft delete by setting archivedAt
    await prisma.progressNote.update({
      where: { id },
      data: { archivedAt: new Date() },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.PROGRESS_NOTE_DELETED,
      entityType: "ProgressNote",
      entityId: id,
      details: {
        intakeId: existingNote.intakeId,
        residentName: existingNote.intake.residentName,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete progress note error:", error);
    return NextResponse.json(
      { error: "Failed to delete progress note" },
      { status: 500 }
    );
  }
}
