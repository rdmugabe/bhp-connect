import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { progressNoteSchema, progressNoteDraftSchema } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { parseJsonBody } from "@/lib/api-utils";
import { parseOptionalDate } from "@/lib/date-utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const intakeId = searchParams.get("intakeId");
    const facilityId = searchParams.get("facilityId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let progressNotes;

    if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile) {
        return NextResponse.json({ progressNotes: [] });
      }

      progressNotes = await prisma.progressNote.findMany({
        where: {
          facility: {
            bhpId: bhpProfile.id,
            ...(facilityId && { id: facilityId }),
          },
          ...(intakeId && { intakeId }),
          ...(status && { status }),
          archivedAt: null,
          ...(startDate && endDate && {
            noteDate: {
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
        },
        orderBy: [
          { noteDate: "desc" },
          { createdAt: "desc" },
        ],
      });
    } else if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile) {
        return NextResponse.json({ progressNotes: [] });
      }

      progressNotes = await prisma.progressNote.findMany({
        where: {
          facilityId: bhrfProfile.facilityId,
          ...(intakeId && { intakeId }),
          ...(status && { status }),
          archivedAt: null,
          ...(startDate && endDate && {
            noteDate: {
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
        },
        orderBy: [
          { noteDate: "desc" },
          { createdAt: "desc" },
        ],
      });
    }

    return NextResponse.json({ progressNotes });
  } catch (error) {
    console.error("Get progress notes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress notes" },
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
    const body = parseResult.data;
    const { intakeId, isDraft, ...noteData } = body as {
      intakeId?: string;
      isDraft?: boolean;
      [key: string]: unknown;
    };

    if (!intakeId) {
      return NextResponse.json(
        { error: "Intake ID is required" },
        { status: 400 }
      );
    }

    // Verify the intake exists and belongs to the facility
    const intake = await prisma.intake.findUnique({
      where: { id: intakeId },
    });

    if (!intake || intake.facilityId !== bhrfProfile.facilityId) {
      return NextResponse.json(
        { error: "Intake not found or unauthorized" },
        { status: 404 }
      );
    }

    // Use appropriate schema based on draft status
    const validatedData = isDraft
      ? progressNoteDraftSchema.parse(noteData)
      : progressNoteSchema.parse(noteData);

    const progressNote = await prisma.progressNote.create({
      data: {
        intakeId,
        facilityId: bhrfProfile.facilityId,
        noteDate: parseOptionalDate(validatedData.noteDate) || new Date(),
        shift: validatedData.shift,
        authorName: validatedData.authorName || "",
        authorTitle: validatedData.authorTitle,
        residentStatus: validatedData.residentStatus,
        observedBehaviors: validatedData.observedBehaviors,
        moodAffect: validatedData.moodAffect,
        activityParticipation: validatedData.activityParticipation,
        staffInteractions: validatedData.staffInteractions,
        peerInteractions: validatedData.peerInteractions,
        medicationCompliance: validatedData.medicationCompliance,
        hygieneAdl: validatedData.hygieneAdl,
        mealsAppetite: validatedData.mealsAppetite,
        sleepPattern: validatedData.sleepPattern,
        staffInterventions: validatedData.staffInterventions,
        residentResponse: validatedData.residentResponse,
        notableEvents: validatedData.notableEvents,
        additionalNotes: validatedData.additionalNotes,
        // BHT Signature
        bhtSignature: validatedData.bhtSignature,
        bhtCredentials: validatedData.bhtCredentials,
        bhtSignatureDate: parseOptionalDate(validatedData.bhtSignatureDate),
        status: isDraft ? "DRAFT" : "FINAL",
        submittedBy: session.user.id,
        submittedAt: isDraft ? null : new Date(),
      },
      include: {
        intake: {
          select: {
            id: true,
            residentName: true,
          },
        },
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.PROGRESS_NOTE_CREATED,
      entityType: "ProgressNote",
      entityId: progressNote.id,
      details: {
        intakeId,
        residentName: progressNote.intake.residentName,
        noteDate: progressNote.noteDate,
        isDraft,
      },
    });

    return NextResponse.json({ progressNote }, { status: 201 });
  } catch (error) {
    console.error("Create progress note error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create progress note" },
      { status: 500 }
    );
  }
}
