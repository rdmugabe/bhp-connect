import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { z } from "zod";

const registerInviteSchema = z.object({
  token: z.string().min(1, "Token is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerInviteSchema.parse(body);

    // Find and validate the invitation
    const invitation = await prisma.facilityInvitation.findUnique({
      where: { token: validatedData.token },
      include: {
        facility: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation" },
        { status: 404 }
      );
    }

    // Check if invitation is expired
    if (invitation.expiresAt < new Date()) {
      if (invitation.status === "PENDING") {
        await prisma.facilityInvitation.update({
          where: { id: invitation.id },
          data: { status: "EXPIRED" },
        });
      }
      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 410 }
      );
    }

    // Check if invitation is still pending
    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { error: `This invitation has already been ${invitation.status.toLowerCase()}` },
        { status: 410 }
      );
    }

    // Check if email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 12);

    // Create user and BHRF profile in a transaction
    const user = await prisma.$transaction(async (tx) => {
      // Create the user as BHRF with APPROVED status (invited staff are pre-approved)
      const newUser = await tx.user.create({
        data: {
          email: invitation.email,
          passwordHash,
          name: validatedData.name,
          role: "BHRF",
          approvalStatus: "APPROVED",
          approvedAt: new Date(),
        },
      });

      // Create BHRF profile linking to the facility
      await tx.bHRFProfile.create({
        data: {
          userId: newUser.id,
          facilityId: invitation.facilityId,
        },
      });

      // Mark invitation as accepted
      await tx.facilityInvitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
          acceptedUserId: newUser.id,
        },
      });

      return newUser;
    });

    // Create audit logs
    await createAuditLog({
      userId: user.id,
      action: AuditActions.USER_REGISTERED,
      entityType: "User",
      entityId: user.id,
      details: {
        role: "BHRF",
        approvalStatus: "PENDING",
        registeredViaInvitation: true,
        invitationId: invitation.id,
        facilityId: invitation.facilityId,
        facilityName: invitation.facility.name,
      },
    });

    await createAuditLog({
      userId: user.id,
      action: AuditActions.INVITATION_ACCEPTED,
      entityType: "FacilityInvitation",
      entityId: invitation.id,
      details: {
        email: invitation.email,
        role: invitation.role,
        facilityName: invitation.facility.name,
      },
    });

    return NextResponse.json(
      {
        message: "Registration successful. Your account is pending admin approval.",
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Invite registration error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
