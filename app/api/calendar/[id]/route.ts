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
    const { searchParams } = new URL(request.url);
    const updateSeries = searchParams.get("updateSeries") === "true";

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

    // Build update data (fields that don't change per-instance)
    const commonUpdateData: Record<string, unknown> = {};

    if (validatedData.intakeId !== undefined) commonUpdateData.intakeId = validatedData.intakeId;
    if (validatedData.title !== undefined) commonUpdateData.title = validatedData.title;
    if (validatedData.description !== undefined) commonUpdateData.description = validatedData.description;
    if (validatedData.eventType !== undefined) commonUpdateData.eventType = validatedData.eventType;
    if (validatedData.location !== undefined) commonUpdateData.location = validatedData.location;
    if (validatedData.allDay !== undefined) commonUpdateData.allDay = validatedData.allDay;
    if (validatedData.color !== undefined) commonUpdateData.color = validatedData.color;
    if (validatedData.reminderMinutes !== undefined) commonUpdateData.reminderMinutes = validatedData.reminderMinutes;
    if (validatedData.status !== undefined) {
      commonUpdateData.status = validatedData.status;
      if (validatedData.status === "CANCELLED") {
        commonUpdateData.cancelledAt = new Date();
        commonUpdateData.cancelReason = validatedData.cancelReason || null;
      }
    }

    // If updating entire series
    if (updateSeries && (existingEvent.isRecurring || existingEvent.parentEventId)) {
      const parentId = existingEvent.parentEventId || existingEvent.id;

      // Get all events in the series
      const seriesEvents = await prisma.calendarEvent.findMany({
        where: {
          OR: [
            { id: parentId },
            { parentEventId: parentId },
          ],
          facilityId: bhrfProfile.facilityId,
        },
        orderBy: { startDateTime: "asc" },
      });

      // Update all events in series with common fields
      await prisma.calendarEvent.updateMany({
        where: {
          OR: [
            { id: parentId },
            { parentEventId: parentId },
          ],
          facilityId: bhrfProfile.facilityId,
        },
        data: commonUpdateData,
      });

      // If reminder minutes were updated, recreate reminders for all events
      if (validatedData.reminderMinutes !== undefined) {
        // Delete existing reminders for all series events
        const eventIds = seriesEvents.map(e => e.id);
        await prisma.calendarReminder.deleteMany({
          where: { eventId: { in: eventIds } },
        });

        // Create new reminders for each event
        if (validatedData.reminderMinutes.length > 0) {
          for (const seriesEvent of seriesEvents) {
            const reminderTimes = calculateReminderTimes(
              seriesEvent.startDateTime,
              validatedData.reminderMinutes
            );

            await prisma.calendarReminder.createMany({
              data: reminderTimes.map((reminderTime) => ({
                eventId: seriesEvent.id,
                reminderTime,
                isActive: true,
              })),
            });
          }
        }
      }

      // Return the updated parent event
      const updatedEvent = await prisma.calendarEvent.findUnique({
        where: { id: parentId },
        include: {
          intake: {
            select: {
              id: true,
              residentName: true,
            },
          },
        },
      });

      return NextResponse.json({ event: updatedEvent, updatedSeries: true, count: seriesEvents.length });
    }

    // Single event update - include time changes
    const singleUpdateData = { ...commonUpdateData };
    if (validatedData.startDateTime !== undefined) singleUpdateData.startDateTime = new Date(validatedData.startDateTime);
    if (validatedData.endDateTime !== undefined) singleUpdateData.endDateTime = new Date(validatedData.endDateTime);

    const event = await prisma.calendarEvent.update({
      where: { id },
      data: singleUpdateData,
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
    const { searchParams } = new URL(request.url);
    const deleteSeries = searchParams.get("deleteSeries") === "true";

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

    // If deleting entire series
    if (deleteSeries && (existingEvent.isRecurring || existingEvent.parentEventId)) {
      // Find the parent event ID
      const parentId = existingEvent.parentEventId || existingEvent.id;

      // Delete all events in the series (children and parent)
      // First delete children (they reference parent)
      await prisma.calendarEvent.deleteMany({
        where: {
          parentEventId: parentId,
          facilityId: bhrfProfile.facilityId,
        },
      });

      // Then delete the parent
      await prisma.calendarEvent.delete({
        where: { id: parentId },
      });

      return NextResponse.json({ success: true, deletedSeries: true });
    }

    // Delete single event (reminders will be cascade deleted)
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
