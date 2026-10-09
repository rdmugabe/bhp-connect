import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { buildProgressNoteDocx, progressNoteDocxFilename } from "@/lib/progress-notes-docx";
import { getStaffingForDate } from "@/lib/staffing";
import { getFileFromS3 } from "@/lib/s3";

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
        facility: true,
        intake: {
          select: {
            residentName: true,
            dateOfBirth: true,
            policyNumber: true,
          },
        },
      },
    });

    if (!progressNote) {
      return NextResponse.json({ error: "Progress note not found" }, { status: 404 });
    }

    if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (progressNote.facility.bhpId !== bhpProfile?.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (progressNote.facilityId !== bhrfProfile?.facilityId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Look up the signature image for this shift+date, if one is on file.
    let bhtSignatureImage: { buffer: Buffer; type: "png" | "jpg" } | null = null;
    if (progressNote.shift) {
      const staffing = await getStaffingForDate(
        progressNote.facilityId,
        progressNote.shift,
        progressNote.noteDate
      );
      if (staffing?.signatureKey) {
        try {
          const { buffer, contentType } = await getFileFromS3(staffing.signatureKey);
          bhtSignatureImage = {
            buffer,
            type: contentType.includes("png") ? "png" : "jpg",
          };
        } catch (err) {
          console.error("Failed to fetch signature image:", err);
        }
      }
    }

    const docxBuffer = await buildProgressNoteDocx({
      residentName: progressNote.intake.residentName,
      dateOfBirth: progressNote.intake.dateOfBirth,
      ahcccsId: progressNote.intake.policyNumber,
      facilityName: progressNote.facility.name,
      noteDate: progressNote.noteDate,
      shift: progressNote.shift,
      authorName: progressNote.authorName,
      authorTitle: progressNote.authorTitle,
      status: progressNote.status,
      residentStatus: progressNote.residentStatus,
      observedBehaviors: progressNote.observedBehaviors,
      moodAffect: progressNote.moodAffect,
      activityParticipation: progressNote.activityParticipation,
      staffInteractions: progressNote.staffInteractions,
      peerInteractions: progressNote.peerInteractions,
      medicationCompliance: progressNote.medicationCompliance,
      hygieneAdl: progressNote.hygieneAdl,
      mealsAppetite: progressNote.mealsAppetite,
      sleepPattern: progressNote.sleepPattern,
      staffInterventions: progressNote.staffInterventions,
      residentResponse: progressNote.residentResponse,
      notableEvents: progressNote.notableEvents,
      additionalNotes: progressNote.additionalNotes,
      bhtSignature: progressNote.bhtSignature,
      bhtCredentials: progressNote.bhtCredentials,
      bhtSignatureDate: progressNote.bhtSignatureDate,
      bhtSignatureImage,
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.PROGRESS_NOTE_PDF_DOWNLOADED,
      entityType: "ProgressNote",
      entityId: progressNote.id,
      details: {
        residentName: progressNote.intake.residentName,
        noteDate: progressNote.noteDate.toISOString().slice(0, 10),
        facilityName: progressNote.facility.name,
        downloadedBy: session.user.name,
        downloadedByRole: session.user.role,
      },
    });

    const filename = progressNoteDocxFilename({
      residentName: progressNote.intake.residentName,
      noteDate: progressNote.noteDate,
      shift: progressNote.shift,
    });

    return new NextResponse(new Uint8Array(docxBuffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
      },
    });
  } catch (error) {
    console.error("Generate Progress Note DOCX error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    return NextResponse.json(
      { error: "Failed to generate document", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
