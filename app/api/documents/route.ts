import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { documentRequestSchema, bhrfDocumentUploadSchema } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { parseJsonBody } from "@/lib/api-utils";
import { z } from "zod";

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

    const parseResult = await parseJsonBody(request);
    if (!parseResult.success) {
      return parseResult.error;
    }
    const body = parseResult.data as Record<string, unknown>;

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

      // Validate input using schema
      const validationResult = bhrfDocumentUploadSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: "Invalid input data",
            details: validationResult.error.issues
          },
          { status: 400 }
        );
      }

      const { name, type, categoryId, fileUrl, expiresAt, ownerType, employeeId, intakeId } = validationResult.data;

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

      const { facilityId, ...restData } = body;

      // Validate facilityId is a string
      if (typeof facilityId !== "string" || !facilityId) {
        return NextResponse.json(
          { error: "Invalid input data", details: [{ path: ["facilityId"], message: "Facility ID is required" }] },
          { status: 400 }
        );
      }

      const validatedData = documentRequestSchema.parse(restData);

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
          categoryId: (restData as Record<string, unknown>).categoryId as string || null,
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

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process document" },
      { status: 500 }
    );
  }
}
