import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // For BHRF users, verify the selected BHP exists and is approved
    if (validatedData.role === "BHRF" && validatedData.selectedBhpId) {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { id: validatedData.selectedBhpId },
        include: { user: true },
      });

      if (!bhpProfile || bhpProfile.user.approvalStatus !== "APPROVED") {
        return NextResponse.json(
          { error: "Selected BHP is not available" },
          { status: 400 }
        );
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 12);

    // Create user with role-specific profile (all users start as PENDING)
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: validatedData.email.toLowerCase(),
          passwordHash,
          name: validatedData.name,
          role: validatedData.role,
          approvalStatus: "PENDING", // All users need approval
        },
      });

      if (validatedData.role === "BHP") {
        // Create BHP profile
        await tx.bHPProfile.create({
          data: {
            userId: newUser.id,
            phone: validatedData.phone,
            address: validatedData.address,
            bio: validatedData.bio,
          },
        });
      } else if (validatedData.role === "BHRF" && validatedData.selectedBhpId) {
        // Create FacilityApplication for BHRF users
        await tx.facilityApplication.create({
          data: {
            userId: newUser.id,
            bhpId: validatedData.selectedBhpId,
            facilityName: validatedData.facilityName!,
            facilityAddress: validatedData.facilityAddress!,
            facilityPhone: validatedData.facilityPhone,
            status: "PENDING",
          },
        });
      }

      return newUser;
    });

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: AuditActions.USER_REGISTERED,
      entityType: "User",
      entityId: user.id,
      details: {
        role: user.role,
        approvalStatus: "PENDING",
        ...(validatedData.role === "BHRF" && {
          selectedBhpId: validatedData.selectedBhpId,
          facilityName: validatedData.facilityName,
        }),
      },
    });

    return NextResponse.json(
      {
        message: "Registration successful. Awaiting approval.",
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

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
