import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { employeeSchema } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get("facilityId");
    const includeInactive = searchParams.get("includeInactive") === "true";

    let targetFacilityId: string | null = null;
    let bhpEmail: string | null = null;

    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
        include: {
          facility: {
            include: {
              bhp: {
                include: {
                  user: {
                    select: { email: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!bhrfProfile) {
        return NextResponse.json({ employees: [] });
      }

      targetFacilityId = bhrfProfile.facilityId;
      bhpEmail = bhrfProfile.facility.bhp.user.email;
    } else if (session.user.role === "BHP") {
      if (!facilityId) {
        return NextResponse.json(
          { error: "facilityId required for BHP users" },
          { status: 400 }
        );
      }

      // Verify BHP owns this facility
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
        include: {
          user: {
            select: { email: true },
          },
        },
      });

      if (!bhpProfile) {
        return NextResponse.json({ employees: [] });
      }

      const facility = await prisma.facility.findFirst({
        where: {
          id: facilityId,
          bhpId: bhpProfile.id,
        },
      });

      if (!facility) {
        return NextResponse.json(
          { error: "Facility not found" },
          { status: 404 }
        );
      }

      targetFacilityId = facilityId;
      bhpEmail = bhpProfile.user.email;
    }

    if (!targetFacilityId) {
      return NextResponse.json({ employees: [] });
    }

    const employees = await prisma.employee.findMany({
      where: {
        facilityId: targetFacilityId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        employeeDocuments: {
          include: {
            documentType: true,
          },
        },
      },
      orderBy: { lastName: "asc" },
    });

    // Calculate compliance status for each employee
    const employeesWithCompliance = employees.map((employee) => {
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      let hasExpired = false;
      let hasExpiringSoon = false;

      employee.employeeDocuments.forEach((doc) => {
        if (doc.noExpiration) return;
        if (doc.expiresAt) {
          if (doc.expiresAt < now) {
            hasExpired = true;
          } else if (doc.expiresAt <= thirtyDaysFromNow) {
            hasExpiringSoon = true;
          }
        }
      });

      return {
        ...employee,
        complianceStatus: hasExpired
          ? "EXPIRED"
          : hasExpiringSoon
          ? "EXPIRING_SOON"
          : "VALID",
      };
    });

    return NextResponse.json({ employees: employeesWithCompliance, bhpEmail });
  } catch (error) {
    console.error("Get employees error:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
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
    });

    if (!bhrfProfile) {
      return NextResponse.json(
        { error: "BHRF profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = employeeSchema.parse(body);

    const employee = await prisma.employee.create({
      data: {
        ...validatedData,
        email: validatedData.email || null,
        hireDate: validatedData.hireDate
          ? new Date(validatedData.hireDate)
          : null,
        facilityId: bhrfProfile.facilityId,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.EMPLOYEE_CREATED,
      entityType: "Employee",
      entityId: employee.id,
      details: { name: `${employee.firstName} ${employee.lastName}` },
    });

    return NextResponse.json({ employee }, { status: 201 });
  } catch (error) {
    console.error("Create employee error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    );
  }
}
