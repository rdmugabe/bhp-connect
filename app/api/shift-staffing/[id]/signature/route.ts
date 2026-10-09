import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile, deleteFile, generateFileKey } from "@/lib/s3";
import { createAuditLog } from "@/lib/audit";

async function authorizeAndFetch(userId: string, entryId: string) {
  const profile = await prisma.bHRFProfile.findUnique({ where: { userId } });
  if (!profile) return null;
  const entry = await prisma.shiftStaffing.findUnique({ where: { id: entryId } });
  if (!entry || entry.facilityId !== profile.facilityId) return null;
  return { entry, facilityId: profile.facilityId };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "BHRF") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const ctx = await authorizeAndFetch(session.user.id, id);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const allowed = ["image/png", "image/jpeg", "image/jpg"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Only PNG or JPG allowed" }, { status: 400 });
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 });
  }

  // Replace existing signature if any.
  if (ctx.entry.signatureKey) {
    try {
      await deleteFile(ctx.entry.signatureKey);
    } catch (err) {
      console.error("Failed to delete old signature:", err);
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = generateFileKey(ctx.facilityId, "shift-staffing-signature", file.name);
  await uploadFile(buffer, key, file.type);

  const updated = await prisma.shiftStaffing.update({
    where: { id },
    data: { signatureKey: key },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "SHIFT_STAFFING_SIGNATURE_UPDATED",
    entityType: "ShiftStaffing",
    entityId: id,
    details: { signatureKey: key },
  });

  return NextResponse.json({ entry: updated });
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
  const ctx = await authorizeAndFetch(session.user.id, id);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (ctx.entry.signatureKey) {
    try {
      await deleteFile(ctx.entry.signatureKey);
    } catch (err) {
      console.error("Failed to delete signature:", err);
    }
  }

  await prisma.shiftStaffing.update({ where: { id }, data: { signatureKey: null } });

  await createAuditLog({
    userId: session.user.id,
    action: "SHIFT_STAFFING_SIGNATURE_DELETED",
    entityType: "ShiftStaffing",
    entityId: id,
    details: {},
  });

  return NextResponse.json({ success: true });
}
