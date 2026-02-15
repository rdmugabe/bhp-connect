import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import speakeasy from "speakeasy";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 }
      );
    }

    // Get user with MFA secret
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !user.mfaSecret) {
      return NextResponse.json(
        { error: "MFA not initialized" },
        { status: 400 }
      );
    }

    // Verify the code
    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: "base32",
      token: code,
      window: 1,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Enable MFA
    await prisma.user.update({
      where: { id: session.user.id },
      data: { mfaEnabled: true },
    });

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.USER_MFA_ENABLED,
      entityType: "User",
      entityId: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("MFA verification error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
