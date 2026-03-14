import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET facility settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "BHRF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            defaultAdminName: true,
            defaultAdminSignature: true,
          },
        },
      },
    });

    if (!bhrfProfile) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 });
    }

    return NextResponse.json({
      facility: bhrfProfile.facility,
    });
  } catch (error) {
    console.error("Get facility settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch facility settings" },
      { status: 500 }
    );
  }
}

// PATCH to update facility settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "BHRF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!bhrfProfile) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 });
    }

    const body = await request.json();
    const { defaultAdminName } = body;

    const updatedFacility = await prisma.facility.update({
      where: { id: bhrfProfile.facilityId },
      data: {
        defaultAdminName: defaultAdminName?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        defaultAdminName: true,
        defaultAdminSignature: true,
      },
    });

    return NextResponse.json({
      facility: updatedFacility,
    });
  } catch (error) {
    console.error("Update facility settings error:", error);
    return NextResponse.json(
      { error: "Failed to update facility settings" },
      { status: 500 }
    );
  }
}
