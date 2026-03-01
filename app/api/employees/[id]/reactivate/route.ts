import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "BHRF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify the employee belongs to this facility
    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!bhrfProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const employee = await prisma.employee.findFirst({
      where: {
        id,
        facilityId: bhrfProfile.facilityId,
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    if (employee.isActive) {
      return NextResponse.json(
        { error: "Employee is already active" },
        { status: 400 }
      );
    }

    // Reactivate the employee
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: { isActive: true },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.EMPLOYEE_UPDATED,
      entityType: "Employee",
      entityId: updatedEmployee.id,
      details: {
        name: `${updatedEmployee.firstName} ${updatedEmployee.lastName}`,
        action: "reactivated",
      },
    });

    return NextResponse.json({ employee: updatedEmployee });
  } catch (error) {
    console.error("Reactivate employee error:", error);
    return NextResponse.json(
      { error: "Failed to reactivate employee" },
      { status: 500 }
    );
  }
}
