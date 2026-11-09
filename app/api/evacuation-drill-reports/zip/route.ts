import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import JSZip from "jszip";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildEvacuationDrillDocx,
  evacuationDrillDocxFilename,
} from "@/lib/evacuation-drill-docx";
import { createAuditLog, AuditActions } from "@/lib/audit";

/**
 * Download every evacuation and disaster drill report for a given year as a
 * single .zip of .docx files.
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

  const reports = await prisma.evacuationDrillReport.findMany({
    where: { facilityId, year },
    include: {
      facility: {
        select: {
          name: true,
          address: true,
          bhp: { select: { user: { select: { name: true } } } },
        },
      },
    },
    orderBy: [{ drillType: "asc" }, { quarter: "asc" }, { shift: "asc" }],
  });

  if (reports.length === 0) {
    return NextResponse.json({ error: "No reports for this year" }, { status: 404 });
  }

  const zip = new JSZip();
  for (const report of reports) {
    const buf = await buildEvacuationDrillDocx({
      id: report.id,
      drillType: report.drillType,
      drillDate: report.drillDate,
      drillTime: report.drillTime,
      dayOfWeek: report.dayOfWeek,
      totalLengthMinutes: report.totalLengthMinutes,
      shift: report.shift,
      quarter: report.quarter,
      year: report.year,
      disasterDrillType: report.disasterDrillType,
      staffInvolved: report.staffInvolved as { name: string }[],
      residentsInvolved: report.residentsInvolved as
        | { name: string; assistanceRequired?: string }[]
        | null,
      exitBlocked: report.exitBlocked,
      exitUsed: report.exitUsed,
      assemblyPoint: report.assemblyPoint,
      correctLocation: report.correctLocation,
      allAccountedFor: report.allAccountedFor,
      issuesIdentified: report.issuesIdentified,
      observations: report.observations,
      drillResult: report.drillResult,
      signatures: report.signatures as Parameters<typeof buildEvacuationDrillDocx>[0]["signatures"],
      submittedAt: report.submittedAt,
      facility: {
        name: report.facility.name,
        address: report.facility.address,
        bhp: report.facility.bhp,
      },
    });
    const label = report.drillType === "EVACUATION" ? "Evacuation" : "Disaster";
    const docxName = evacuationDrillDocxFilename({
      drillType: report.drillType,
      quarter: report.quarter,
      year: report.year,
      shift: report.shift,
    });
    zip.file(`${label}/${docxName}`, buf);
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  await createAuditLog({
    userId: session.user.id,
    action: AuditActions.EVACUATION_DRILL_PDF_DOWNLOADED,
    entityType: "EvacuationDrillReport",
    entityId: "ZIP",
    details: { year, count: reports.length, bulk: true },
  });

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="EvacuationDisasterDrills_${year}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
