import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { employeeDocumentSchema } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json(
        { error: "employeeId is required" },
        { status: 400 }
      );
    }

    // Verify access to employee
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        facility: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ documents: [] });
    }

    let hasAccess = false;

    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      hasAccess = bhrfProfile?.facilityId === employee.facilityId;
    } else if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      hasAccess = bhpProfile?.id === employee.facility.bhpId;
    }

    if (!hasAccess) {
      return NextResponse.json({ documents: [] });
    }

    const documents = await prisma.employeeDocument.findMany({
      where: { employeeId },
      include: {
        documentType: true,
      },
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Get employee documents error:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
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
    const { employeeId, fileUrl, ...rest } = body;

    if (!employeeId || !fileUrl) {
      return NextResponse.json(
        { error: "employeeId and fileUrl are required" },
        { status: 400 }
      );
    }

    // Verify employee belongs to this facility
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        facilityId: bhrfProfile.facilityId,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    const validatedData = employeeDocumentSchema.parse(rest);

    // Verify document type is valid for this facility
    const documentType = await prisma.employeeDocumentType.findFirst({
      where: {
        id: validatedData.documentTypeId,
        OR: [{ facilityId: null }, { facilityId: bhrfProfile.facilityId }],
        isActive: true,
      },
    });

    if (!documentType) {
      return NextResponse.json(
        { error: "Invalid document type" },
        { status: 400 }
      );
    }

    // Calculate status
    let status: "VALID" | "EXPIRING_SOON" | "EXPIRED" = "VALID";
    if (!validatedData.noExpiration && validatedData.expiresAt) {
      const expiresAt = new Date(validatedData.expiresAt);
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      if (expiresAt < now) {
        status = "EXPIRED";
      } else if (expiresAt <= thirtyDaysFromNow) {
        status = "EXPIRING_SOON";
      }
    }

    const document = await prisma.employeeDocument.create({
      data: {
        employeeId,
        documentTypeId: validatedData.documentTypeId,
        fileUrl,
        issuedAt: new Date(validatedData.issuedAt),
        expiresAt: validatedData.noExpiration
          ? null
          : validatedData.expiresAt
          ? new Date(validatedData.expiresAt)
          : null,
        noExpiration: validatedData.noExpiration,
        status,
        uploadedBy: session.user.id,
        notes: validatedData.notes || null,
      },
      include: {
        documentType: true,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.EMPLOYEE_DOCUMENT_UPLOADED,
      entityType: "EmployeeDocument",
      entityId: document.id,
      details: {
        employeeId,
        documentType: documentType.name,
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error("Create employee document error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}
