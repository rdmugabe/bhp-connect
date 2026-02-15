import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit";

const approvalSchema = z
  .object({
    status: z.enum(["APPROVED", "REJECTED"]),
    reason: z.string().optional(),
  })
  .refine(
    (data) => {
      // Reason is required for REJECTED, optional for APPROVED
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already decided
    if (user.approvalStatus !== "PENDING") {
      return NextResponse.json(
        { error: "User has already been reviewed" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = approvalSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
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
      entityId: user.id,
      details: {
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        decision: validatedData.status,
        reason: validatedData.reason,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        approvalStatus: updatedUser.approvalStatus,
      },
    });
  } catch (error) {
    console.error("User approval error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update user approval" },
      { status: 500 }
    );
  }
}
