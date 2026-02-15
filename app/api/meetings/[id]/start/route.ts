import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit";

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

    if (meeting.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: "Meeting cannot be started - invalid status" },
        { status: 400 }
      );
    }

    const updatedMeeting = await prisma.meeting.update({
      where: { id: params.id },
      data: {
        status: "IN_PROGRESS",
        startedAt: new Date(),
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
      action: AuditActions.MEETING_STARTED,
      entityType: "Meeting",
      entityId: meeting.id,
      details: {
        title: meeting.title,
        startedAt: updatedMeeting.startedAt,
      },
    });

    return NextResponse.json({ meeting: updatedMeeting });
  } catch (error) {
    console.error("Start meeting error:", error);
    return NextResponse.json(
      { error: "Failed to start meeting" },
      { status: 500 }
    );
  }
}
