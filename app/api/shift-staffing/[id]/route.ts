import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/api-utils";
import { createAuditLog } from "@/lib/audit";

const SHIFTS = new Set(["AM", "PM", "NOC"]);

async function assertOwnership(userId: string, entryId: string): Promise<string | null> {
  const profile = await prisma.bHRFProfile.findUnique({ where: { userId } });
  if (!profile) return null;
  const entry = await prisma.shiftStaffing.findUnique({ where: { id: entryId } });
  if (!entry || entry.facilityId !== profile.facilityId) return null;
  return profile.facilityId;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "BHRF") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const facilityId = await assertOwnership(session.user.id, id);
  if (!facilityId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parseResult = await parseJsonBody(request);
  if (!parseResult.success) return parseResult.error;
  const body = parseResult.data as {
    shift?: string;
    name?: string;
    credentials?: string | null;
    effectiveFrom?: string;
  };

  const data: {
    shift?: string;
    name?: string;
    credentials?: string | null;
    effectiveFrom?: Date;
  } = {};
  if (body.shift !== undefined) {
    if (!SHIFTS.has(body.shift)) return NextResponse.json({ error: "Invalid shift" }, { status: 400 });
    data.shift = body.shift;
  }
  if (body.name !== undefined) {
    if (!body.name.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    data.name = body.name.trim();
  }
  if (body.credentials !== undefined) {
    data.credentials = body.credentials?.trim() || null;
  }
  if (body.effectiveFrom !== undefined) {
    const d = new Date(body.effectiveFrom);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "Invalid effective-from date" }, { status: 400 });
    }
    data.effectiveFrom = d;
  }

  const entry = await prisma.shiftStaffing.update({ where: { id }, data });

  await createAuditLog({
    userId: session.user.id,
    action: "SHIFT_STAFFING_UPDATED",
    entityType: "ShiftStaffing",
    entityId: entry.id,
    details: data,
  });

  return NextResponse.json({ entry });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "BHRF") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const facilityId = await assertOwnership(session.user.id, id);
  if (!facilityId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.shiftStaffing.delete({ where: { id } });

  await createAuditLog({
    userId: session.user.id,
    action: "SHIFT_STAFFING_DELETED",
    entityType: "ShiftStaffing",
    entityId: id,
    details: {},
  });

  return NextResponse.json({ success: true });
}
