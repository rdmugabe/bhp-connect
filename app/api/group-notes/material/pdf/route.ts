import { NextRequest, NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFacilityScope } from "@/lib/facility-scope";
import { renderToBuffer } from "@react-pdf/renderer";
import {
  GroupTherapyHandoutPDF,
  GroupTherapyGuidePDF,
} from "@/lib/pdf/group-therapy-handout-template";
import { getTodayArizona } from "@/lib/date-utils";

function parseYMDToUTC(ymd: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) throw new Error("date must be YYYY-MM-DD");
  return new Date(Date.UTC(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10)));
}

// "today" resolves to Arizona (America/Phoenix, UTC−7).
function parseSessionDate(input: string | null): Date {
  const ymd = !input || input === "today" ? getTodayArizona() : input;
  return parseYMDToUTC(ymd);
}

async function resolveFacilityId(
  session: Session | null,
  requested: string | null
): Promise<{ ok: true; facilityId: string } | { ok: false; status: number; error: string }> {
  const scope = await getFacilityScope(session, requested);
  if (!scope.ok) return { ok: false, status: scope.status, error: scope.error };
  const where = scope.where as { facilityId?: string };
  if (where.facilityId) return { ok: true, facilityId: where.facilityId };
  if (!requested) return { ok: false, status: 400, error: "facilityId is required for this role" };
  return { ok: true, facilityId: requested };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

// GET /api/group-notes/material/pdf?date=YYYY-MM-DD&kind=handout|guide
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const facility = await resolveFacilityId(session, req.nextUrl.searchParams.get("facilityId"));
  if (!facility.ok) return NextResponse.json({ error: facility.error }, { status: facility.status });

  let sessionDate: Date;
  try {
    sessionDate = parseSessionDate(req.nextUrl.searchParams.get("date"));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Bad date" }, { status: 400 });
  }

  const kind = req.nextUrl.searchParams.get("kind") === "guide" ? "guide" : "handout";

  // Purge yesterday-and-older (Arizona time) so the PDF endpoint can't serve
  // stale material.
  try {
    const today = parseYMDToUTC(getTodayArizona());
    await prisma.groupTherapyMaterial.deleteMany({
      where: { facilityId: facility.facilityId, sessionDate: { lt: today } },
    });
  } catch { /* non-fatal */ }

  const material = await prisma.groupTherapyMaterial.findUnique({
    where: {
      facilityId_sessionDate: { facilityId: facility.facilityId, sessionDate },
    },
    include: { facility: { select: { name: true } } },
  });

  if (!material) {
    return NextResponse.json({ error: "No material generated for this date yet" }, { status: 404 });
  }

  const dateStr = sessionDate.toISOString().slice(0, 10);
  const facilityName = material.facility?.name;

  const doc =
    kind === "guide"
      ? GroupTherapyGuidePDF({
          topic: material.topic,
          sessionDate: dateStr,
          facilitatorGuide: material.facilitatorGuide,
          facilityName,
        })
      : GroupTherapyHandoutPDF({
          topic: material.topic,
          sessionDate: dateStr,
          handoutMarkdown: material.handoutMarkdown,
          facilityName,
        });

  const buffer = await renderToBuffer(doc);
  const filename = `${slugify(material.topic)}-${kind}-${dateStr}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
