import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calendarEventSchema } from "@/lib/validations";
import { parseJsonBody } from "@/lib/api-utils";
import { calculateReminderTimes } from "@/lib/calendar";

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

    // Create the event
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
