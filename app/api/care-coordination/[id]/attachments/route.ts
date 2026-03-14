import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToS3, generateFileKey, deleteFromS3 } from "@/lib/s3";
import { createAuditLog, AuditActions } from "@/lib/audit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "BHRF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: entryId } = await params;

    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!bhrfProfile) {
      return NextResponse.json(
        { error: "Facility not assigned" },
        { status: 400 }
      );
    }

    // Verify the entry exists and belongs to the facility
    const entry = await prisma.careCoordinationEntry.findUnique({
      where: { id: entryId },
      include: {
        intake: {
          select: {
            residentName: true,
          },
        },
      },
    });

    if (!entry || entry.facilityId !== bhrfProfile.facilityId) {
      return NextResponse.json(
        { error: "Entry not found or unauthorized" },
        { status: 404 }
      );
    }

    if (entry.archivedAt) {
      return NextResponse.json(
        { error: "Cannot add attachments to archived entry" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, images, Word, Excel, text files" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate S3 key with entry ID in path
    const key = generateFileKey(
      "care-coordination",
      `${bhrfProfile.facilityId}/${entryId}`,
      file.name
    );

    // Upload to S3
    await uploadToS3({
      key,
      body: buffer,
      contentType: file.type,
    });

    // Create attachment record
    const attachment = await prisma.careCoordinationAttachment.create({
      data: {
        entryId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileUrl: key,
        uploadedById: session.user.id,
        uploadedByName: session.user.name || "Unknown",
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.CARE_COORDINATION_ATTACHMENT_UPLOADED,
      entityType: "CareCoordinationAttachment",
      entityId: attachment.id,
      details: {
        entryId,
        residentName: entry.intake.residentName,
        fileName: file.name,
        fileSize: file.size,
      },
    });

    return NextResponse.json({ attachment }, { status: 201 });
  } catch (error) {
    console.error("Upload care coordination attachment error:", error);
    return NextResponse.json(
      { error: "Failed to upload attachment" },
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

    const { id: entryId } = await params;
    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get("attachmentId");

    if (!attachmentId) {
      return NextResponse.json(
        { error: "Attachment ID is required" },
        { status: 400 }
      );
    }

    const bhrfProfile = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!bhrfProfile) {
      return NextResponse.json(
        { error: "Facility not assigned" },
        { status: 400 }
      );
    }

    // Verify the attachment exists and belongs to an entry in this facility
    const attachment = await prisma.careCoordinationAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        entry: {
          include: {
            intake: {
              select: {
                residentName: true,
              },
            },
          },
        },
      },
    });

    if (!attachment || attachment.entry.facilityId !== bhrfProfile.facilityId) {
      return NextResponse.json(
        { error: "Attachment not found or unauthorized" },
        { status: 404 }
      );
    }

    if (attachment.entryId !== entryId) {
      return NextResponse.json(
        { error: "Attachment does not belong to this entry" },
        { status: 400 }
      );
    }

    if (attachment.entry.archivedAt) {
      return NextResponse.json(
        { error: "Cannot delete attachments from archived entry" },
        { status: 400 }
      );
    }

    // Delete from S3
    await deleteFromS3(attachment.fileUrl);

    // Delete from database
    await prisma.careCoordinationAttachment.delete({
      where: { id: attachmentId },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.CARE_COORDINATION_ATTACHMENT_DELETED,
      entityType: "CareCoordinationAttachment",
      entityId: attachmentId,
      details: {
        entryId,
        residentName: attachment.entry.intake.residentName,
        fileName: attachment.fileName,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete care coordination attachment error:", error);
    return NextResponse.json(
      { error: "Failed to delete attachment" },
      { status: 500 }
    );
  }
}
