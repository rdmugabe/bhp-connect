import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const markReadSchema = z.object({
  notificationIds: z.array(z.string()).min(1),
  type: z.enum(["message", "intake", "document", "application", "credential"]),
});

// Extract actual ID from notification ID (e.g., "msg-abc123" -> "abc123")
function extractId(notificationId: string): string {
  const parts = notificationId.split("-");
  // Remove the prefix (msg, prescreen, doc, app, cred, etc.)
  parts.shift();
  return parts.join("-");
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = markReadSchema.parse(body);

    const userId = session.user.id;
    const { notificationIds, type } = validatedData;

    // Extract actual IDs from notification IDs
    const actualIds = notificationIds.map(extractId);

    // Handle different notification types
    switch (type) {
      case "message":
        // Mark messages as read
        await prisma.message.updateMany({
          where: {
            id: { in: actualIds },
            senderId: { not: userId },
            readAt: null,
          },
          data: {
            readAt: new Date(),
          },
        });
        break;

      case "intake":
        // Intakes don't have a read status - they're viewed when opened
        // Just return success as viewing the page is sufficient
        break;

      case "document":
        // Documents don't have a read status for the notification
        // The notification is considered "read" when the document is viewed
        break;

      case "application":
        // Applications are handled when reviewed
        break;

      case "credential":
        // Credentials don't have a read status for notifications
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Mark notification read error:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}
