import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmployeeEmail } from "@/lib/email";
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

    // Only BHP and BHRF users can send employee emails
    if (session.user.role !== "BHP" && session.user.role !== "BHRF") {
      return NextResponse.json(
        { error: "Only BHP and facility users can send employee emails" },
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

    // Fetch the employee with facility info
    const employee = await prisma.employee.findUnique({
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

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Verify access to this employee
    if (session.user.role === "BHP") {
      // Get BHP profile to verify ownership
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile || employee.facility.bhpId !== bhpProfile.id) {
        return NextResponse.json(
          { error: "You do not have access to this employee" },
          { status: 403 }
        );
      }
    } else {
      // BHRF user - verify employee belongs to their facility
      if (employee.facilityId !== authorizedFacilityId) {
        return NextResponse.json(
          { error: "You do not have access to this employee" },
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

    // Format hire date
    const formatDate = (date: Date | null) => {
      if (!date) return null;
      const d = new Date(date);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
    };

    const employeeName = `${employee.firstName} ${employee.lastName}`;

    // Send the email
    const result = await sendEmployeeEmail({
      to: uniqueRecipients,
      employeeName,
      position: employee.position,
      facilityName: employee.facility.name,
      hireDate: formatDate(employee.hireDate),
      bhpName: bhpName,
      bhpEmail: bhpEmail,
    });

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.EMPLOYEE_EMAIL_SENT,
      entityType: "Employee",
      entityId: employee.id,
      details: {
        employeeName,
        recipients: uniqueRecipients,
        facilityName: employee.facility.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Employee email sent successfully",
      emailId: result.data?.id,
    });
  } catch (error) {
    console.error("Send employee email error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email addresses provided" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to send employee email" },
      { status: 500 }
    );
  }
}
