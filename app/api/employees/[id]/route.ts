import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { employeeSchema } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";

async function verifyAccess(
  userId: string,
  role: string,
  employeeId: string
): Promise<{ authorized: boolean; employee?: { id: string; facilityId: string } }> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      facility: true,
    },
  });

  if (!employee) {
    return { authorized: false };
  }

  if (role === "BHRF") {
    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId },
    });

    if (!bhrfProfile || bhrfProfile.facilityId !== employee.facilityId) {
      return { authorized: false };
    }

    return { authorized: true, employee };
  }

  if (role === "BHP") {
    const bhpProfile = await prisma.bHPProfile.findUnique({
      where: { userId },
    });

    if (!bhpProfile || employee.facility.bhpId !== bhpProfile.id) {
      return { authorized: false };
    }

    return { authorized: true, employee };
  }

  return { authorized: false };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { authorized } = await verifyAccess(
      session.user.id,
      session.user.role,
      id
    );

    if (!authorized) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        employeeDocuments: {
          include: {
            documentType: true,
          },
          orderBy: { uploadedAt: "desc" },
        },
        facility: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ employee });
  } catch (error) {
    console.error("Get employee error:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "BHRF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { authorized, employee: existingEmployee } = await verifyAccess(
      session.user.id,
      session.user.role,
      id
    );

    if (!authorized || !existingEmployee) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = employeeSchema.parse(body);

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...validatedData,
        email: validatedData.email || null,
        hireDate: validatedData.hireDate
          ? new Date(validatedData.hireDate)
          : null,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.EMPLOYEE_UPDATED,
      entityType: "Employee",
      entityId: employee.id,
      details: { name: `${employee.firstName} ${employee.lastName}` },
    });

    return NextResponse.json({ employee });
  } catch (error) {
    console.error("Update employee error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update employee" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "BHRF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { authorized, employee: existingEmployee } = await verifyAccess(
      session.user.id,
      session.user.role,
      id
    );

    if (!authorized || !existingEmployee) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Soft delete - just deactivate
    const employee = await prisma.employee.update({
      where: { id },
      data: { isActive: false },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.EMPLOYEE_DEACTIVATED,
      entityType: "Employee",
      entityId: employee.id,
      details: { name: `${employee.firstName} ${employee.lastName}` },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete employee error:", error);
    return NextResponse.json(
      { error: "Failed to deactivate employee" },
      { status: 500 }
    );
  }
}
