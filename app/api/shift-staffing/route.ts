import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/api-utils";
import { createAuditLog } from "@/lib/audit";

const SHIFTS = new Set(["AM", "PM", "NOC"]);

async function resolveFacilityId(userId: string, role: string): Promise<string | null> {
  if (role === "BHRF") {
    const p = await prisma.bHRFProfile.findUnique({ where: { userId } });
    return p?.facilityId ?? null;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const facilityIdParam = searchParams.get("facilityId");

  let facilityId: string | null = null;
  if (session.user.role === "BHRF") {
    facilityId = await resolveFacilityId(session.user.id, session.user.role);
  } else if (session.user.role === "BHP" || session.user.role === "ADMIN") {
    facilityId = facilityIdParam;
  }

  if (!facilityId) {
    return NextResponse.json({ entries: [] });
  }

  const entries = await prisma.shiftStaffing.findMany({
    where: { facilityId },
    orderBy: [{ shift: "asc" }, { effectiveFrom: "desc" }],
  });

  return NextResponse.json({ entries });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "BHRF") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parseResult = await parseJsonBody(request);
  if (!parseResult.success) return parseResult.error;
  const body = parseResult.data as {
    shift?: string;
    name?: string;
    credentials?: string | null;
    effectiveFrom?: string;
  };

  if (!body.shift || !SHIFTS.has(body.shift)) {
    return NextResponse.json({ error: "Invalid shift" }, { status: 400 });
  }
  if (!body.name || !body.name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!body.effectiveFrom) {
    return NextResponse.json({ error: "Effective-from date is required" }, { status: 400 });
  }
  const effectiveFrom = new Date(body.effectiveFrom);
  if (Number.isNaN(effectiveFrom.getTime())) {
    return NextResponse.json({ error: "Invalid effective-from date" }, { status: 400 });
  }

  const facilityId = await resolveFacilityId(session.user.id, session.user.role);
  if (!facilityId) return NextResponse.json({ error: "Facility not found" }, { status: 404 });

  const entry = await prisma.shiftStaffing.create({
    data: {
      facilityId,
      shift: body.shift,
      name: body.name.trim(),
      credentials: body.credentials?.trim() || null,
      effectiveFrom,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "SHIFT_STAFFING_CREATED",
    entityType: "ShiftStaffing",
    entityId: entry.id,
    details: { shift: entry.shift, name: entry.name, effectiveFrom: entry.effectiveFrom },
  });

  return NextResponse.json({ entry }, { status: 201 });
}
