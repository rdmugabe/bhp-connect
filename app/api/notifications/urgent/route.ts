import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface UrgentNotification {
  id: string;
  type: "warning" | "info" | "urgent";
  message: string;
  link?: string;
  linkText?: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const role = session.user.role;
    const notifications: UrgentNotification[] = [];

    if (role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId },
      });

      if (bhpProfile) {
        // Check for pending facility applications
        const pendingApplicationsCount = await prisma.facilityApplication.count({
          where: {
            bhpId: bhpProfile.id,
            status: "PENDING",
          },
        });

        if (pendingApplicationsCount > 0) {
          notifications.push({
            id: "pending-applications",
            type: "warning",
            message: `You have ${pendingApplicationsCount} pending facility application${pendingApplicationsCount > 1 ? "s" : ""} awaiting review.`,
            link: "/bhp/applications",
            linkText: "Review now",
          });
        }

        // Check for expired credentials
        const expiredCredentials = await prisma.credential.count({
          where: {
            bhpId: bhpProfile.id,
            expiresAt: { lt: new Date() },
          },
        });

        if (expiredCredentials > 0) {
          notifications.push({
            id: "expired-credentials",
            type: "urgent",
            message: `You have ${expiredCredentials} expired credential${expiredCredentials > 1 ? "s" : ""} that need${expiredCredentials === 1 ? "s" : ""} immediate attention.`,
            link: "/bhp/credentials",
            linkText: "Update credentials",
          });
        }

        // Check for unread messages (more than 5)
        const unreadMessages = await prisma.message.count({
          where: {
            facility: { bhpId: bhpProfile.id },
            senderId: { not: userId },
            readAt: null,
          },
        });

        if (unreadMessages > 5) {
          notifications.push({
            id: "unread-messages",
            type: "info",
            message: `You have ${unreadMessages} unread messages from your facilities.`,
            link: "/bhp/messages",
            linkText: "View messages",
          });
        }
      }
    } else if (role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId },
      });

      if (bhrfProfile) {
        // Check for requested documents
        const requestedDocs = await prisma.document.count({
          where: {
            facilityId: bhrfProfile.facilityId,
            status: "REQUESTED",
          },
        });

        if (requestedDocs > 0) {
          notifications.push({
            id: "requested-docs",
            type: "warning",
            message: `Your BHP has requested ${requestedDocs} document${requestedDocs > 1 ? "s" : ""}.`,
            link: "/facility/documents",
            linkText: "Upload now",
          });
        }

        // Check for expiring documents
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        const expiringDocs = await prisma.document.count({
          where: {
            facilityId: bhrfProfile.facilityId,
            expiresAt: {
              gte: new Date(),
              lte: sevenDaysFromNow,
            },
            status: { not: "REQUESTED" },
          },
        });

        if (expiringDocs > 0) {
          notifications.push({
            id: "expiring-docs",
            type: "urgent",
            message: `${expiringDocs} document${expiringDocs > 1 ? "s" : ""} will expire within 7 days.`,
            link: "/facility/documents",
            linkText: "Review",
          });
        }

        // Check for unread messages from BHP
        const unreadMessages = await prisma.message.count({
          where: {
            facilityId: bhrfProfile.facilityId,
            senderId: { not: userId },
            readAt: null,
          },
        });

        if (unreadMessages > 0) {
          notifications.push({
            id: "unread-messages-bhrf",
            type: "info",
            message: `You have ${unreadMessages} unread message${unreadMessages > 1 ? "s" : ""} from your BHP.`,
            link: "/facility/messages",
            linkText: "View",
          });
        }
      }
    } else if (role === "ADMIN") {
      // Check for pending BHP registrations
      const pendingBHPs = await prisma.user.count({
        where: {
          role: "BHP",
          approvalStatus: "PENDING",
        },
      });

      if (pendingBHPs > 0) {
        notifications.push({
          id: "pending-bhps",
          type: "warning",
          message: `${pendingBHPs} BHP registration${pendingBHPs > 1 ? "s" : ""} awaiting approval.`,
          link: "/admin/users/pending",
          linkText: "Review",
        });
      }
    }

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Get urgent notifications error:", error);
    return NextResponse.json(
      { error: "Failed to fetch urgent notifications" },
      { status: 500 }
    );
  }
}
