import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calendarEventSchema } from "@/lib/validations";
import { parseJsonBody } from "@/lib/api-utils";
import { calculateReminderTimes, addDays, addMonths } from "@/lib/calendar";

// Generate dates for recurring events
function generateRecurringDates(
  startDate: Date,
  recurrenceType: string,
  recurrenceDays: string[],
  recurrenceEndDate?: Date,
  maxOccurrences: number = 52 // Default to 1 year of weekly events
): Date[] {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);
  const endDate = recurrenceEndDate || addMonths(startDate, 6); // Default 6 months

  const dayMap: Record<string, number> = {
    SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6
  };

  while (currentDate <= endDate && dates.length < maxOccurrences) {
    switch (recurrenceType) {
      case "DAILY":
        dates.push(new Date(currentDate));
        currentDate = addDays(currentDate, 1);
        break;

      case "WEEKLY":
        // For weekly, add dates for each selected day
        if (recurrenceDays.length > 0) {
          const currentDayOfWeek = currentDate.getDay();
          for (const day of recurrenceDays) {
            const targetDay = dayMap[day];
            let daysToAdd = targetDay - currentDayOfWeek;
            if (daysToAdd < 0) daysToAdd += 7;
            const eventDate = addDays(currentDate, daysToAdd);
            if (eventDate >= startDate && eventDate <= endDate && dates.length < maxOccurrences) {
              // Avoid duplicates
              if (!dates.some(d => d.getTime() === eventDate.getTime())) {
                dates.push(eventDate);
              }
            }
          }
          currentDate = addDays(currentDate, 7);
        } else {
          dates.push(new Date(currentDate));
          currentDate = addDays(currentDate, 7);
        }
        break;

      case "BIWEEKLY":
        dates.push(new Date(currentDate));
        currentDate = addDays(currentDate, 14);
        break;

      case "MONTHLY":
        dates.push(new Date(currentDate));
        currentDate = addMonths(currentDate, 1);
        break;

      default:
        dates.push(new Date(currentDate));
        break;
    }
  }

  // Sort dates and remove duplicates
  return Array.from(new Set(dates.map(d => d.getTime()))).sort((a, b) => a - b).map(t => new Date(t));
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const intakeId = searchParams.get("intakeId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");

    let facilityId: string | null = null;

    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile) {
        return NextResponse.json({ events: [] });
      }

      facilityId = bhrfProfile.facilityId;
    } else if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile) {
        return NextResponse.json({ events: [] });
      }

      // BHP can see all events for their facilities
      const events = await prisma.calendarEvent.findMany({
        where: {
          facility: { bhpId: bhpProfile.id },
          ...(intakeId && { intakeId }),
          ...(status && { status }),
          ...(startDate &&
            endDate && {
              startDateTime: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            }),
        },
        include: {
          intake: {
            select: {
              id: true,
              residentName: true,
            },
          },
          facility: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { startDateTime: "asc" },
      });

      return NextResponse.json({ events });
    }

    if (!facilityId) {
      return NextResponse.json({ events: [] });
    }

    const events = await prisma.calendarEvent.findMany({
      where: {
        facilityId,
        ...(intakeId && { intakeId }),
        ...(status && { status }),
        ...(startDate &&
          endDate && {
            startDateTime: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }),
      },
      include: {
        intake: {
          select: {
            id: true,
            residentName: true,
          },
        },
        facility: {
          select: {
            id: true,
            name: true,
          },
        },
        reminders: {
          where: {
            isActive: true,
            acknowledgedAt: null,
          },
        },
      },
      orderBy: { startDateTime: "asc" },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Get calendar events error:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "BHRF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!bhrfProfile) {
      return NextResponse.json(
        { error: "Facility not assigned" },
        { status: 400 }
      );
    }

    const parseResult = await parseJsonBody<Record<string, unknown>>(request);
    if (!parseResult.success) {
      return parseResult.error;
    }

    const validatedData = calendarEventSchema.parse(parseResult.data);

    // Verify the intake belongs to the facility
    const intake = await prisma.intake.findUnique({
      where: { id: validatedData.intakeId },
    });

    if (!intake || intake.facilityId !== bhrfProfile.facilityId) {
      return NextResponse.json(
        { error: "Resident not found or unauthorized" },
        { status: 404 }
      );
    }

    const startDateTime = new Date(validatedData.startDateTime);
    const endDateTime = new Date(validatedData.endDateTime);
    const eventDuration = endDateTime.getTime() - startDateTime.getTime();

    // Handle recurring events
    if (validatedData.isRecurring && validatedData.recurrenceType) {
      const recurrenceEndDate = validatedData.recurrenceEndDate
        ? new Date(validatedData.recurrenceEndDate)
        : undefined;

      // Generate recurring dates
      const recurringDates = generateRecurringDates(
        startDateTime,
        validatedData.recurrenceType,
        validatedData.recurrenceDays || [],
        recurrenceEndDate
      );

      // Create parent event (first occurrence)
      const parentEvent = await prisma.calendarEvent.create({
        data: {
          facilityId: bhrfProfile.facilityId,
          intakeId: validatedData.intakeId,
          title: validatedData.title,
          description: validatedData.description,
          eventType: validatedData.eventType,
          location: validatedData.location,
          startDateTime,
          endDateTime,
          allDay: validatedData.allDay,
          color: validatedData.color,
          reminderMinutes: validatedData.reminderMinutes,
          isRecurring: true,
          recurrenceType: validatedData.recurrenceType,
          recurrenceEndDate: recurrenceEndDate,
          recurrenceDays: validatedData.recurrenceDays || [],
          createdBy: session.user.id,
          createdByName: session.user.name || "Unknown",
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

      // Create reminders for parent event
      if (validatedData.reminderMinutes.length > 0) {
        const reminderTimes = calculateReminderTimes(
          startDateTime,
          validatedData.reminderMinutes
        );
        await prisma.calendarReminder.createMany({
          data: reminderTimes.map((reminderTime) => ({
            eventId: parentEvent.id,
            reminderTime,
            isActive: true,
          })),
        });
      }

      // Create recurring instances (skip first date as that's the parent)
      const instanceDates = recurringDates.filter(d => d.getTime() !== startDateTime.getTime());

      for (const instanceDate of instanceDates) {
        const instanceEndDate = new Date(instanceDate.getTime() + eventDuration);

        const instance = await prisma.calendarEvent.create({
          data: {
            facilityId: bhrfProfile.facilityId,
            intakeId: validatedData.intakeId,
            title: validatedData.title,
            description: validatedData.description,
            eventType: validatedData.eventType,
            location: validatedData.location,
            startDateTime: instanceDate,
            endDateTime: instanceEndDate,
            allDay: validatedData.allDay,
            color: validatedData.color,
            reminderMinutes: validatedData.reminderMinutes,
            isRecurring: true,
            recurrenceType: validatedData.recurrenceType,
            recurrenceDays: validatedData.recurrenceDays || [],
            parentEventId: parentEvent.id,
            createdBy: session.user.id,
            createdByName: session.user.name || "Unknown",
          },
        });

        // Create reminders for each instance
        if (validatedData.reminderMinutes.length > 0) {
          const reminderTimes = calculateReminderTimes(
            instanceDate,
            validatedData.reminderMinutes
          );
          await prisma.calendarReminder.createMany({
            data: reminderTimes.map((reminderTime) => ({
              eventId: instance.id,
              reminderTime,
              isActive: true,
            })),
          });
        }
      }

      return NextResponse.json({
        event: parentEvent,
        instanceCount: instanceDates.length + 1
      }, { status: 201 });
    }

    // Create single (non-recurring) event
    const event = await prisma.calendarEvent.create({
      data: {
        facilityId: bhrfProfile.facilityId,
        intakeId: validatedData.intakeId,
        title: validatedData.title,
        description: validatedData.description,
        eventType: validatedData.eventType,
        location: validatedData.location,
        startDateTime,
        endDateTime,
        allDay: validatedData.allDay,
        color: validatedData.color,
        reminderMinutes: validatedData.reminderMinutes,
        isRecurring: false,
        createdBy: session.user.id,
        createdByName: session.user.name || "Unknown",
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

    // Create reminders if any reminder times were specified
    if (validatedData.reminderMinutes.length > 0) {
      const reminderTimes = calculateReminderTimes(
        startDateTime,
        validatedData.reminderMinutes
      );

      await prisma.calendarReminder.createMany({
        data: reminderTimes.map((reminderTime) => ({
          eventId: event.id,
          reminderTime,
          isActive: true,
        })),
      });
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Create calendar event error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create calendar event" },
      { status: 500 }
    );
  }
}
