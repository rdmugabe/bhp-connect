import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentBiWeekInfo } from "@/lib/utils";
import { getCurrentArizonaMonthAndYear } from "@/lib/date-utils";

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
    let adminTasks = 0;
    let artMeetings = 0;
    let certificationIssues = 0;

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

        // Count missing fire drill reports for current month (use Arizona timezone)
        const now = new Date();
        const { month: currentMonth, year: currentYear } = getCurrentArizonaMonthAndYear();

        const fireDrillReports = await prisma.fireDrillReport.findMany({
          where: {
            facilityId: bhrfProfile.facilityId,
            reportMonth: currentMonth,
            reportYear: currentYear,
          },
          select: { shift: true },
        });

        const hasAMReport = fireDrillReports.some((r) => r.shift === "AM");
        const hasPMReport = fireDrillReports.some((r) => r.shift === "PM");

        // Count missing fire drill reports (0, 1, or 2)
        const missingFireDrills = (!hasAMReport ? 1 : 0) + (!hasPMReport ? 1 : 0);

        // Count missing evacuation/disaster drills
        const evacuationDrillReports = await prisma.evacuationDrillReport.findMany({
          where: {
            facilityId: bhrfProfile.facilityId,
            year: currentYear,
          },
          select: { drillType: true, quarter: true, shift: true },
        });

        // Calculate current quarter (using Arizona timezone month)
        const arizonaMonth = currentMonth - 1; // Convert to 0-indexed for quarter calculation
        const currentQuarter = arizonaMonth < 3 ? "Q1" : arizonaMonth < 6 ? "Q2" : arizonaMonth < 9 ? "Q3" : "Q4";

        // Check evacuation drills (every 6 months = H1 and H2, with AM and PM shifts)
        const inH1 = currentQuarter === "Q1" || currentQuarter === "Q2";
        const inH2 = currentQuarter === "Q3" || currentQuarter === "Q4";

        const hasEvacuationH1AM = evacuationDrillReports.some(
          (r) => r.drillType === "EVACUATION" && (r.quarter === "Q1" || r.quarter === "Q2") && r.shift === "AM"
        );
        const hasEvacuationH1PM = evacuationDrillReports.some(
          (r) => r.drillType === "EVACUATION" && (r.quarter === "Q1" || r.quarter === "Q2") && r.shift === "PM"
        );
        const hasEvacuationH2AM = evacuationDrillReports.some(
          (r) => r.drillType === "EVACUATION" && (r.quarter === "Q3" || r.quarter === "Q4") && r.shift === "AM"
        );
        const hasEvacuationH2PM = evacuationDrillReports.some(
          (r) => r.drillType === "EVACUATION" && (r.quarter === "Q3" || r.quarter === "Q4") && r.shift === "PM"
        );

        // Count missing evacuation drills for current period
        let missingEvacuationShifts = 0;
        if (inH1) {
          missingEvacuationShifts = (!hasEvacuationH1AM ? 1 : 0) + (!hasEvacuationH1PM ? 1 : 0);
        } else {
          missingEvacuationShifts = (!hasEvacuationH2AM ? 1 : 0) + (!hasEvacuationH2PM ? 1 : 0);
        }

        // Check disaster drill for current quarter (both AM and PM needed)
        const hasCurrentQuarterDisasterAM = evacuationDrillReports.some(
          (r) => r.drillType === "DISASTER" && r.quarter === currentQuarter && r.shift === "AM"
        );
        const hasCurrentQuarterDisasterPM = evacuationDrillReports.some(
          (r) => r.drillType === "DISASTER" && r.quarter === currentQuarter && r.shift === "PM"
        );
        const missingDisasterShifts = (!hasCurrentQuarterDisasterAM ? 1 : 0) + (!hasCurrentQuarterDisasterPM ? 1 : 0);

        // Check oversight training for current bi-week
        const { biWeek: currentBiWeek, year: biWeekYear } = getCurrentBiWeekInfo();
        const hasCurrentBiWeekOversightReport = await prisma.oversightTrainingReport.findUnique({
          where: {
            facilityId_biWeek_year: {
              facilityId: bhrfProfile.facilityId,
              biWeek: currentBiWeek,
              year: biWeekYear,
            },
          },
        });
        const missingOversightTraining = hasCurrentBiWeekOversightReport ? 0 : 1;

        adminTasks = missingFireDrills + missingEvacuationShifts + missingDisasterShifts + missingOversightTraining;

        // Count residents needing ART meetings this month (exclude discharged)
        const residents = await prisma.intake.findMany({
          where: {
            facilityId: bhrfProfile.facilityId,
            status: "APPROVED",
            dischargedAt: null,
          },
          select: {
            id: true,
            artMeetings: {
              where: {
                meetingMonth: currentMonth,
                meetingYear: currentYear,
              },
              select: {
                id: true,
                status: true,
                isSkipped: true,
              },
            },
          },
        });

        // Count residents without a completed ART meeting this month
        artMeetings = residents.filter((resident) => {
          const meeting = resident.artMeetings[0];
          // Needs meeting if no meeting exists, or meeting is DRAFT
          return !meeting || (meeting.status === "DRAFT" && !meeting.isSkipped);
        }).length;

        // Count employee certification issues (missing, expired, expiring soon)
        const requiredCertTypes = await prisma.employeeDocumentType.findMany({
          where: {
            isRequired: true,
            isActive: true,
            facilityId: null,
          },
        });

        const employees = await prisma.employee.findMany({
          where: {
            facilityId: bhrfProfile.facilityId,
            isActive: true,
          },
          include: {
            employeeDocuments: true,
          },
        });

        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        employees.forEach((employee) => {
          // Check for missing required certifications
          requiredCertTypes.forEach((certType) => {
            const hasDoc = employee.employeeDocuments.some(
              (doc) => doc.documentTypeId === certType.id
            );
            if (!hasDoc) {
              certificationIssues++;
            }
          });

          // Check for expired or expiring documents
          employee.employeeDocuments.forEach((doc) => {
            if (doc.noExpiration || !doc.expiresAt) return;
            const expiresAt = new Date(doc.expiresAt);
            if (expiresAt < now) {
              certificationIssues++; // Expired
            } else if (expiresAt <= thirtyDaysFromNow) {
              certificationIssues++; // Expiring soon
            }
          });
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
      adminTasks,
      artMeetings,
      certificationIssues,
    });
  } catch (error) {
    console.error("Get notification counts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification counts" },
      { status: 500 }
    );
  }
}
