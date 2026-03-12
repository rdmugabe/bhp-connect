import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveAlerts, checkMedicationAlerts, checkPRNFollowupAlerts, expireAlerts, getAlertCounts } from "@/lib/emar/alerts";
import { updateScheduleStatuses } from "@/lib/emar/schedule-generator";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const intakeId = searchParams.get("intakeId");
    const severity = searchParams.get("severity");
    const refresh = searchParams.get("refresh") === "true";

    let facilityId: string | undefined;

    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile) {
        return NextResponse.json({ alerts: [], counts: { critical: 0, warning: 0, info: 0, total: 0 } });
      }

      facilityId = bhrfProfile.facilityId;
    } else if (session.user.role === "BHP") {
      const reqFacilityId = searchParams.get("facilityId");

      if (!reqFacilityId) {
        return NextResponse.json({ alerts: [], counts: { critical: 0, warning: 0, info: 0, total: 0 } });
      }

      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile) {
        return NextResponse.json({ alerts: [], counts: { critical: 0, warning: 0, info: 0, total: 0 } });
      }

      const facility = await prisma.facility.findFirst({
        where: {
          id: reqFacilityId,
          bhpId: bhpProfile.id,
        },
      });

      if (!facility) {
        return NextResponse.json({ error: "Facility not found" }, { status: 404 });
      }

      facilityId = reqFacilityId;
    }

    if (!facilityId) {
      return NextResponse.json({ alerts: [], counts: { critical: 0, warning: 0, info: 0, total: 0 } });
    }

    // Optionally refresh alerts (check for new ones)
    if (refresh) {
      // Update schedule statuses first
      await updateScheduleStatuses();
      // Expire old alerts
      await expireAlerts();
      // Check for new medication alerts
      await checkMedicationAlerts(facilityId);
      // Check for PRN follow-up alerts
      await checkPRNFollowupAlerts(facilityId);
    }

    // Get active alerts
    const alerts = await getActiveAlerts({
      facilityId,
      intakeId: intakeId || undefined,
      severity: severity as "CRITICAL" | "WARNING" | "INFO" | undefined,
    });

    // Get alert counts
    const counts = await getAlertCounts(facilityId);

    return NextResponse.json({ alerts, counts });
  } catch (error) {
    console.error("Get alerts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}
