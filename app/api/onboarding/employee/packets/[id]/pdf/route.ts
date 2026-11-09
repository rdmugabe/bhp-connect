import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EmployeeOnboardingPDF } from "@/lib/pdf/employee-onboarding-template";
import { getFileFromS3 } from "@/lib/s3";
import { formatDateOnly, getTodayArizona } from "@/lib/date-utils";
import { createAuditLog } from "@/lib/audit";

async function fetchDataUri(key: string | null | undefined): Promise<string | undefined> {
  if (!key) return undefined;
  try {
    const { buffer, contentType } = await getFileFromS3(key);
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch (err) {
    console.error("Fetch signature failed:", err);
    return undefined;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "BHRF") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const bhrfProfile = await prisma.bHRFProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!bhrfProfile) {
    return NextResponse.json({ error: "Facility not found" }, { status: 404 });
  }

  const packet = await prisma.employeeOnboardingPacket.findUnique({
    where: { id },
    include: {
      facility: {
        select: { name: true, defaultAdminName: true, defaultAdminSignature: true },
      },
    },
  });
  if (!packet || packet.facilityId !== bhrfProfile.facilityId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [adminSignature, employeeSignature] = await Promise.all([
    fetchDataUri(packet.facility.defaultAdminSignature),
    fetchDataUri(packet.signatureKey),
  ]);

  const pdfBuffer = await renderToBuffer(
    EmployeeOnboardingPDF({
      data: {
        employeeName: packet.employeeName,
        hireDate: formatDateOnly(packet.hireDate.toISOString()),
        facilityName: packet.facility.name,
        adminName: packet.facility.defaultAdminName || undefined,
        adminSignature,
        employeeSignature,
        formData: (packet.formData ?? {}) as Record<string, string>,
      },
    })
  );

  await createAuditLog({
    userId: session.user.id,
    action: "EMPLOYEE_PACKET_PDF_DOWNLOADED",
    entityType: "EmployeeOnboardingPacket",
    entityId: packet.id,
    details: { employeeName: packet.employeeName },
  });

  const safeName = packet.employeeName.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30);
  const filename = `Employee_Onboarding_${safeName}_${getTodayArizona()}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
