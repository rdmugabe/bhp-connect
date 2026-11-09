import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadFile, deleteFile, generateFileKey } from "@/lib/s3";

/**
 * Public endpoints for the employee signing flow — no auth, token-gated.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const packet = await prisma.employeeOnboardingPacket.findUnique({
    where: { signingToken: token },
    include: { facility: { select: { name: true } } },
  });
  if (!packet) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    packet: {
      id: packet.id,
      employeeName: packet.employeeName,
      hireDate: packet.hireDate,
      facilityName: packet.facility.name,
      signed: !!packet.signatureKey,
      formData: (packet.formData ?? {}) as Record<string, string>,
    },
  });
}

/**
 * Submit a signature image for the packet. Accepts a data-URI PNG in the
 * JSON body — we decode and upload it to S3.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const packet = await prisma.employeeOnboardingPacket.findUnique({
    where: { signingToken: token },
  });
  if (!packet) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as
    | { signature?: string; formData?: Record<string, string> }
    | null;
  const dataUri = body?.signature;
  if (!dataUri || typeof dataUri !== "string") {
    return NextResponse.json({ error: "Signature required" }, { status: 400 });
  }
  const match = dataUri.match(/^data:(image\/(?:png|jpeg|jpg));base64,(.+)$/);
  if (!match) {
    return NextResponse.json({ error: "Invalid signature format" }, { status: 400 });
  }
  const contentType = match[1];
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Signature too large" }, { status: 400 });
  }

  // Clean form data: trim strings, drop empties, cap size.
  const cleanedForm: Record<string, string> = {};
  if (body?.formData && typeof body.formData === "object") {
    for (const [k, v] of Object.entries(body.formData)) {
      if (typeof v === "string") {
        const trimmed = v.trim();
        if (trimmed) cleanedForm[k] = trimmed.slice(0, 2000);
      }
    }
  }

  // Replace any prior signature.
  if (packet.signatureKey) {
    try {
      await deleteFile(packet.signatureKey);
    } catch (err) {
      console.error("Failed to delete prior signature:", err);
    }
  }

  const ext = contentType.includes("png") ? "png" : "jpg";
  const key = generateFileKey(packet.facilityId, "employee-packet-signature", `signature.${ext}`);
  await uploadFile(buffer, key, contentType);

  await prisma.employeeOnboardingPacket.update({
    where: { id: packet.id },
    data: { signatureKey: key, formData: cleanedForm },
  });

  return NextResponse.json({ success: true });
}
