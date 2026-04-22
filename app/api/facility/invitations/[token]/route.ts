import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { requireFacilityAdmin, FacilityAdminError } from "@/lib/facility-admin";

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

// Cancel a pending invitation. `token` param here is the invitation's token
// (the staff list response includes it for each pending invitation).
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    let bhrfProfile;
    try {
      bhrfProfile = await requireFacilityAdmin(session);
    } catch (err) {
      if (err instanceof FacilityAdminError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      throw err;
    }

    const { token } = await params;

    const invitation = await prisma.facilityInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    if (invitation.facilityId !== bhrfProfile.facilityId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { error: `Cannot cancel an invitation that is ${invitation.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    await prisma.facilityInvitation.update({
      where: { id: invitation.id },
      data: { status: "CANCELLED" },
    });

    await createAuditLog({
      userId: bhrfProfile.userId,
      action: AuditActions.INVITATION_CANCELLED,
      entityType: "FacilityInvitation",
      entityId: invitation.id,
      details: {
        email: invitation.email,
        role: invitation.role,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel invitation error:", error);
    return NextResponse.json(
      { error: "Failed to cancel invitation" },
      { status: 500 }
    );
  }
}
