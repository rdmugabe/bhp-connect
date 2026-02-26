import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { skipArtMeetingSchema } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { parseJsonBody } from "@/lib/api-utils";

export async function POST(
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

    const parseResult = await parseJsonBody(request);
    if (!parseResult.success) {
      return parseResult.error;
    }
    const validatedData = skipArtMeetingSchema.parse(parseResult.data);

    const artMeeting = await prisma.aRTMeeting.update({
      where: { id },
      data: {
        isSkipped: true,
        skipReason: validatedData.skipReason,
        status: "APPROVED",
        submittedAt: new Date(),
        submittedBy: session.user.id,
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
      action: AuditActions.ART_MEETING_SKIPPED,
      entityType: "ARTMeeting",
      entityId: artMeeting.id,
      details: {
        residentName: artMeeting.intake.residentName,
        meetingMonth: artMeeting.meetingMonth,
        meetingYear: artMeeting.meetingYear,
        skipReason: validatedData.skipReason,
      },
    });

    return NextResponse.json({ artMeeting });
  } catch (error) {
    console.error("Skip ART meeting error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Skip reason must be at least 10 characters" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to skip ART meeting" },
      { status: 500 }
    );
  }
}
