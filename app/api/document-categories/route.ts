import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { documentCategorySchema } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get("facilityId");

    let categories;

    if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile) {
        return NextResponse.json({ categories: [] });
      }

      // BHP sees their own categories
      categories = await prisma.documentCategory.findMany({
        where: {
          bhpId: bhpProfile.id,
          isActive: true,
        },
        include: {
          _count: {
            select: { documents: true },
          },
        },
        orderBy: [{ isRequired: "desc" }, { name: "asc" }],
      });
    } else if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
        include: {
          facility: {
            include: {
              bhp: true,
            },
          },
        },
      });

      if (!bhrfProfile) {
        return NextResponse.json({ categories: [] });
      }

      // BHRF sees: BHP-required categories + their own facility categories
      categories = await prisma.documentCategory.findMany({
        where: {
          OR: [
            { bhpId: bhrfProfile.facility.bhpId }, // BHP categories
            { facilityId: bhrfProfile.facilityId }, // Facility's own categories
          ],
          isActive: true,
        },
        include: {
          _count: {
            select: { documents: true },
          },
        },
        orderBy: [{ isRequired: "desc" }, { name: "asc" }],
      });
    } else {
      return NextResponse.json({ categories: [] });
    }

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Get document categories error:", error);
    return NextResponse.json(
      { error: "Failed to fetch document categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = documentCategorySchema.parse(body);

    let category;

    if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile) {
        return NextResponse.json(
          { error: "BHP profile not found" },
          { status: 404 }
        );
      }

      // Check for duplicate name
      const existing = await prisma.documentCategory.findFirst({
        where: {
          bhpId: bhpProfile.id,
          name: validatedData.name,
          isActive: true,
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Category with this name already exists" },
          { status: 400 }
        );
      }

      category = await prisma.documentCategory.create({
        data: {
          ...validatedData,
          bhpId: bhpProfile.id,
        },
      });
    } else if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile) {
        return NextResponse.json(
          { error: "BHRF profile not found" },
          { status: 404 }
        );
      }

      // Check for duplicate name
      const existing = await prisma.documentCategory.findFirst({
        where: {
          facilityId: bhrfProfile.facilityId,
          name: validatedData.name,
          isActive: true,
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Category with this name already exists" },
          { status: 400 }
        );
      }

      // Facility-created categories are always optional (isRequired = false)
      category = await prisma.documentCategory.create({
        data: {
          ...validatedData,
          isRequired: false, // Facilities can't create required categories
          facilityId: bhrfProfile.facilityId,
        },
      });
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await createAuditLog({
      userId: session.user.id,
      action: "DOCUMENT_CATEGORY_CREATED",
      entityType: "DocumentCategory",
      entityId: category.id,
      details: { name: category.name, isRequired: category.isRequired },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Create document category error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create document category" },
      { status: 500 }
    );
  }
}
