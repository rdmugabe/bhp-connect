import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStaffingForDate } from "@/lib/staffing";

/**
 * Returns the staff member who covers (shift) on (date) for the caller's
 * facility. Used by the progress-note form to prefill signature defaults.
 *
 * Query params: shift=AM|PM|NOC, date=YYYY-MM-DD
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const shift = searchParams.get("shift") || "";
  const dateStr = searchParams.get("date") || "";

  if (!shift || !dateStr) {
    return NextResponse.json({ staffing: null });
  }
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ staffing: null });
  }

  let facilityId: string | null = null;
  if (session.user.role === "BHRF") {
    const p = await prisma.bHRFProfile.findUnique({ where: { userId: session.user.id } });
    facilityId = p?.facilityId ?? null;
  } else {
    facilityId = searchParams.get("facilityId");
  }
  if (!facilityId) return NextResponse.json({ staffing: null });

  const staffing = await getStaffingForDate(facilityId, shift, date);
  return NextResponse.json({ staffing });
}
