import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { meetingUpdateSchema } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const meeting = await prisma.meeting.findUnique({
      where: { id: params.id },
      include: {
        facility: {
          include: {
            bhp: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: "Meeting not found" },
        { status: 404 }
      );
    }

    // Authorization check
    if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (meeting.facility.bhpId !== bhpProfile?.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (meeting.facilityId !== bhrfProfile?.facilityId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({ meeting });
  } catch (error) {
    console.error("Get meeting error:", error);
    return NextResponse.json(
      { error: "Failed to fetch meeting" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const body = await request.json();
    const validatedData = meetingUpdateSchema.parse(body);

    // Check if meeting is being cancelled
    const isCancelling = validatedData.status === "CANCELLED" && meeting.status !== "CANCELLED";

    const updatedMeeting = await prisma.meeting.update({
      where: { id: params.id },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.scheduledAt && { scheduledAt: new Date(validatedData.scheduledAt) }),
        ...(validatedData.duration && { duration: validatedData.duration }),
        ...(validatedData.meetingUrl !== undefined && { meetingUrl: validatedData.meetingUrl || null }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
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
      action: isCancelling ? AuditActions.MEETING_CANCELLED : AuditActions.MEETING_UPDATED,
      entityType: "Meeting",
      entityId: meeting.id,
      details: {
        title: meeting.title,
        changes: validatedData,
      },
    });

    return NextResponse.json({ meeting: updatedMeeting });
  } catch (error) {
    console.error("Update meeting error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update meeting" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Soft delete - mark as cancelled instead of deleting
    const cancelledMeeting = await prisma.meeting.update({
      where: { id: params.id },
      data: {
        status: "CANCELLED",
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.MEETING_CANCELLED,
      entityType: "Meeting",
      entityId: meeting.id,
      details: {
        title: meeting.title,
      },
    });

    return NextResponse.json({ meeting: cancelledMeeting });
  } catch (error) {
    console.error("Delete meeting error:", error);
    return NextResponse.json(
      { error: "Failed to delete meeting" },
      { status: 500 }
    );
  }
}
