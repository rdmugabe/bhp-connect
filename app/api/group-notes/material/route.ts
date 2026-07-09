import { NextRequest, NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFacilityScope } from "@/lib/facility-scope";
import { generateGroupTherapyMaterial } from "@/lib/group-therapy-material";
import { isYouTubeConfigured } from "@/lib/youtube-search";
import { getTodayArizona } from "@/lib/date-utils";

/** Parse YYYY-MM-DD to a UTC Date at midnight (stored form). */
function parseYMDToUTC(ymd: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) throw new Error("date must be YYYY-MM-DD");
  return new Date(Date.UTC(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10)));
}

/** Coerce YYYY-MM-DD (or ?date=today) to a UTC Date at midnight. "today"
 *  resolves in the Arizona timezone (America/Phoenix, UTC−7). */
function parseSessionDate(input: string | null): Date {
  const ymd = !input || input === "today" ? getTodayArizona() : input;
  return parseYMDToUTC(ymd);
}

/** UTC-midnight Date for today-in-Arizona — matches how sessionDate is stored. */
function todayArizonaAsUTC(): Date {
  return parseYMDToUTC(getTodayArizona());
}

/**
 * Purge material rows older than today for this facility. Called on every
 * GET/POST so the table effectively holds only "today or later" — session
 * material is intentionally ephemeral and doesn't carry over between days.
 * Fire-and-forget: swallow errors so a purge failure doesn't fail the request.
 */
async function purgeOldMaterial(facilityId: string): Promise<void> {
  try {
    await prisma.groupTherapyMaterial.deleteMany({
      where: {
        facilityId,
        sessionDate: { lt: todayArizonaAsUTC() },
      },
    });
  } catch {
    /* non-fatal — will be retried by the next request */
  }
}

/** Resolve the caller's single facility. BHRF has exactly one; BHP/ADMIN
 *  can pass ?facilityId=... to disambiguate. */
async function resolveFacilityId(
  session: Session | null,
  requested: string | null
): Promise<{ ok: true; facilityId: string } | { ok: false; status: number; error: string }> {
  const scope = await getFacilityScope(session, requested);
  if (!scope.ok) return { ok: false, status: scope.status, error: scope.error };

  const where = scope.where as { facilityId?: string; facility?: { bhpId?: string } };
  if (where.facilityId) return { ok: true, facilityId: where.facilityId };

  // BHP with multiple facilities — require ?facilityId
  if (!requested) {
    return { ok: false, status: 400, error: "facilityId is required for this role" };
  }
  return { ok: true, facilityId: requested };
}

// GET /api/group-notes/material?date=YYYY-MM-DD — returns the saved record for
// that date if one exists, else 404.
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

  await purgeOldMaterial(facility.facilityId);

  const material = await prisma.groupTherapyMaterial.findUnique({
    where: {
      facilityId_sessionDate: { facilityId: facility.facilityId, sessionDate },
    },
  });

  if (!material) return NextResponse.json({ material: null });
  return NextResponse.json({ material });
}

// POST /api/group-notes/material — generates fresh material via Claude +
// YouTube, upserts it. Body: { date?: "YYYY-MM-DD" | "today", themeSeed?: string }.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const facility = await resolveFacilityId(session, req.nextUrl.searchParams.get("facilityId"));
  if (!facility.ok) return NextResponse.json({ error: facility.error }, { status: facility.status });
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 503 });
  }
  if (!isYouTubeConfigured()) {
    return NextResponse.json({ error: "YOUTUBE_API_KEY not configured" }, { status: 503 });
  }

  let body: { date?: string | null; themeSeed?: string | null } = {};
  try { body = (await req.json()) ?? {}; } catch { /* empty body is fine */ }

  let sessionDate: Date;
  try {
    sessionDate = parseSessionDate(body.date ?? "today");
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Bad date" }, { status: 400 });
  }

  // Purge yesterday-and-older before we insert today's row.
  await purgeOldMaterial(facility.facilityId);

  try {
    const generated = await generateGroupTherapyMaterial(body.themeSeed ?? null);

    const material = await prisma.groupTherapyMaterial.upsert({
      where: {
        facilityId_sessionDate: { facilityId: facility.facilityId, sessionDate },
      },
      create: {
        facilityId: facility.facilityId,
        sessionDate,
        topic: generated.topic,
        facilitatorGuide: generated.facilitatorGuide,
        handoutMarkdown: generated.handoutMarkdown,
        videos: generated.videos as unknown as object,
        themeSeed: body.themeSeed?.trim() || null,
        generatedBy: session.user.id,
      },
      update: {
        topic: generated.topic,
        facilitatorGuide: generated.facilitatorGuide,
        handoutMarkdown: generated.handoutMarkdown,
        videos: generated.videos as unknown as object,
        themeSeed: body.themeSeed?.trim() || null,
        generatedBy: session.user.id,
      },
    });

    return NextResponse.json({ material, topicSummary: generated.topicSummary });
  } catch (err) {
    // Log the full error server-side so we can diagnose
    console.error("[group-notes/material] generate failed:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
