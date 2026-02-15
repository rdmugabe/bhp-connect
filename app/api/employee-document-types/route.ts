import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { employeeDocumentTypeSchema } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get("facilityId");

    let targetFacilityId: string | null = null;

    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile) {
        return NextResponse.json({ documentTypes: [] });
      }

      targetFacilityId = bhrfProfile.facilityId;
    } else if (session.user.role === "BHP" && facilityId) {
      // Verify BHP owns this facility
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile) {
        return NextResponse.json({ documentTypes: [] });
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
    }

    // Get default document types (facilityId = null) and facility-specific ones
    const documentTypes = await prisma.employeeDocumentType.findMany({
      where: {
        OR: [
          { facilityId: null, isDefault: true },
          ...(targetFacilityId ? [{ facilityId: targetFacilityId }] : []),
        ],
        isActive: true,
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });

    return NextResponse.json({ documentTypes });
  } catch (error) {
    console.error("Get document types error:", error);
    return NextResponse.json(
      { error: "Failed to fetch document types" },
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
    const validatedData = employeeDocumentTypeSchema.parse(body);

    // Check if name already exists for this facility
    const existing = await prisma.employeeDocumentType.findFirst({
      where: {
        facilityId: bhrfProfile.facilityId,
        name: validatedData.name,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Document type with this name already exists" },
        { status: 400 }
      );
    }

    const documentType = await prisma.employeeDocumentType.create({
      data: {
        ...validatedData,
        facilityId: bhrfProfile.facilityId,
        isDefault: false,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.EMPLOYEE_DOC_TYPE_CREATED,
      entityType: "EmployeeDocumentType",
      entityId: documentType.id,
      details: { name: documentType.name },
    });

    return NextResponse.json({ documentType }, { status: 201 });
  } catch (error) {
    console.error("Create document type error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create document type" },
      { status: 500 }
    );
  }
}
