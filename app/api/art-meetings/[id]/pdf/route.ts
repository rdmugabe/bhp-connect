import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { ARTMeetingPDF } from "@/lib/pdf/art-meeting-template";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

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

    // Fetch the ART meeting with related data
    const artMeeting = await prisma.aRTMeeting.findUnique({
      where: { id },
      include: {
        intake: {
          select: {
            residentName: true,
            dateOfBirth: true,
            policyNumber: true,
            caseManagerName: true,
          },
        },
        facility: {
          select: {
            name: true,
            bhpId: true,
          },
        },
      },
    });

    if (!artMeeting) {
      return NextResponse.json(
        { error: "ART meeting not found" },
        { status: 404 }
      );
    }

    // Authorization check based on role
    if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (!bhpProfile || artMeeting.facility.bhpId !== bhpProfile.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (!bhrfProfile || artMeeting.facilityId !== bhrfProfile.facilityId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prepare PDF data
    const pdfData = {
      id: artMeeting.id,
      meetingMonth: artMeeting.meetingMonth,
      meetingYear: artMeeting.meetingYear,
      meetingDate: artMeeting.meetingDate?.toISOString() || null,
      meetingStartTime: artMeeting.meetingStartTime,
      meetingEndTime: artMeeting.meetingEndTime,
      status: artMeeting.status,
      isSkipped: artMeeting.isSkipped,
      skipReason: artMeeting.skipReason,
      residentName: artMeeting.intake.residentName,
      dateOfBirth: artMeeting.intake.dateOfBirth?.toISOString() || null,
      ahcccsId: artMeeting.intake.policyNumber,
      caseManagerName: artMeeting.intake.caseManagerName,
      facilityName: artMeeting.facility.name,
      dxCodes: artMeeting.dxCodes,
      presentDuringMeeting: artMeeting.presentDuringMeeting,
      absentDuringMeeting: artMeeting.absentDuringMeeting,
      focusOfMeeting: artMeeting.focusOfMeeting,
      resolutions: artMeeting.resolutions,
      strengths: artMeeting.strengths,
      barriers: artMeeting.barriers,
      whatHasWorked: artMeeting.whatHasWorked,
      whatHasNotWorked: artMeeting.whatHasNotWorked,
      goals: artMeeting.goals,
      concreteSteps: artMeeting.concreteSteps,
      progressIndicators: artMeeting.progressIndicators,
      medicalIssues: artMeeting.medicalIssues,
      plan: artMeeting.plan,
      summary: artMeeting.summary,
      notesTakenBy: artMeeting.notesTakenBy,
      submittedAt: artMeeting.submittedAt?.toISOString() || null,
      createdAt: artMeeting.createdAt.toISOString(),
    };

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      ARTMeetingPDF({ data: pdfData })
    );

    // Log the PDF download for HIPAA compliance
    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.ART_MEETING_PDF_DOWNLOADED,
      entityType: "ARTMeeting",
      entityId: artMeeting.id,
      details: {
        residentName: artMeeting.intake.residentName,
        meetingMonth: artMeeting.meetingMonth,
        meetingYear: artMeeting.meetingYear,
        facilityName: artMeeting.facility.name,
        downloadedBy: session.user.name,
        downloadedByRole: session.user.role,
      },
    });

    // Create filename
    const monthName = MONTH_NAMES[artMeeting.meetingMonth - 1];
    const residentNameSlug = artMeeting.intake.residentName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_");
    const filename = `art_meeting_${residentNameSlug}_${monthName}_${artMeeting.meetingYear}.pdf`;

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
    console.error("Generate ART Meeting PDF error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    return NextResponse.json(
      { error: "Failed to generate PDF", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
