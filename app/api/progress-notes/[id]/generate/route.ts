import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { generateProgressNote, isAnthropicConfigured } from "@/lib/ai";
import { formatISODateOnly } from "@/lib/date-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "BHRF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Anthropic is configured
    if (!isAnthropicConfigured()) {
      return NextResponse.json(
        { error: "AI service is not configured. Please contact your administrator." },
        { status: 503 }
      );
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
            id: true,
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

    // Don't regenerate for finalized notes
    if (existingNote.status === "FINAL") {
      return NextResponse.json(
        { error: "Cannot regenerate a finalized progress note" },
        { status: 400 }
      );
    }

    // Prepare inputs for AI
    const aiInputs = {
      residentName: existingNote.intake.residentName,
      noteDate: formatISODateOnly(existingNote.noteDate) || new Date().toISOString().split("T")[0],
      shift: existingNote.shift || undefined,
      authorName: existingNote.authorName,
      authorTitle: existingNote.authorTitle || undefined,
      residentStatus: existingNote.residentStatus || undefined,
      observedBehaviors: existingNote.observedBehaviors || undefined,
      moodAffect: existingNote.moodAffect || undefined,
      activityParticipation: existingNote.activityParticipation || undefined,
      staffInteractions: existingNote.staffInteractions || undefined,
      peerInteractions: existingNote.peerInteractions || undefined,
      medicationCompliance: existingNote.medicationCompliance || undefined,
      hygieneAdl: existingNote.hygieneAdl || undefined,
      mealsAppetite: existingNote.mealsAppetite || undefined,
      sleepPattern: existingNote.sleepPattern || undefined,
      staffInterventions: existingNote.staffInterventions || undefined,
      residentResponse: existingNote.residentResponse || undefined,
      notableEvents: existingNote.notableEvents || undefined,
      additionalNotes: existingNote.additionalNotes || undefined,
    };

    // Generate the note using AI
    const result = await generateProgressNote(aiInputs);

    // Update the progress note with the generated content
    const updatedNote = await prisma.progressNote.update({
      where: { id },
      data: {
        generatedNote: result.note,
        riskFlagsDetected: result.riskFlags,
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
      action: AuditActions.PROGRESS_NOTE_GENERATED,
      entityType: "ProgressNote",
      entityId: id,
      details: {
        intakeId: existingNote.intakeId,
        residentName: existingNote.intake.residentName,
        riskFlagsDetected: result.riskFlags,
      },
    });

    return NextResponse.json({
      progressNote: updatedNote,
      generatedNote: result.note,
      riskFlags: result.riskFlags,
    });
  } catch (error) {
    console.error("Generate progress note error:", error);

    if (error instanceof Error && error.message.includes("API key")) {
      return NextResponse.json(
        { error: "AI service configuration error. Please contact your administrator." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate progress note" },
      { status: 500 }
    );
  }
}
