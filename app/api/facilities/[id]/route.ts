import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { facilitySchema } from "@/lib/validations";
import { createAuditLog, AuditActions } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const facility = await prisma.facility.findUnique({
      where: { id: params.id },
      include: {
        bhp: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            credentials: {
              where: { isPublic: true },
            },
          },
        },
        owner: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        intakes: {
          orderBy: { createdAt: "desc" },
        },
        documents: {
          orderBy: { uploadedAt: "desc" },
        },
      },
    });

    if (!facility) {
      return NextResponse.json(
        { error: "Facility not found" },
        { status: 404 }
      );
    }

    // Authorization check
    if (session.user.role === "BHP") {
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (facility.bhpId !== bhpProfile?.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (facility.id !== bhrfProfile?.facilityId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({ facility });
  } catch (error) {
    console.error("Get facility error:", error);
    return NextResponse.json(
      { error: "Failed to fetch facility" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "BHP") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bhpProfile = await prisma.bHPProfile.findUnique({
      where: { userId: session.user.id },
    });

    const facility = await prisma.facility.findUnique({
      where: { id: params.id },
    });

    if (!facility || facility.bhpId !== bhpProfile?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = facilitySchema.parse(body);

    const updatedFacility = await prisma.facility.update({
      where: { id: params.id },
      data: validatedData,
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.FACILITY_UPDATED,
      entityType: "Facility",
      entityId: facility.id,
      details: { changes: validatedData },
    });

    return NextResponse.json({ facility: updatedFacility });
  } catch (error) {
    console.error("Update facility error:", error);
    return NextResponse.json(
      { error: "Failed to update facility" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "BHP") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bhpProfile = await prisma.bHPProfile.findUnique({
      where: { userId: session.user.id },
    });

    const facility = await prisma.facility.findUnique({
      where: { id: params.id },
    });

    if (!facility || facility.bhpId !== bhpProfile?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.facility.delete({
      where: { id: params.id },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.FACILITY_DELETED,
      entityType: "Facility",
      entityId: params.id,
      details: { name: facility.name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete facility error:", error);
    return NextResponse.json(
      { error: "Failed to delete facility" },
      { status: 500 }
    );
  }
}
