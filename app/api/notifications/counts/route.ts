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
    let adminTasks = 0;

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

        // Count missing fire drill reports for current month
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

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

        // Calculate current quarter
        const month = now.getMonth();
        const currentQuarter = month < 3 ? "Q1" : month < 6 ? "Q2" : month < 9 ? "Q3" : "Q4";

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

        adminTasks = missingFireDrills + missingEvacuationShifts + missingDisasterShifts;
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
    });
  } catch (error) {
    console.error("Get notification counts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification counts" },
      { status: 500 }
    );
  }
}
