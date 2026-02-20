import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { EvacuationDrillPDF } from "@/lib/pdf/evacuation-drill-template";
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

    const report = await prisma.evacuationDrillReport.findUnique({
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
      drillType: report.drillType,
      drillDate: report.drillDate.toISOString(),
      drillTime: report.drillTime,
      dayOfWeek: report.dayOfWeek,
      totalLengthMinutes: report.totalLengthMinutes,
      shift: report.shift,
      quarter: report.quarter,
      year: report.year,
      disasterDrillType: report.disasterDrillType,
      staffInvolved: report.staffInvolved as { name: string }[],
      residentsInvolved: report.residentsInvolved as { name: string; assistanceRequired?: string }[] | null,
      exitBlocked: report.exitBlocked,
      exitUsed: report.exitUsed,
      assemblyPoint: report.assemblyPoint,
      correctLocation: report.correctLocation,
      allAccountedFor: report.allAccountedFor,
      issuesIdentified: report.issuesIdentified,
      observations: report.observations,
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
    const pdfBuffer = await renderToBuffer(EvacuationDrillPDF({ data: pdfData }));

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.EVACUATION_DRILL_PDF_DOWNLOADED,
      entityType: "EvacuationDrillReport",
      entityId: report.id,
      details: {
        drillType: report.drillType,
        quarter: report.quarter,
        year: report.year,
        shift: report.shift,
      },
    });

    const drillTypeLabel = report.drillType === "EVACUATION" ? "Evacuation" : "Disaster";
    const filename = `${drillTypeLabel}Drill_${report.quarter}${report.year}_${report.shift}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Generate evacuation drill PDF error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
