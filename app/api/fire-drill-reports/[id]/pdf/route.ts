import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { FireDrillPDF } from "@/lib/pdf/fire-drill-template";
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
            bhp: {
              select: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Verify access
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

    // Format the data for the PDF
    const pdfData = {
      id: report.id,
      reportMonth: report.reportMonth,
      reportYear: report.reportYear,
      drillDate: report.drillDate.toISOString(),
      drillTime: report.drillTime,
      location: report.location,
      shift: report.shift,
      drillType: report.drillType,
      conductedBy: report.conductedBy,
      alarmActivatedTime: report.alarmActivatedTime,
      buildingClearTime: report.buildingClearTime,
      totalEvacuationTime: report.totalEvacuationTime,
      numberEvacuated: report.numberEvacuated,
      safetyChecklist: report.safetyChecklist as Record<string, boolean>,
      residentsPresent: report.residentsPresent as { name: string; evacuated: boolean }[] | null,
      observations: report.observations,
      correctiveActions: report.correctiveActions,
      drillResult: report.drillResult,
      signatures: report.signatures as Record<string, string> | null,
      submittedAt: report.submittedAt.toISOString(),
      facility: {
        name: report.facility.name,
        address: report.facility.address,
        bhp: report.facility.bhp,
      },
    };

    // Generate PDF
    const pdfBuffer = await renderToBuffer(FireDrillPDF({ data: pdfData }));

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

    const monthName = new Date(report.reportYear, report.reportMonth - 1).toLocaleString("default", { month: "long" });
    const filename = `FireDrill_${monthName}${report.reportYear}_${report.shift}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Generate fire drill PDF error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
