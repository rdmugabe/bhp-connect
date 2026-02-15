import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const markReadSchema = z.object({
  messageIds: z.array(z.string()).min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = markReadSchema.parse(body);

    const userId = session.user.id;

    // Update messages as read - only messages the user has access to
    // and that weren't sent by the user themselves
    await prisma.message.updateMany({
      where: {
        id: { in: validatedData.messageIds },
        senderId: { not: userId },
        readAt: null,
        OR: [
          // BHP can read messages from their facilities
          {
            facility: {
              bhp: {
                userId: userId,
              },
            },
          },
          // BHRF can read messages for their facility
          {
            facility: {
              owner: {
                userId: userId,
              },
            },
          },
        ],
      },
      data: {
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Mark messages read error:", error);
    return NextResponse.json(
      { error: "Failed to mark messages as read" },
      { status: 500 }
    );
  }
}

// Mark all messages as read for current user
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const role = session.user.role;

    if (role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId },
      });

      if (bhpProfile) {
        await prisma.message.updateMany({
          where: {
            facility: { bhpId: bhpProfile.id },
            senderId: { not: userId },
            readAt: null,
          },
          data: {
            readAt: new Date(),
          },
        });
      }
    } else if (role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId },
      });

      if (bhrfProfile) {
        await prisma.message.updateMany({
          where: {
            facilityId: bhrfProfile.facilityId,
            senderId: { not: userId },
            readAt: null,
          },
          data: {
            readAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark all messages read error:", error);
    return NextResponse.json(
      { error: "Failed to mark messages as read" },
      { status: 500 }
    );
  }
}
