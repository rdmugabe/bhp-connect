import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { employeeDocumentTypeSchema } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";

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

    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!bhrfProfile) {
      return NextResponse.json(
        { error: "BHRF profile not found" },
        { status: 404 }
      );
    }

    // Only allow editing facility-specific document types (not defaults)
    const existingType = await prisma.employeeDocumentType.findFirst({
      where: {
        id,
        facilityId: bhrfProfile.facilityId,
        isDefault: false,
      },
    });

    if (!existingType) {
      return NextResponse.json(
        { error: "Document type not found or cannot be edited" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = employeeDocumentTypeSchema.parse(body);

    // Check if name already exists for this facility (excluding current)
    const duplicate = await prisma.employeeDocumentType.findFirst({
      where: {
        facilityId: bhrfProfile.facilityId,
        name: validatedData.name,
        id: { not: id },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "Document type with this name already exists" },
        { status: 400 }
      );
    }

    const documentType = await prisma.employeeDocumentType.update({
      where: { id },
      data: validatedData,
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.EMPLOYEE_DOC_TYPE_UPDATED,
      entityType: "EmployeeDocumentType",
      entityId: documentType.id,
      details: { name: documentType.name },
    });

    return NextResponse.json({ documentType });
  } catch (error) {
    console.error("Update document type error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update document type" },
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

    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!bhrfProfile) {
      return NextResponse.json(
        { error: "BHRF profile not found" },
        { status: 404 }
      );
    }

    // Only allow deleting facility-specific document types (not defaults)
    const existingType = await prisma.employeeDocumentType.findFirst({
      where: {
        id,
        facilityId: bhrfProfile.facilityId,
        isDefault: false,
      },
    });

    if (!existingType) {
      return NextResponse.json(
        { error: "Document type not found or cannot be deleted" },
        { status: 404 }
      );
    }

    // Check if any documents use this type
    const documentsCount = await prisma.employeeDocument.count({
      where: { documentTypeId: id },
    });

    if (documentsCount > 0) {
      // Soft delete - just deactivate
      await prisma.employeeDocumentType.update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      // Hard delete if no documents use it
      await prisma.employeeDocumentType.delete({
        where: { id },
      });
    }

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.EMPLOYEE_DOC_TYPE_DELETED,
      entityType: "EmployeeDocumentType",
      entityId: id,
      details: { name: existingType.name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete document type error:", error);
    return NextResponse.json(
      { error: "Failed to delete document type" },
      { status: 500 }
    );
  }
}
