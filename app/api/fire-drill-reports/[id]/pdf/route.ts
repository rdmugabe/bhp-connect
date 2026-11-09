import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildFireDrillDocx, fireDrillDocxFilename } from "@/lib/fire-drill-docx";
import { createAuditLog, AuditActions } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const report = await prisma.fireDrillReport.findUnique({
      where: { id },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            address: true,
            bhp: { select: { user: { select: { name: true } } } },
          },
        },
      },
    });
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (!bhrfProfile || bhrfProfile.facilityId !== report.facilityId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });
      const facility = await prisma.facility.findUnique({
        where: { id: report.facilityId },
      });
      if (!bhpProfile || !facility || facility.bhpId !== bhpProfile.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    const buffer = await buildFireDrillDocx({
      id: report.id,
      reportMonth: report.reportMonth,
      reportYear: report.reportYear,
      drillDate: report.drillDate,
      drillTime: report.drillTime,
      location: report.location,
      shift: report.shift,
      drillType: report.drillType,
      conductedBy: report.conductedBy,
      alarmActivatedTime: report.alarmActivatedTime,
      buildingClearTime: report.buildingClearTime,
      totalEvacuationTime: report.totalEvacuationTime,
      numberEvacuated: report.numberEvacuated,
      safetyChecklist: report.safetyChecklist as Parameters<typeof buildFireDrillDocx>[0]["safetyChecklist"],
      residentsPresent: report.residentsPresent as { name: string; evacuated: boolean }[] | null,
      observations: report.observations,
      correctiveActions: report.correctiveActions,
      drillResult: report.drillResult,
      signatures: report.signatures as Parameters<typeof buildFireDrillDocx>[0]["signatures"],
      submittedAt: report.submittedAt,
      facility: {
        name: report.facility.name,
        address: report.facility.address,
        bhp: report.facility.bhp,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.FIRE_DRILL_PDF_DOWNLOADED,
      entityType: "FireDrillReport",
      entityId: report.id,
      details: {
        reportMonth: report.reportMonth,
        reportYear: report.reportYear,
        shift: report.shift,
      },
    });

    const filename = fireDrillDocxFilename({
      reportMonth: report.reportMonth,
      reportYear: report.reportYear,
      shift: report.shift,
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Generate fire drill DOCX error:", error);
    return NextResponse.json(
      { error: "Failed to generate document" },
      { status: 500 }
    );
  }
}
