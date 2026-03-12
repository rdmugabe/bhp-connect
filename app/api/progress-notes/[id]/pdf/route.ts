import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { ProgressNotePDF } from "@/lib/pdf/progress-note-template";
import { formatISODateOnly } from "@/lib/date-utils";

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

    // Fetch the progress note with authorization check
    const progressNote = await prisma.progressNote.findUnique({
      where: { id },
      include: {
        facility: {
          include: {
            bhp: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        intake: {
          select: {
            residentName: true,
            dateOfBirth: true,
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

    // Authorization check based on role
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

    // Prepare PDF data
    const pdfData = {
      // Resident Info
      residentName: progressNote.intake.residentName,
      dateOfBirth: progressNote.intake.dateOfBirth?.toISOString() || "",

      // Facility Info
      facilityName: progressNote.facility.name,

      // Note Metadata
      noteDate: progressNote.noteDate.toISOString(),
      shift: progressNote.shift || undefined,
      authorName: progressNote.authorName,
      authorTitle: progressNote.authorTitle || undefined,
      status: progressNote.status,

      // Staff Observations
      residentStatus: progressNote.residentStatus || undefined,
      observedBehaviors: progressNote.observedBehaviors || undefined,
      moodAffect: progressNote.moodAffect || undefined,
      activityParticipation: progressNote.activityParticipation || undefined,
      staffInteractions: progressNote.staffInteractions || undefined,
      peerInteractions: progressNote.peerInteractions || undefined,
      medicationCompliance: progressNote.medicationCompliance || undefined,
      hygieneAdl: progressNote.hygieneAdl || undefined,
      mealsAppetite: progressNote.mealsAppetite || undefined,
      sleepPattern: progressNote.sleepPattern || undefined,
      staffInterventions: progressNote.staffInterventions || undefined,
      residentResponse: progressNote.residentResponse || undefined,
      notableEvents: progressNote.notableEvents || undefined,
      additionalNotes: progressNote.additionalNotes || undefined,

      // AI Generated
      generatedNote: progressNote.generatedNote || undefined,
      riskFlagsDetected: progressNote.riskFlagsDetected || undefined,

      // BHT Signature
      bhtSignature: progressNote.bhtSignature || undefined,
      bhtCredentials: progressNote.bhtCredentials || undefined,
      bhtSignatureDate: progressNote.bhtSignatureDate?.toISOString() || undefined,

      // Timestamps
      createdAt: progressNote.createdAt.toISOString(),
      submittedAt: progressNote.submittedAt?.toISOString() || undefined,
    };

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      ProgressNotePDF({ data: pdfData })
    );

    // Log the PDF download for HIPAA compliance
    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.PROGRESS_NOTE_PDF_DOWNLOADED,
      entityType: "ProgressNote",
      entityId: progressNote.id,
      details: {
        residentName: progressNote.intake.residentName,
        noteDate: formatISODateOnly(progressNote.noteDate),
        facilityName: progressNote.facility.name,
        downloadedBy: session.user.name,
        downloadedByRole: session.user.role,
      },
    });

    // Create filename
    const dateStr = formatISODateOnly(progressNote.noteDate);
    const residentName = progressNote.intake.residentName
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 20);
    const filename = `progress_note_${residentName}_${dateStr}.pdf`;

    // Return PDF response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
      },
    });
  } catch (error) {
    console.error("Generate Progress Note PDF error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    return NextResponse.json(
      { error: "Failed to generate PDF", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
