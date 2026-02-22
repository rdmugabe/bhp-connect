import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { artMeetingSchema, artMeetingDraftSchema } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";

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

    const artMeeting = await prisma.aRTMeeting.findUnique({
      where: { id },
      include: {
        intake: {
          select: {
            id: true,
            residentName: true,
            dateOfBirth: true,
            policyNumber: true,
            ahcccsHealthPlan: true,
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

    if (!artMeeting) {
      return NextResponse.json({ error: "ART meeting not found" }, { status: 404 });
    }

    // Check authorization
    if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile || artMeeting.facility.bhpId !== bhpProfile.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile || artMeeting.facilityId !== bhrfProfile.facilityId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ artMeeting });
  } catch (error) {
    console.error("Get ART meeting error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ART meeting" },
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

    const existingMeeting = await prisma.aRTMeeting.findUnique({
      where: { id },
      include: {
        intake: {
          select: {
            residentName: true,
          },
        },
      },
    });

    if (!existingMeeting) {
      return NextResponse.json({ error: "ART meeting not found" }, { status: 404 });
    }

    if (existingMeeting.facilityId !== bhrfProfile.facilityId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { isDraft, ...meetingData } = body;

    // Use appropriate schema based on draft status
    const validatedData = isDraft
      ? artMeetingDraftSchema.parse(meetingData)
      : artMeetingSchema.parse(meetingData);

    const artMeeting = await prisma.aRTMeeting.update({
      where: { id },
      data: {
        meetingDate: validatedData.meetingDate ? new Date(validatedData.meetingDate) : null,
        dxCodes: validatedData.dxCodes,
        presentDuringMeeting: validatedData.presentDuringMeeting || [],
        absentDuringMeeting: validatedData.absentDuringMeeting || [],
        focusOfMeeting: validatedData.focusOfMeeting,
        resolutions: validatedData.resolutions,
        strengths: validatedData.strengths,
        barriers: validatedData.barriers,
        whatHasWorked: validatedData.whatHasWorked,
        whatHasNotWorked: validatedData.whatHasNotWorked,
        goals: validatedData.goals,
        concreteSteps: validatedData.concreteSteps,
        progressIndicators: validatedData.progressIndicators,
        medicalIssues: validatedData.medicalIssues,
        plan: validatedData.plan,
        notesTakenBy: validatedData.notesTakenBy,
        meetingStartTime: validatedData.meetingStartTime,
        meetingEndTime: validatedData.meetingEndTime,
        status: isDraft ? "DRAFT" : "APPROVED",
        submittedAt: isDraft ? existingMeeting.submittedAt : new Date(),
        isSkipped: false,
        skipReason: null,
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
      action: isDraft ? AuditActions.ART_MEETING_UPDATED : AuditActions.ART_MEETING_SUBMITTED,
      entityType: "ARTMeeting",
      entityId: artMeeting.id,
      details: {
        residentName: artMeeting.intake.residentName,
        meetingMonth: artMeeting.meetingMonth,
        meetingYear: artMeeting.meetingYear,
        isDraft,
      },
    });

    return NextResponse.json({ artMeeting });
  } catch (error) {
    console.error("Update ART meeting error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update ART meeting" },
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

    const existingMeeting = await prisma.aRTMeeting.findUnique({
      where: { id },
      include: {
        intake: {
          select: {
            residentName: true,
          },
        },
      },
    });

    if (!existingMeeting) {
      return NextResponse.json({ error: "ART meeting not found" }, { status: 404 });
    }

    if (existingMeeting.facilityId !== bhrfProfile.facilityId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.aRTMeeting.delete({
      where: { id },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.ART_MEETING_DELETED,
      entityType: "ARTMeeting",
      entityId: id,
      details: {
        residentName: existingMeeting.intake.residentName,
        meetingMonth: existingMeeting.meetingMonth,
        meetingYear: existingMeeting.meetingYear,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete ART meeting error:", error);
    return NextResponse.json(
      { error: "Failed to delete ART meeting" },
      { status: 500 }
    );
  }
}
