import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "BHP") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bhpProfile = await prisma.bHPProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!bhpProfile) {
      return NextResponse.json({ error: "BHP profile not found" }, { status: 404 });
    }

    const application = await prisma.facilityApplication.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            approvalStatus: true,
          },
        },
      },
    });

    if (!application || application.bhpId !== bhpProfile.id) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ application });
  } catch (error) {
    console.error("Get facility application error:", error);
    return NextResponse.json(
      { error: "Failed to fetch facility application" },
      { status: 500 }
    );
  }
}

const decisionSchema = z
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

    if (!session || session.user.role !== "BHP") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bhpProfile = await prisma.bHPProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!bhpProfile) {
      return NextResponse.json({ error: "BHP profile not found" }, { status: 404 });
    }

    const application = await prisma.facilityApplication.findUnique({
      where: { id: params.id },
      include: {
        user: true,
      },
    });

    if (!application || application.bhpId !== bhpProfile.id) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Check if already decided
    if (application.status !== "PENDING") {
      return NextResponse.json(
        { error: "Application has already been reviewed" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = decisionSchema.parse(body);

    // Process the decision
    if (validatedData.status === "APPROVED") {
      // Approve: Create facility, BHRFProfile, update application and user
      await prisma.$transaction(async (tx) => {
        // Create the facility
        const facility = await tx.facility.create({
          data: {
            name: application.facilityName,
            address: application.facilityAddress,
            phone: application.facilityPhone,
            bhpId: bhpProfile.id,
          },
        });

        // Create BHRF profile for the user
        await tx.bHRFProfile.create({
          data: {
            userId: application.userId,
            facilityId: facility.id,
          },
        });

        // Update the application status
        await tx.facilityApplication.update({
          where: { id: params.id },
          data: {
            status: "APPROVED",
            decisionReason: validatedData.reason,
            decidedAt: new Date(),
            decidedBy: session.user.id,
          },
        });

        // Update user approval status
        await tx.user.update({
          where: { id: application.userId },
          data: {
            approvalStatus: "APPROVED",
            approvedBy: session.user.id,
            approvedAt: new Date(),
          },
        });
      });

      await createAuditLog({
        userId: session.user.id,
        action: AuditActions.FACILITY_APPLICATION_APPROVED,
        entityType: "FacilityApplication",
        entityId: application.id,
        details: {
          applicantName: application.user.name,
          applicantEmail: application.user.email,
          facilityName: application.facilityName,
          reason: validatedData.reason,
        },
      });
    } else {
      // Reject: Update application and user status
      await prisma.$transaction(async (tx) => {
        await tx.facilityApplication.update({
          where: { id: params.id },
          data: {
            status: "REJECTED",
            decisionReason: validatedData.reason,
            decidedAt: new Date(),
            decidedBy: session.user.id,
          },
        });

        await tx.user.update({
          where: { id: application.userId },
          data: {
            approvalStatus: "REJECTED",
            approvedBy: session.user.id,
            approvedAt: new Date(),
            rejectionReason: validatedData.reason,
          },
        });
      });

      await createAuditLog({
        userId: session.user.id,
        action: AuditActions.FACILITY_APPLICATION_REJECTED,
        entityType: "FacilityApplication",
        entityId: application.id,
        details: {
          applicantName: application.user.name,
          applicantEmail: application.user.email,
          facilityName: application.facilityName,
          reason: validatedData.reason,
        },
      });
    }

    return NextResponse.json({
      success: true,
      status: validatedData.status,
    });
  } catch (error) {
    console.error("Facility application decision error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process application decision" },
      { status: 500 }
    );
  }
}
