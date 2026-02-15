import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface Notification {
  id: string;
  type: "message" | "intake" | "document" | "application" | "credential" | "employee_document" | "meeting";
  title: string;
  description: string;
  link: string;
  createdAt: string;
  isRead: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifications: Notification[] = [];
    const userId = session.user.id;
    const role = session.user.role;

    if (role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId },
      });

      if (bhpProfile) {
        // Get pending facility applications
        const pendingApplications = await prisma.facilityApplication.findMany({
          where: {
            bhpId: bhpProfile.id,
            status: "PENDING",
          },
          include: {
            user: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        });

        pendingApplications.forEach((app) => {
          notifications.push({
            id: `app-${app.id}`,
            type: "application",
            title: "New Facility Application",
            description: `${app.user.name} has applied to register ${app.facilityName}`,
            link: `/bhp/applications/${app.id}`,
            createdAt: app.createdAt.toISOString(),
            isRead: false,
          });
        });

        // Get pending intakes
        const pendingIntakes = await prisma.intake.findMany({
          where: {
            facility: { bhpId: bhpProfile.id },
            status: "PENDING",
          },
          include: {
            facility: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        });

        pendingIntakes.forEach((intake) => {
          notifications.push({
            id: `intake-${intake.id}`,
            type: "intake",
            title: "Pending Intake Review",
            description: `${intake.residentName} from ${intake.facility.name}`,
            link: `/bhp/intakes/${intake.id}`,
            createdAt: intake.createdAt.toISOString(),
            isRead: false,
          });
        });

        // Get unread messages for BHP
        const unreadMessages = await prisma.message.findMany({
          where: {
            facility: { bhpId: bhpProfile.id },
            senderId: { not: userId },
            readAt: null,
          },
          include: {
            facility: { select: { name: true } },
            sender: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        });

        unreadMessages.forEach((msg) => {
          notifications.push({
            id: `msg-${msg.id}`,
            type: "message",
            title: "New Message",
            description: `${msg.sender.name} from ${msg.facility.name}`,
            link: `/bhp/messages?facility=${msg.facilityId}`,
            createdAt: msg.createdAt.toISOString(),
            isRead: false,
          });
        });

        // Get expiring credentials (within 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const today = new Date();

        const expiringCredentials = await prisma.credential.findMany({
          where: {
            bhpId: bhpProfile.id,
            expiresAt: {
              gte: today,
              lte: thirtyDaysFromNow,
            },
          },
          orderBy: { expiresAt: "asc" },
          take: 3,
        });

        expiringCredentials.forEach((cred) => {
          notifications.push({
            id: `cred-${cred.id}`,
            type: "credential",
            title: "Credential Expiring Soon",
            description: `${cred.name} expires on ${cred.expiresAt?.toLocaleDateString()}`,
            link: `/bhp/credentials`,
            createdAt: cred.uploadedAt.toISOString(),
            isRead: false,
          });
        });

        // Get requested documents from facilities
        const requestedDocs = await prisma.document.findMany({
          where: {
            facility: { bhpId: bhpProfile.id },
            status: "UPLOADED",
          },
          include: {
            facility: { select: { name: true } },
          },
          orderBy: { uploadedAt: "desc" },
          take: 5,
        });

        requestedDocs.forEach((doc) => {
          notifications.push({
            id: `doc-${doc.id}`,
            type: "document",
            title: "Document Uploaded",
            description: `${doc.name} uploaded by ${doc.facility.name}`,
            link: `/bhp/documents`,
            createdAt: doc.uploadedAt?.toISOString() || new Date().toISOString(),
            isRead: false,
          });
        });

        // Get upcoming meetings (within 24 hours)
        const tomorrow = new Date();
        tomorrow.setHours(tomorrow.getHours() + 24);
        const upcomingMeetings = await prisma.meeting.findMany({
          where: {
            facility: { bhpId: bhpProfile.id },
            status: { in: ["SCHEDULED", "IN_PROGRESS"] },
            scheduledAt: {
              gte: new Date(),
              lte: tomorrow,
            },
          },
          include: {
            facility: { select: { name: true } },
          },
          orderBy: { scheduledAt: "asc" },
          take: 5,
        });

        upcomingMeetings.forEach((meeting) => {
          const isInProgress = meeting.status === "IN_PROGRESS";
          notifications.push({
            id: `meeting-${meeting.id}`,
            type: "meeting",
            title: isInProgress ? "Meeting In Progress" : "Upcoming Meeting",
            description: `${meeting.title} with ${meeting.facility.name}`,
            link: `/bhp/meetings/${meeting.id}`,
            createdAt: meeting.scheduledAt.toISOString(),
            isRead: false,
          });
        });
      }
    } else if (role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId },
      });

      if (bhrfProfile) {
        // Get intake decisions (non-pending)
        const recentDecisions = await prisma.intake.findMany({
          where: {
            facilityId: bhrfProfile.facilityId,
            status: { not: "PENDING" },
            decidedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
          orderBy: { decidedAt: "desc" },
          take: 5,
        });

        recentDecisions.forEach((intake) => {
          const statusText =
            intake.status === "APPROVED"
              ? "approved"
              : intake.status === "CONDITIONAL"
              ? "conditionally approved"
              : "denied";
          notifications.push({
            id: `intake-decision-${intake.id}`,
            type: "intake",
            title: `Intake ${intake.status === "APPROVED" ? "Approved" : intake.status === "CONDITIONAL" ? "Conditionally Approved" : "Denied"}`,
            description: `${intake.residentName} has been ${statusText}`,
            link: `/facility/intakes/${intake.id}`,
            createdAt: intake.decidedAt?.toISOString() || new Date().toISOString(),
            isRead: false,
          });
        });

        // Get unread messages from BHP
        const unreadMessages = await prisma.message.findMany({
          where: {
            facilityId: bhrfProfile.facilityId,
            senderId: { not: userId },
            readAt: null,
          },
          include: {
            sender: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        });

        unreadMessages.forEach((msg) => {
          notifications.push({
            id: `msg-${msg.id}`,
            type: "message",
            title: "New Message from BHP",
            description: `${msg.sender.name}: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? "..." : ""}`,
            link: `/facility/messages`,
            createdAt: msg.createdAt.toISOString(),
            isRead: false,
          });
        });

        // Get document requests
        const documentRequests = await prisma.document.findMany({
          where: {
            facilityId: bhrfProfile.facilityId,
            status: "REQUESTED",
          },
          orderBy: { requestedAt: "desc" },
          take: 5,
        });

        documentRequests.forEach((doc) => {
          notifications.push({
            id: `doc-request-${doc.id}`,
            type: "document",
            title: "Document Requested",
            description: `Please upload: ${doc.name}`,
            link: `/facility/documents`,
            createdAt: doc.requestedAt?.toISOString() || new Date().toISOString(),
            isRead: false,
          });
        });

        // Get expiring employee documents (within 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const today = new Date();

        const expiringEmployeeDocs = await prisma.employeeDocument.findMany({
          where: {
            employee: {
              facilityId: bhrfProfile.facilityId,
              isActive: true,
            },
            noExpiration: false,
            expiresAt: {
              gte: today,
              lte: thirtyDaysFromNow,
            },
          },
          include: {
            employee: { select: { firstName: true, lastName: true } },
            documentType: { select: { name: true } },
          },
          orderBy: { expiresAt: "asc" },
          take: 5,
        });

        expiringEmployeeDocs.forEach((doc) => {
          notifications.push({
            id: `emp-doc-expiring-${doc.id}`,
            type: "employee_document",
            title: "Employee Document Expiring",
            description: `${doc.employee.firstName} ${doc.employee.lastName}'s ${doc.documentType.name} expires on ${doc.expiresAt?.toLocaleDateString()}`,
            link: `/facility/employees/${doc.employeeId}`,
            createdAt: doc.uploadedAt.toISOString(),
            isRead: false,
          });
        });

        // Get expired employee documents
        const expiredEmployeeDocs = await prisma.employeeDocument.findMany({
          where: {
            employee: {
              facilityId: bhrfProfile.facilityId,
              isActive: true,
            },
            noExpiration: false,
            expiresAt: {
              lt: today,
            },
          },
          include: {
            employee: { select: { firstName: true, lastName: true } },
            documentType: { select: { name: true } },
          },
          orderBy: { expiresAt: "desc" },
          take: 5,
        });

        expiredEmployeeDocs.forEach((doc) => {
          notifications.push({
            id: `emp-doc-expired-${doc.id}`,
            type: "employee_document",
            title: "Employee Document Expired",
            description: `${doc.employee.firstName} ${doc.employee.lastName}'s ${doc.documentType.name} has expired`,
            link: `/facility/employees/${doc.employeeId}`,
            createdAt: doc.expiresAt?.toISOString() || new Date().toISOString(),
            isRead: false,
          });
        });

        // Get upcoming meetings (within 24 hours)
        const tomorrow = new Date();
        tomorrow.setHours(tomorrow.getHours() + 24);
        const upcomingMeetings = await prisma.meeting.findMany({
          where: {
            facilityId: bhrfProfile.facilityId,
            status: { in: ["SCHEDULED", "IN_PROGRESS"] },
            scheduledAt: {
              gte: new Date(),
              lte: tomorrow,
            },
          },
          orderBy: { scheduledAt: "asc" },
          take: 5,
        });

        upcomingMeetings.forEach((meeting) => {
          const isInProgress = meeting.status === "IN_PROGRESS";
          notifications.push({
            id: `meeting-${meeting.id}`,
            type: "meeting",
            title: isInProgress ? "Meeting In Progress" : "Upcoming Meeting",
            description: `${meeting.title}`,
            link: `/facility/meetings/${meeting.id}`,
            createdAt: meeting.scheduledAt.toISOString(),
            isRead: false,
          });
        });
      }
    } else if (role === "ADMIN") {
      // Get pending BHP registrations
      const pendingUsers = await prisma.user.findMany({
        where: {
          role: "BHP",
          approvalStatus: "PENDING",
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      pendingUsers.forEach((user) => {
        notifications.push({
          id: `user-pending-${user.id}`,
          type: "application",
          title: "Pending BHP Registration",
          description: `${user.name} (${user.email}) is awaiting approval`,
          link: `/admin/users/${user.id}`,
          createdAt: user.createdAt.toISOString(),
          isRead: false,
        });
      });
    }

    // Sort by date
    notifications.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Get unread message count separately
    let unreadMessageCount = 0;
    if (role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId },
      });
      if (bhpProfile) {
        unreadMessageCount = await prisma.message.count({
          where: {
            facility: { bhpId: bhpProfile.id },
            senderId: { not: userId },
            readAt: null,
          },
        });
      }
    } else if (role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId },
      });
      if (bhrfProfile) {
        unreadMessageCount = await prisma.message.count({
          where: {
            facilityId: bhrfProfile.facilityId,
            senderId: { not: userId },
            readAt: null,
          },
        });
      }
    }

    return NextResponse.json({
      notifications: notifications.slice(0, 20),
      unreadMessageCount,
      totalCount: notifications.length,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
