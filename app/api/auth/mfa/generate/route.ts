import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `BHP Connect (${session.user.email})`,
      issuer: "BHP Connect",
    });

    // Store temporary secret (not enabled yet)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { mfaSecret: secret.base32 },
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url || "");

    return NextResponse.json({
      secret: secret.base32,
      qrCode,
    });
  } catch (error) {
    console.error("MFA generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate MFA" },
      { status: 500 }
    );
  }
}
