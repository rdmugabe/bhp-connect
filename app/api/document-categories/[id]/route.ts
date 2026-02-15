import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { documentCategorySchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = documentCategorySchema.parse(body);

    // Verify ownership
    const existingCategory = await prisma.documentCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile || existingCategory.bhpId !== bhpProfile.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Check for duplicate name (excluding current)
      const duplicate = await prisma.documentCategory.findFirst({
        where: {
          bhpId: bhpProfile.id,
          name: validatedData.name,
          id: { not: id },
          isActive: true,
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "Category with this name already exists" },
          { status: 400 }
        );
      }
    } else if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile || existingCategory.facilityId !== bhrfProfile.facilityId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Check for duplicate name (excluding current)
      const duplicate = await prisma.documentCategory.findFirst({
        where: {
          facilityId: bhrfProfile.facilityId,
          name: validatedData.name,
          id: { not: id },
          isActive: true,
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "Category with this name already exists" },
          { status: 400 }
        );
      }

      // Facilities can't make categories required
      validatedData.isRequired = false;
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const category = await prisma.documentCategory.update({
      where: { id },
      data: validatedData,
    });

    await createAuditLog({
      userId: session.user.id,
      action: "DOCUMENT_CATEGORY_UPDATED",
      entityType: "DocumentCategory",
      entityId: category.id,
      details: { name: category.name, isRequired: category.isRequired },
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Update document category error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update document category" },
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

    const { id } = await params;

    // Verify ownership
    const existingCategory = await prisma.documentCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile || existingCategory.bhpId !== bhpProfile.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile || existingCategory.facilityId !== bhrfProfile.facilityId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if any documents use this category
    const documentsCount = await prisma.document.count({
      where: { categoryId: id },
    });

    if (documentsCount > 0) {
      // Soft delete - deactivate
      await prisma.documentCategory.update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      // Hard delete if no documents use it
      await prisma.documentCategory.delete({
        where: { id },
      });
    }

    await createAuditLog({
      userId: session.user.id,
      action: "DOCUMENT_CATEGORY_DELETED",
      entityType: "DocumentCategory",
      entityId: id,
      details: { name: existingCategory.name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete document category error:", error);
    return NextResponse.json(
      { error: "Failed to delete document category" },
      { status: 500 }
    );
  }
}
