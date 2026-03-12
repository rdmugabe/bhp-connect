import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calendarEventUpdateSchema } from "@/lib/validations";
import { parseJsonBody } from "@/lib/api-utils";
import { calculateReminderTimes } from "@/lib/calendar";

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

    const event = await prisma.calendarEvent.findUnique({
      where: { id },
      include: {
        intake: {
          select: {
            id: true,
            residentName: true,
            dateOfBirth: true,
          },
        },
        facility: {
          select: {
            id: true,
            name: true,
          },
        },
        reminders: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Verify access
    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile || bhrfProfile.facilityId !== event.facilityId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      const facility = await prisma.facility.findUnique({
        where: { id: event.facilityId },
      });

      if (!bhpProfile || facility?.bhpId !== bhpProfile.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Get calendar event error:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar event" },
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

    const parseResult = await parseJsonBody<Record<string, unknown>>(request);
    if (!parseResult.success) {
      return parseResult.error;
    }

    const validatedData = calendarEventUpdateSchema.parse(parseResult.data);

    // If intakeId is being changed, verify it belongs to the facility
    if (validatedData.intakeId) {
      const intake = await prisma.intake.findUnique({
        where: { id: validatedData.intakeId },
      });

      if (!intake || intake.facilityId !== bhrfProfile.facilityId) {
        return NextResponse.json(
          { error: "Resident not found or unauthorized" },
          { status: 404 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (validatedData.intakeId !== undefined) updateData.intakeId = validatedData.intakeId;
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.eventType !== undefined) updateData.eventType = validatedData.eventType;
    if (validatedData.location !== undefined) updateData.location = validatedData.location;
    if (validatedData.startDateTime !== undefined) updateData.startDateTime = new Date(validatedData.startDateTime);
    if (validatedData.endDateTime !== undefined) updateData.endDateTime = new Date(validatedData.endDateTime);
    if (validatedData.allDay !== undefined) updateData.allDay = validatedData.allDay;
    if (validatedData.color !== undefined) updateData.color = validatedData.color;
    if (validatedData.reminderMinutes !== undefined) updateData.reminderMinutes = validatedData.reminderMinutes;
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
      if (validatedData.status === "CANCELLED") {
        updateData.cancelledAt = new Date();
        updateData.cancelReason = validatedData.cancelReason || null;
      }
    }

    const event = await prisma.calendarEvent.update({
      where: { id },
      data: updateData,
      include: {
        intake: {
          select: {
            id: true,
            residentName: true,
          },
        },
      },
    });

    // If reminder minutes were updated, recreate reminders
    if (validatedData.reminderMinutes !== undefined) {
      // Delete existing reminders
      await prisma.calendarReminder.deleteMany({
        where: { eventId: id },
      });

      // Create new reminders
      if (validatedData.reminderMinutes.length > 0) {
        const startDateTime = validatedData.startDateTime
          ? new Date(validatedData.startDateTime)
          : existingEvent.startDateTime;

        const reminderTimes = calculateReminderTimes(
          startDateTime,
          validatedData.reminderMinutes
        );

        await prisma.calendarReminder.createMany({
          data: reminderTimes.map((reminderTime) => ({
            eventId: id,
            reminderTime,
            isActive: true,
          })),
        });
      }
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Update calendar event error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update calendar event" },
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

    // Delete the event (reminders will be cascade deleted)
    await prisma.calendarEvent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete calendar event error:", error);
    return NextResponse.json(
      { error: "Failed to delete calendar event" },
      { status: 500 }
    );
  }
}
