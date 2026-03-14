import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "Token is required" },
        { status: 400 }
      );
    }

    const invitation = await prisma.facilityInvitation.findUnique({
      where: { token },
      include: {
        facility: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { valid: false, error: "Invalid invitation" },
        { status: 404 }
      );
    }

    // Check if invitation is expired
    if (invitation.expiresAt < new Date()) {
      // Mark as expired if not already
      if (invitation.status === "PENDING") {
        await prisma.facilityInvitation.update({
          where: { id: invitation.id },
          data: { status: "EXPIRED" },
        });
      }
      return NextResponse.json(
        { valid: false, error: "This invitation has expired" },
        { status: 410 }
      );
    }

    // Check if invitation is already used or cancelled
    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { valid: false, error: `This invitation has already been ${invitation.status.toLowerCase()}` },
        { status: 410 }
      );
    }

    return NextResponse.json({
      valid: true,
      invitation: {
        email: invitation.email,
        role: invitation.role,
        facilityName: invitation.facility.name,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error("Verify invitation error:", error);
    return NextResponse.json(
      { valid: false, error: "Failed to verify invitation" },
      { status: 500 }
    );
  }
}
