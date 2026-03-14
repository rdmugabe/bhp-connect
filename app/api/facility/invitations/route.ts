import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { sendInvitationEmail } from "@/lib/email";
import { z } from "zod";

const invitationSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.string().min(1, "Role is required"),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "BHRF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!bhrfProfile) {
      return NextResponse.json(
        { error: "BHRF profile not found" },
        { status: 404 }
      );
    }

    const invitations = await prisma.facilityInvitation.findMany({
      where: {
        facilityId: bhrfProfile.facilityId,
      },
      include: {
        invitedBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("Get invitations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "BHRF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        facility: true,
        user: true,
      },
    });

    if (!bhrfProfile) {
      return NextResponse.json(
        { error: "BHRF profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = invitationSchema.parse(body);

    // Check if email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "This email is already registered" },
        { status: 400 }
      );
    }

    // Check if there's already a pending invitation for this email at this facility
    const existingInvitation = await prisma.facilityInvitation.findFirst({
      where: {
        facilityId: bhrfProfile.facilityId,
        email: validatedData.email.toLowerCase(),
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "A pending invitation already exists for this email" },
        { status: 400 }
      );
    }

    // Generate secure token
    const token = randomBytes(32).toString("hex");

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create the invitation
    const invitation = await prisma.facilityInvitation.create({
      data: {
        facilityId: bhrfProfile.facilityId,
        email: validatedData.email.toLowerCase(),
        role: validatedData.role,
        token,
        expiresAt,
        invitedById: session.user.id,
      },
    });

    // Generate invite URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/register/invite/${token}`;

    // Send invitation email
    try {
      await sendInvitationEmail({
        to: validatedData.email,
        inviterName: bhrfProfile.user.name,
        facilityName: bhrfProfile.facility.name,
        role: validatedData.role,
        inviteUrl,
        expiresAt,
      });
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError);
      // Delete the invitation if email fails
      await prisma.facilityInvitation.delete({
        where: { id: invitation.id },
      });
      return NextResponse.json(
        { error: "Failed to send invitation email" },
        { status: 500 }
      );
    }

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.INVITATION_SENT,
      entityType: "FacilityInvitation",
      entityId: invitation.id,
      details: {
        email: validatedData.email,
        role: validatedData.role,
        facilityName: bhrfProfile.facility.name,
      },
    });

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Create invitation error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}
