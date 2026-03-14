import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { parseJsonBody } from "@/lib/api-utils";

const approvalSchema = z
  .object({
    status: z.enum(["APPROVED", "REJECTED"]),
    reason: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.status === "REJECTED") {
        return data.reason && data.reason.length >= 10;
      }
      return true;
    },
    {
      message: "Please provide a reason (at least 10 characters) for rejection",
      path: ["reason"],
    }
  );

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "BHRF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get the approving user's BHRF profile
    const approverProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
      include: { facility: true },
    });

    if (!approverProfile) {
      return NextResponse.json({ error: "Facility profile not found" }, { status: 404 });
    }

    // Find the user to be approved and their BHRF profile
    const userToApprove = await prisma.user.findUnique({
      where: { id },
      include: {
        bhrfProfile: {
          include: {
            facility: true,
          },
        },
      },
    });

    if (!userToApprove) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify the user is a BHRF staff member
    if (!userToApprove.bhrfProfile) {
      return NextResponse.json(
        { error: "User is not a facility staff member" },
        { status: 400 }
      );
    }

    // Verify both users belong to the same facility
    if (userToApprove.bhrfProfile.facilityId !== approverProfile.facilityId) {
      return NextResponse.json(
        { error: "You can only approve staff from your own facility" },
        { status: 403 }
      );
    }

    // Check if already decided
    if (userToApprove.approvalStatus !== "PENDING") {
      return NextResponse.json(
        { error: "Staff member has already been reviewed" },
        { status: 400 }
      );
    }

    const parseResult = await parseJsonBody(request);
    if (!parseResult.success) {
      return parseResult.error;
    }
    const validatedData = approvalSchema.parse(parseResult.data);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        approvalStatus: validatedData.status,
        approvedBy: session.user.id,
        approvedAt: new Date(),
        rejectionReason:
          validatedData.status === "REJECTED" ? validatedData.reason : null,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action:
        validatedData.status === "APPROVED"
          ? AuditActions.USER_APPROVED
          : AuditActions.USER_REJECTED,
      entityType: "User",
      entityId: userToApprove.id,
      details: {
        userName: userToApprove.name,
        userEmail: userToApprove.email,
        userRole: userToApprove.role,
        facilityName: userToApprove.bhrfProfile.facility.name,
        decision: validatedData.status,
        reason: validatedData.reason,
        approvedByFacilityStaff: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        approvalStatus: updatedUser.approvalStatus,
      },
    });
  } catch (error) {
    console.error("Staff approval error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update staff approval" },
      { status: 500 }
    );
  }
}
