import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { documentRequestSchema } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get("facilityId");
    const status = searchParams.get("status");
    const ownerType = searchParams.get("ownerType");

    let documents;

    if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile) {
        return NextResponse.json({ documents: [] });
      }

      documents = await prisma.document.findMany({
        where: {
          facility: {
            bhpId: bhpProfile.id,
            ...(facilityId && { id: facilityId }),
          },
          ...(status && { status: status as any }),
          ...(ownerType && { ownerType: ownerType as any }),
        },
        include: {
          facility: {
            select: {
              id: true,
              name: true,
            },
          },
          category: true,
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          intake: {
            select: {
              id: true,
              residentName: true,
            },
          },
          versions: {
            orderBy: { uploadedAt: "desc" },
          },
        },
        orderBy: { uploadedAt: "desc" },
      });
    } else if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile) {
        return NextResponse.json({ documents: [] });
      }

      documents = await prisma.document.findMany({
        where: {
          facilityId: bhrfProfile.facilityId,
          ...(status && { status: status as any }),
          ...(ownerType && { ownerType: ownerType as any }),
        },
        include: {
          facility: {
            select: {
              id: true,
              name: true,
            },
          },
          category: true,
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          intake: {
            select: {
              id: true,
              residentName: true,
            },
          },
          versions: {
            orderBy: { uploadedAt: "desc" },
          },
        },
        orderBy: { uploadedAt: "desc" },
      });
    }

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Get documents error:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

// BHP requests a document from BHRF, or BHRF uploads a document
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // BHRF uploading a document
    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile) {
        return NextResponse.json(
          { error: "BHRF profile not found" },
          { status: 404 }
        );
      }

      const { name, type, categoryId, fileUrl, expiresAt, ownerType, employeeId, intakeId } = body;

      if (!name || !fileUrl) {
        return NextResponse.json(
          { error: "Name and file URL are required" },
          { status: 400 }
        );
      }

      // If categoryId provided, verify it's accessible to this facility
      if (categoryId) {
        const category = await prisma.documentCategory.findFirst({
          where: {
            id: categoryId,
            isActive: true,
            OR: [
              { facilityId: bhrfProfile.facilityId },
              {
                bhp: {
                  facilities: {
                    some: { id: bhrfProfile.facilityId },
                  },
                },
              },
            ],
          },
        });

        if (!category) {
          return NextResponse.json(
            { error: "Invalid category" },
            { status: 400 }
          );
        }
      }

      // Validate employee belongs to facility
      if (employeeId) {
        const employee = await prisma.employee.findFirst({
          where: { id: employeeId, facilityId: bhrfProfile.facilityId },
        });
        if (!employee) {
          return NextResponse.json({ error: "Invalid employee" }, { status: 400 });
        }
      }

      // Validate intake belongs to facility
      if (intakeId) {
        const intake = await prisma.intake.findFirst({
          where: { id: intakeId, facilityId: bhrfProfile.facilityId },
        });
        if (!intake) {
          return NextResponse.json({ error: "Invalid resident" }, { status: 400 });
        }
      }

      const document = await prisma.document.create({
        data: {
          facilityId: bhrfProfile.facilityId,
          name,
          type: type || "Other",
          categoryId: categoryId || null,
          fileUrl,
          status: "UPLOADED",
          uploadedAt: new Date(),
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          ownerType: ownerType || "FACILITY",
          employeeId: employeeId || null,
          intakeId: intakeId || null,
        },
        include: {
          category: true,
          employee: true,
          intake: true,
        },
      });

      await createAuditLog({
        userId: session.user.id,
        action: AuditActions.DOCUMENT_UPLOADED,
        entityType: "Document",
        entityId: document.id,
        details: { name: document.name, categoryId: categoryId || null },
      });

      return NextResponse.json({ document }, { status: 201 });
    }

    // BHP requesting a document from facility
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

      const { facilityId, ...validatedData } = body;

      documentRequestSchema.parse(validatedData);

      // Verify facility belongs to this BHP
      const facility = await prisma.facility.findUnique({
        where: { id: facilityId },
      });

      if (!facility || facility.bhpId !== bhpProfile.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const document = await prisma.document.create({
        data: {
          facilityId,
          name: validatedData.name,
          type: validatedData.type,
          categoryId: validatedData.categoryId || null,
          status: "REQUESTED",
          requestedBy: session.user.id,
          requestedAt: new Date(),
        },
      });

      await createAuditLog({
        userId: session.user.id,
        action: AuditActions.DOCUMENT_REQUESTED,
        entityType: "Document",
        entityId: document.id,
        details: { name: document.name, facilityId },
      });

      return NextResponse.json({ document }, { status: 201 });
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } catch (error) {
    console.error("Document operation error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to process document" },
      { status: 500 }
    );
  }
}
