import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEnrollmentEmail } from "@/lib/email";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { z } from "zod";

const sendEmailSchema = z.object({
  additionalRecipients: z.array(z.string().email()).optional().default([]),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only BHP and BHRF users can send enrollment emails
    if (session.user.role !== "BHP" && session.user.role !== "BHRF") {
      return NextResponse.json(
        { error: "Only BHP and facility users can send enrollment emails" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Validate request body
    const validatedData = sendEmailSchema.parse(body);

    let bhpEmail: string;
    let bhpName: string;
    let authorizedFacilityId: string | null = null;

    if (session.user.role === "BHP") {
      // Get BHP profile with user email
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      });

      if (!bhpProfile) {
        return NextResponse.json(
          { error: "BHP profile not found" },
          { status: 404 }
        );
      }

      bhpEmail = bhpProfile.user.email;
      bhpName = bhpProfile.user.name || "BHP";

      // For BHP, we'll verify ownership via facility.bhpId later
    } else {
      // BHRF user - get their facility and its BHP
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
        include: {
          facility: {
            include: {
              bhp: {
                include: {
                  user: {
                    select: {
                      email: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!bhrfProfile) {
        return NextResponse.json(
          { error: "Facility profile not found" },
          { status: 404 }
        );
      }

      bhpEmail = bhrfProfile.facility.bhp.user.email;
      bhpName = bhrfProfile.facility.bhp.user.name || "BHP";
      authorizedFacilityId = bhrfProfile.facilityId;
    }

    // Fetch the resident/intake with facility info
    const intake = await prisma.intake.findUnique({
      where: { id },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            bhpId: true,
          },
        },
      },
    });

    if (!intake) {
      return NextResponse.json(
        { error: "Resident not found" },
        { status: 404 }
      );
    }

    // Verify access to this resident
    if (session.user.role === "BHP") {
      // Get BHP profile to verify ownership
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile || intake.facility.bhpId !== bhpProfile.id) {
        return NextResponse.json(
          { error: "You do not have access to this resident" },
          { status: 403 }
        );
      }
    } else {
      // BHRF user - verify resident belongs to their facility
      if (intake.facilityId !== authorizedFacilityId) {
        return NextResponse.json(
          { error: "You do not have access to this resident" },
          { status: 403 }
        );
      }
    }

    // Build recipient list
    const recipients = [
      bhpEmail,
      ...validatedData.additionalRecipients,
    ];

    // Remove duplicates
    const uniqueRecipients = Array.from(new Set(recipients));

    // Format dates for email
    // Send the email (HIPAA compliant - no PHI like DOB or insurance info)
    const result = await sendEnrollmentEmail({
      to: uniqueRecipients,
      residentName: intake.residentName,
      facilityName: intake.facility.name,
      bhpName: bhpName,
    });

    // Create audit log for HIPAA compliance
    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.ENROLLMENT_EMAIL_SENT,
      entityType: "Intake",
      entityId: intake.id,
      details: {
        residentName: intake.residentName,
        recipients: uniqueRecipients,
        facilityName: intake.facility.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Enrollment email sent successfully",
      emailId: result.data?.id,
    });
  } catch (error) {
    console.error("Send enrollment email error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email addresses provided" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to send enrollment email" },
      { status: 500 }
    );
  }
}
