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

    const userId = session.user.id;
    const role = session.user.role;

    let messages = 0;
    let applications = 0;
    let intakes = 0;
    let asam = 0;
    let meetings = 0;

    if (role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId },
      });

      if (bhpProfile) {
        // Count unread messages
        messages = await prisma.message.count({
          where: {
            facility: { bhpId: bhpProfile.id },
            senderId: { not: userId },
            readAt: null,
          },
        });

        // Count pending facility applications
        applications = await prisma.facilityApplication.count({
          where: {
            bhpId: bhpProfile.id,
            status: "PENDING",
          },
        });

        // Intakes no longer require approval - count is not needed
        intakes = 0;

        // ASAM assessments no longer require approval - count is not needed
        asam = 0;

        // Count upcoming meetings (within 24 hours)
        const tomorrow = new Date();
        tomorrow.setHours(tomorrow.getHours() + 24);
        meetings = await prisma.meeting.count({
          where: {
            facility: { bhpId: bhpProfile.id },
            status: { in: ["SCHEDULED", "IN_PROGRESS"] },
            scheduledAt: {
              gte: new Date(),
              lte: tomorrow,
            },
          },
        });
      }
    } else if (role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId },
      });

      if (bhrfProfile) {
        // Count unread messages
        messages = await prisma.message.count({
          where: {
            facilityId: bhrfProfile.facilityId,
            senderId: { not: userId },
            readAt: null,
          },
        });

        // Count upcoming meetings (within 24 hours)
        const tomorrow = new Date();
        tomorrow.setHours(tomorrow.getHours() + 24);
        meetings = await prisma.meeting.count({
          where: {
            facilityId: bhrfProfile.facilityId,
            status: { in: ["SCHEDULED", "IN_PROGRESS"] },
            scheduledAt: {
              gte: new Date(),
              lte: tomorrow,
            },
          },
        });
      }
    } else if (role === "ADMIN") {
      // Count pending BHP registrations
      applications = await prisma.user.count({
        where: {
          role: "BHP",
          approvalStatus: "PENDING",
        },
      });
    }

    return NextResponse.json({
      messages,
      applications,
      intakes,
      asam,
      meetings,
    });
  } catch (error) {
    console.error("Get notification counts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification counts" },
      { status: 500 }
    );
  }
}
