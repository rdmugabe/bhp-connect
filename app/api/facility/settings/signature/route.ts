import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile, deleteFile, generateFileKey } from "@/lib/s3";

// POST - Upload signature image
export async function POST(request: NextRequest) {
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
            defaultAdminSignature: true,
          },
        },
      },
    });

    if (!bhrfProfile) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PNG and JPG are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 2MB for signature)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 2MB." },
        { status: 400 }
      );
    }

    // Delete old signature if exists
    if (bhrfProfile.facility.defaultAdminSignature) {
      try {
        await deleteFile(bhrfProfile.facility.defaultAdminSignature);
      } catch (error) {
        console.error("Error deleting old signature:", error);
      }
    }

    // Upload new signature
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileKey = generateFileKey(
      bhrfProfile.facilityId,
      "signature",
      file.name
    );

    await uploadFile(buffer, fileKey, file.type);

    // Update facility with new signature URL
    const updatedFacility = await prisma.facility.update({
      where: { id: bhrfProfile.facilityId },
      data: {
        defaultAdminSignature: fileKey,
      },
      select: {
        id: true,
        defaultAdminSignature: true,
      },
    });

    return NextResponse.json({
      success: true,
      signatureKey: updatedFacility.defaultAdminSignature,
    });
  } catch (error) {
    console.error("Upload signature error:", error);
    return NextResponse.json(
      { error: "Failed to upload signature" },
      { status: 500 }
    );
  }
}

// DELETE - Remove signature image
export async function DELETE(request: NextRequest) {
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
            defaultAdminSignature: true,
          },
        },
      },
    });

    if (!bhrfProfile) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 });
    }

    // Delete from S3
    if (bhrfProfile.facility.defaultAdminSignature) {
      try {
        await deleteFile(bhrfProfile.facility.defaultAdminSignature);
      } catch (error) {
        console.error("Error deleting signature from S3:", error);
      }
    }

    // Update facility to remove signature
    await prisma.facility.update({
      where: { id: bhrfProfile.facilityId },
      data: {
        defaultAdminSignature: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete signature error:", error);
    return NextResponse.json(
      { error: "Failed to delete signature" },
      { status: 500 }
    );
  }
}
