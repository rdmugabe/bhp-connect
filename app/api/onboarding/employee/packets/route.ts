import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/api-utils";
import { createAuditLog } from "@/lib/audit";

/**
 * Create a new employee onboarding packet. The admin fills in employeeName
 * and hireDate; we persist the packet and return a signing token the admin
 * can share with the employee.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "BHRF") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bhrfProfile = await prisma.bHRFProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!bhrfProfile) {
    return NextResponse.json({ error: "Facility not found" }, { status: 404 });
  }

  const parseResult = await parseJsonBody<{ employeeName?: string; hireDate?: string }>(request);
  if (!parseResult.success) return parseResult.error;

  const { employeeName, hireDate } = parseResult.data;
  if (!employeeName?.trim()) {
    return NextResponse.json({ error: "Employee name required" }, { status: 400 });
  }
  if (!hireDate) {
    return NextResponse.json({ error: "Hire date required" }, { status: 400 });
  }
  const hireDateDate = new Date(hireDate);
  if (Number.isNaN(hireDateDate.getTime())) {
    return NextResponse.json({ error: "Invalid hire date" }, { status: 400 });
  }

  const token = randomBytes(24).toString("base64url");

  const packet = await prisma.employeeOnboardingPacket.create({
    data: {
      facilityId: bhrfProfile.facilityId,
      employeeName: employeeName.trim(),
      hireDate: hireDateDate,
      signingToken: token,
      createdBy: session.user.id,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    action: "EMPLOYEE_PACKET_CREATED",
    entityType: "EmployeeOnboardingPacket",
    entityId: packet.id,
    details: { employeeName: packet.employeeName, hireDate: packet.hireDate },
  });

  return NextResponse.json({ packet });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "BHRF") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bhrfProfile = await prisma.bHRFProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!bhrfProfile) {
    return NextResponse.json({ packets: [] });
  }

  const packets = await prisma.employeeOnboardingPacket.findMany({
    where: { facilityId: bhrfProfile.facilityId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ packets });
}
