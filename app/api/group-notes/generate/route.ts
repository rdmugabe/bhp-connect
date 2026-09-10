import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { type Session } from "next-auth";
import JSZip from "jszip";
import { authOptions } from "@/lib/auth";
import { getFacilityScope } from "@/lib/facility-scope";
import { prisma } from "@/lib/prisma";
import { buildAllNotes, SESSION_SLOTS, type ResidentEntry } from "@/lib/group-notes-docx";
import { generateSessionSummaries } from "@/lib/group-notes-variations";

interface RequestBody {
  date_str: string;
  staff_name: string;
  staff_title?: string;
  /** Data URL of the staff signature PNG (data:image/png;base64,…). Optional. */
  staff_signature_png?: string;
  group_topic: string;
  group_summary: string;
  sessions: Array<"0930" | "1300" | "1630">;
  residents: Array<{
    name: string;
    dob?: string;
    ahcccs_id?: string;
    present: boolean;
    absence_reason: string;
    participation: string;
    behavior: string;
    overall: string;
    significant_info: string;
  }>;
}

/** Facility BHP signatory. Configurable per facility later — hard-coded for
 *  now to match Lucid Behavioral Health's signed template. */
const BHP_SIGNATORY_NAME = "Dr. Chris Azode, DNP, MBA, PMHNP-BC";

async function resolveFacilityId(
  session: Session | null,
  requested: string | null
): Promise<{ ok: true; facilityId: string } | { ok: false; status: number; error: string }> {
  const scope = await getFacilityScope(session, requested);
  if (!scope.ok) return { ok: false, status: scope.status, error: scope.error };
  const where = scope.where as { facilityId?: string };
  if (where.facilityId) return { ok: true, facilityId: where.facilityId };
  if (!requested) {
    return { ok: false, status: 400, error: "facilityId is required for this role" };
  }
  return { ok: true, facilityId: requested };
}

/**
 * Generate group therapy .docx notes inline (one per resident per session
 * slot) and return them bundled as a downloadable zip. Runs entirely in
 * Next.js — no external Python service.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const facility = await resolveFacilityId(session, req.nextUrl.searchParams.get("facilityId"));
  if (!facility.ok) return NextResponse.json({ error: facility.error }, { status: facility.status });

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.date_str || !body.staff_name) {
    return NextResponse.json({ error: "date_str and staff_name are required" }, { status: 400 });
  }

  const sessionCodes = (body.sessions ?? []).filter(c =>
    SESSION_SLOTS.some(s => s.code === c)
  );
  if (sessionCodes.length === 0) {
    return NextResponse.json({ error: "At least one session slot must be selected" }, { status: 400 });
  }

  const residents: ResidentEntry[] = (body.residents ?? []).map(r => ({
    name: r.name,
    dob: r.dob ?? "",
    ahcccsId: r.ahcccs_id ?? "",
    present: r.present,
    absenceReason: r.absence_reason,
    participation: r.participation,
    behavior: r.behavior,
    overall: r.overall,
    significantInfo: r.significant_info,
  }));

  if (residents.length === 0) {
    return NextResponse.json({ error: "No residents provided" }, { status: 400 });
  }

  const anyFilled = residents.some(r =>
    [r.absenceReason, r.participation, r.behavior, r.overall, r.significantInfo]
      .some(v => (v ?? "").trim().length > 0)
  );
  if (!anyFilled) {
    return NextResponse.json(
      { error: "Fill in at least one field for one resident before generating." },
      { status: 400 }
    );
  }

  const facilityRecord = await prisma.facility.findUnique({
    where: { id: facility.facilityId },
    select: { name: true },
  });
  const facilityName = facilityRecord?.name ?? "Behavioral Health Residential Facility";

  // When multiple sessions were requested, ask Claude to produce a distinct
  // summary per session so the three notes don't read identically. Falls
  // back to the shared summary if the call fails or the key is missing.
  const summariesBySession = await generateSessionSummaries(
    body.group_topic || "",
    body.group_summary || "",
    sessionCodes
  );

  // Strip the data-URL prefix off the signature PNG so the docx builder
  // gets raw base64 bytes.
  let staffSignatureBase64 = "";
  if (body.staff_signature_png) {
    const m = /^data:image\/png;base64,(.*)$/.exec(body.staff_signature_png);
    staffSignatureBase64 = m ? m[1] : body.staff_signature_png;
  }

  const files = await buildAllNotes({
    facilityName,
    dateMdY: body.date_str,
    staffName: body.staff_name,
    staffTitle: body.staff_title || "BHT",
    staffSignatureBase64,
    bhpSignatoryName: BHP_SIGNATORY_NAME,
    groupTopic: body.group_topic || "",
    groupSummary: body.group_summary || "",
    sessionCodes,
    summariesBySession,
    residents,
  });

  if (files.length === 0) {
    return NextResponse.json(
      { error: "None of the residents in this batch had any information filled in. Fill in at least one field per resident you want a note for." },
      { status: 400 }
    );
  }

  const zip = new JSZip();
  for (const f of files) {
    zip.file(f.filename, f.bytes);
  }
  const zipBytes = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });

  const dateSlug = body.date_str.replace(/\//g, "-");
  const zipName = `group-notes_${dateSlug}.zip`;

  const results = files.map(f => ({
    resident: f.resident,
    session: f.session,
    status: f.status,
    file: f.filename,
  }));

  // Return JSON with a base64-encoded zip payload. Robust to stale clients
  // that always call `res.json()` on this endpoint, and lets the browser
  // download the file with one click.
  return NextResponse.json({
    count_ok: files.length,
    drive_enabled: false,
    zip_filename: zipName,
    zip_base64: Buffer.from(zipBytes).toString("base64"),
    results,
  });
}
