import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { employeeDocumentSchema } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";

async function verifyDocumentAccess(
  userId: string,
  documentId: string
): Promise<{ authorized: boolean; document?: { id: string; employeeId: string } }> {
  const document = await prisma.employeeDocument.findUnique({
    where: { id: documentId },
    include: {
      employee: {
        include: {
          facility: true,
        },
      },
    },
  });

  if (!document) {
    return { authorized: false };
  }

  const bhrfProfile = await prisma.bHRFProfile.findUnique({
    where: { userId },
  });

  if (!bhrfProfile || bhrfProfile.facilityId !== document.employee.facilityId) {
    return { authorized: false };
  }

  return { authorized: true, document };
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
    const { authorized, document: existingDoc } = await verifyDocumentAccess(
      session.user.id,
      id
    );

    if (!authorized || !existingDoc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const { fileUrl, ...rest } = body;
    const validatedData = employeeDocumentSchema.parse(rest);

    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });

    // Verify document type is valid
    const documentType = await prisma.employeeDocumentType.findFirst({
      where: {
        id: validatedData.documentTypeId,
        OR: [{ facilityId: null }, { facilityId: bhrfProfile?.facilityId }],
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

    const document = await prisma.employeeDocument.update({
      where: { id },
      data: {
        documentTypeId: validatedData.documentTypeId,
        ...(fileUrl && { fileUrl }),
        issuedAt: new Date(validatedData.issuedAt),
        expiresAt: validatedData.noExpiration
          ? null
          : validatedData.expiresAt
          ? new Date(validatedData.expiresAt)
          : null,
        noExpiration: validatedData.noExpiration,
        status,
        notes: validatedData.notes || null,
      },
      include: {
        documentType: true,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.EMPLOYEE_DOCUMENT_UPDATED,
      entityType: "EmployeeDocument",
      entityId: document.id,
      details: {
        documentType: documentType.name,
      },
    });

    return NextResponse.json({ document });
  } catch (error) {
    console.error("Update employee document error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update document" },
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
    const { authorized } = await verifyDocumentAccess(session.user.id, id);

    if (!authorized) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const document = await prisma.employeeDocument.delete({
      where: { id },
      include: {
        documentType: true,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.EMPLOYEE_DOCUMENT_DELETED,
      entityType: "EmployeeDocument",
      entityId: id,
      details: {
        documentType: document.documentType.name,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete employee document error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
