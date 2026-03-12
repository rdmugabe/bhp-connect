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

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get the reminder with its event
    const reminder = await prisma.calendarReminder.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            facilityId: true,
            facility: {
              select: {
                bhpId: true,
              },
            },
          },
        },
      },
    });

    if (!reminder) {
      return NextResponse.json({ error: "Reminder not found" }, { status: 404 });
    }

    // Verify access
    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile || bhrfProfile.facilityId !== reminder.event.facilityId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile || reminder.event.facility.bhpId !== bhpProfile.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    // Acknowledge the reminder
    const updatedReminder = await prisma.calendarReminder.update({
      where: { id },
      data: {
        acknowledgedAt: new Date(),
        acknowledgedBy: session.user.id,
      },
    });

    return NextResponse.json({ reminder: updatedReminder });
  } catch (error) {
    console.error("Acknowledge calendar reminder error:", error);
    return NextResponse.json(
      { error: "Failed to acknowledge reminder" },
      { status: 500 }
    );
  }
}
