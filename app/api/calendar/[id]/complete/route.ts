import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // Check event exists and belongs to facility
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (existingEvent.facilityId !== bhrfProfile.facilityId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (existingEvent.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: "Only scheduled events can be marked as completed" },
        { status: 400 }
      );
    }

    // Mark event as completed
    const event = await prisma.calendarEvent.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
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

    // Deactivate all reminders for this event
    await prisma.calendarReminder.updateMany({
      where: { eventId: id },
      data: { isActive: false },
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Complete calendar event error:", error);
    return NextResponse.json(
      { error: "Failed to complete calendar event" },
      { status: 500 }
    );
  }
}
