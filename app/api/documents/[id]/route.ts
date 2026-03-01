import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { deleteFromS3 } from "@/lib/s3";
import { z } from "zod";

const updateDocumentSchema = z.object({
  ownerType: z.enum(["FACILITY", "EMPLOYEE", "RESIDENT"]),
  employeeId: z.string().nullable().optional(),
  intakeId: z.string().nullable().optional(),
  name: z.string().optional(),
  expiresAt: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: documentId } = await params;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        facility: true,
        category: true,
        employee: {
          select: { id: true, firstName: true, lastName: true },
        },
        intake: {
          select: { id: true, residentName: true },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Authorization check based on role
    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile || bhrfProfile.facilityId !== document.facilityId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile || document.facility.bhpId !== bhpProfile.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error("Get document error:", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: documentId } = await params;

    // Find the document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        facility: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Authorization check based on role
    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile || bhrfProfile.facilityId !== document.facilityId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile || document.facility.bhpId !== bhpProfile.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateDocumentSchema.parse(body);

    // Validate employee/intake ownership
    if (validatedData.ownerType === "EMPLOYEE" && validatedData.employeeId) {
      const employee = await prisma.employee.findFirst({
        where: {
          id: validatedData.employeeId,
          facilityId: document.facilityId,
        },
      });
      if (!employee) {
        return NextResponse.json(
          { error: "Employee not found in this facility" },
          { status: 400 }
        );
      }
    }

    if (validatedData.ownerType === "RESIDENT" && validatedData.intakeId) {
      const intake = await prisma.intake.findFirst({
        where: {
          id: validatedData.intakeId,
          facilityId: document.facilityId,
        },
      });
      if (!intake) {
        return NextResponse.json(
          { error: "Resident not found in this facility" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: {
      ownerType: "FACILITY" | "EMPLOYEE" | "RESIDENT";
      employeeId: string | null;
      intakeId: string | null;
      name?: string;
      expiresAt?: Date | null;
      categoryId?: string | null;
    } = {
      ownerType: validatedData.ownerType,
      employeeId: validatedData.ownerType === "EMPLOYEE" ? validatedData.employeeId || null : null,
      intakeId: validatedData.ownerType === "RESIDENT" ? validatedData.intakeId || null : null,
    };

    if (validatedData.name) {
      updateData.name = validatedData.name;
    }

    if (validatedData.expiresAt !== undefined) {
      updateData.expiresAt = validatedData.expiresAt ? new Date(validatedData.expiresAt) : null;
    }

    if (validatedData.categoryId !== undefined) {
      updateData.categoryId = validatedData.categoryId;
    }

    // Update the document
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: updateData,
      include: {
        category: true,
        employee: {
          select: { id: true, firstName: true, lastName: true },
        },
        intake: {
          select: { id: true, residentName: true },
        },
      },
    });

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.DOCUMENT_UPDATED,
      entityType: "Document",
      entityId: documentId,
      details: {
        name: updatedDocument.name,
        ownerType: updatedDocument.ownerType,
        employeeId: updatedDocument.employeeId,
        intakeId: updatedDocument.intakeId,
      },
    });

    return NextResponse.json({ document: updatedDocument });
  } catch (error) {
    console.error("Update document error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.issues },
        { status: 400 }
      );
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

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: documentId } = await params;

    // Find the document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        facility: true,
        versions: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Authorization check based on role
    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile || bhrfProfile.facilityId !== document.facilityId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile || document.facility.bhpId !== bhpProfile.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete file from S3 if it exists
    if (document.fileUrl) {
      try {
        await deleteFromS3(document.fileUrl);
      } catch (s3Error) {
        console.error("Failed to delete file from S3:", s3Error);
        // Continue with database deletion even if S3 deletion fails
      }
    }

    // Delete any version files from S3
    for (const version of document.versions) {
      if (version.fileUrl) {
        try {
          await deleteFromS3(version.fileUrl);
        } catch (s3Error) {
          console.error("Failed to delete version file from S3:", s3Error);
        }
      }
    }

    // Delete document versions first (due to foreign key constraint)
    await prisma.documentVersion.deleteMany({
      where: { documentId },
    });

    // Delete the document
    await prisma.document.delete({
      where: { id: documentId },
    });

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.DOCUMENT_DELETED,
      entityType: "Document",
      entityId: documentId,
      details: { name: document.name, facilityId: document.facilityId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete document error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
