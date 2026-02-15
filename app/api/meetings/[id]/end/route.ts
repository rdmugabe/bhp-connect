import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { z } from "zod";

const endMeetingSchema = z.object({
  notes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "BHP") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bhpProfile = await prisma.bHPProfile.findUnique({
      where: { userId: session.user.id },
    });

    const meeting = await prisma.meeting.findUnique({
      where: { id: params.id },
      include: {
        facility: true,
      },
    });

    if (!meeting || meeting.facility.bhpId !== bhpProfile?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (meeting.status !== "IN_PROGRESS" && meeting.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: "Meeting cannot be ended - invalid status" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = endMeetingSchema.parse(body);

    const updatedMeeting = await prisma.meeting.update({
      where: { id: params.id },
      data: {
        status: "COMPLETED",
        endedAt: new Date(),
        ...(validatedData.notes && { notes: validatedData.notes }),
      },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.MEETING_ENDED,
      entityType: "Meeting",
      entityId: meeting.id,
      details: {
        title: meeting.title,
        endedAt: updatedMeeting.endedAt,
        hasNotes: !!validatedData.notes,
      },
    });

    return NextResponse.json({ meeting: updatedMeeting });
  } catch (error) {
    console.error("End meeting error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to end meeting" },
      { status: 500 }
    );
  }
}
