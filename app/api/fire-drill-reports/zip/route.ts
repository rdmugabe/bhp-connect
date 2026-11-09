import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import JSZip from "jszip";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildFireDrillDocx, fireDrillDocxFilename } from "@/lib/fire-drill-docx";
import { createAuditLog, AuditActions } from "@/lib/audit";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Download every fire drill report for a given year as a single .zip of
 * .docx files. Access is restricted to the facility's BHRF, its BHP, or an
 * ADMIN.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const yearStr = searchParams.get("year");
  const year = yearStr ? parseInt(yearStr, 10) : NaN;
  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  let facilityId: string | null = null;
  if (session.user.role === "BHRF") {
    const p = await prisma.bHRFProfile.findUnique({ where: { userId: session.user.id } });
    facilityId = p?.facilityId ?? null;
  } else if (session.user.role === "BHP") {
    const requested = searchParams.get("facilityId");
    const p = await prisma.bHPProfile.findUnique({ where: { userId: session.user.id } });
    if (!p || !requested) return NextResponse.json({ error: "facilityId required" }, { status: 400 });
    const f = await prisma.facility.findUnique({ where: { id: requested } });
    if (!f || f.bhpId !== p.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    facilityId = requested;
  } else if (session.user.role === "ADMIN") {
    facilityId = searchParams.get("facilityId");
  }
  if (!facilityId) {
    return NextResponse.json({ error: "Facility not found" }, { status: 404 });
  }

  const reports = await prisma.fireDrillReport.findMany({
    where: { facilityId, reportYear: year },
    include: {
      facility: {
        select: {
          name: true,
          address: true,
          bhp: { select: { user: { select: { name: true } } } },
        },
      },
    },
    orderBy: [{ reportMonth: "asc" }, { shift: "asc" }],
  });

  if (reports.length === 0) {
    return NextResponse.json({ error: "No reports for this year" }, { status: 404 });
  }

  const zip = new JSZip();
  for (const report of reports) {
    const buf = await buildFireDrillDocx({
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
    const monthNum = String(report.reportMonth).padStart(2, "0");
    const monthName = MONTH_NAMES[report.reportMonth - 1];
    const docxName = fireDrillDocxFilename({
      reportMonth: report.reportMonth,
      reportYear: report.reportYear,
      shift: report.shift,
    });
    zip.file(`${monthNum}_${monthName}/${docxName}`, buf);
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  await createAuditLog({
    userId: session.user.id,
    action: AuditActions.FIRE_DRILL_PDF_DOWNLOADED,
    entityType: "FireDrillReport",
    entityId: "ZIP",
    details: { year, count: reports.length, bulk: true },
  });

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="FireDrillReports_${year}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
