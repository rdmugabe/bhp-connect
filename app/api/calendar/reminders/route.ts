import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let facilityId: string | null = null;

    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile) {
        return NextResponse.json({ reminders: [], count: 0 });
      }

      facilityId = bhrfProfile.facilityId;
    } else if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile) {
        return NextResponse.json({ reminders: [], count: 0 });
      }

      // BHP can see all reminders for their facilities
      const reminders = await prisma.calendarReminder.findMany({
        where: {
          event: {
            facility: { bhpId: bhpProfile.id },
            status: "SCHEDULED",
          },
          isActive: true,
          reminderTime: { lte: new Date() },
          acknowledgedAt: null,
        },
        include: {
          event: {
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
          },
        },
        orderBy: { reminderTime: "asc" },
      });

      return NextResponse.json({
        reminders,
        count: reminders.length,
      });
    }

    if (!facilityId) {
      return NextResponse.json({ reminders: [], count: 0 });
    }

    // Get active reminders that are due
    const reminders = await prisma.calendarReminder.findMany({
      where: {
        event: {
          facilityId,
          status: "SCHEDULED",
        },
        isActive: true,
        reminderTime: { lte: new Date() },
        acknowledgedAt: null,
      },
      include: {
        event: {
          include: {
            intake: {
              select: {
                id: true,
                residentName: true,
              },
            },
          },
        },
      },
      orderBy: { reminderTime: "asc" },
    });

    return NextResponse.json({
      reminders,
      count: reminders.length,
    });
  } catch (error) {
    console.error("Get calendar reminders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar reminders" },
      { status: 500 }
    );
  }
}
