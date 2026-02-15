import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { messageSchema } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get("facilityId");

    let messages;

    if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile) {
        return NextResponse.json({ messages: [] });
      }

      // Get all facilities for this BHP
      const facilities = await prisma.facility.findMany({
        where: { bhpId: bhpProfile.id },
        select: { id: true },
      });

      const facilityIds = facilities.map((f) => f.id);

      messages = await prisma.message.findMany({
        where: {
          facilityId: facilityId
            ? { equals: facilityId }
            : { in: facilityIds },
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          readAt: true,
          sender: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          facility: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile) {
        return NextResponse.json({ messages: [] });
      }

      messages = await prisma.message.findMany({
        where: {
          facilityId: bhrfProfile.facilityId,
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          readAt: true,
          sender: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          facility: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { facilityId, ...validatedData } = body;

    messageSchema.parse(validatedData);

    // Verify access to facility
    if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      const facility = await prisma.facility.findUnique({
        where: { id: facilityId },
      });

      if (!facility || facility.bhpId !== bhpProfile?.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile || bhrfProfile.facilityId !== facilityId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const message = await prisma.message.create({
      data: {
        facilityId,
        senderId: session.user.id,
        content: validatedData.content,
        linkedType: validatedData.linkedType,
        linkedId: validatedData.linkedId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.MESSAGE_SENT,
      entityType: "Message",
      entityId: message.id,
      details: { facilityId },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Send message error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
