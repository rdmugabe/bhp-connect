import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToS3, generateFileKey } from "@/lib/s3";
import { createAuditLog, AuditActions } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // 'credential' or 'document'
    const entityId = formData.get("entityId") as string | null;
    const expiresAt = formData.get("expiresAt") as string | null;

    if (!file || !type) {
      return NextResponse.json(
        { error: "File and type are required" },
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
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate S3 key
    const fileType = type === "credential" ? "credentials" : "documents";
    const key = generateFileKey(fileType, session.user.id, file.name);

    // Upload to S3
    await uploadToS3({
      key,
      body: buffer,
      contentType: file.type,
    });

    const fileUrl = key;

    // Update database based on type
    if (type === "credential") {
      // Handle credential upload (BHP)
      const credentialData = formData.get("credentialData");
      if (credentialData) {
        const data = JSON.parse(credentialData as string);
        const bhpProfile = await prisma.bHPProfile.findUnique({
          where: { userId: session.user.id },
        });

        if (!bhpProfile) {
          return NextResponse.json(
            { error: "BHP profile not found" },
            { status: 404 }
          );
        }

        const credential = await prisma.credential.create({
          data: {
            bhpId: bhpProfile.id,
            type: data.type,
            name: data.name,
            fileUrl,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            isPublic: data.isPublic ?? true,
          },
        });

        await createAuditLog({
          userId: session.user.id,
          action: AuditActions.CREDENTIAL_UPLOADED,
          entityType: "Credential",
          entityId: credential.id,
          details: { name: credential.name, type: credential.type },
        });

        return NextResponse.json({ credential, fileUrl });
      }
    } else if (type === "document" && entityId) {
      // Handle document upload (BHRF responding to request)
      const document = await prisma.document.findUnique({
        where: { id: entityId },
        include: { facility: true },
      });

      if (!document) {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 }
        );
      }

      // Verify BHRF owns this facility
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile || bhrfProfile.facilityId !== document.facilityId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Create version and update document
      await prisma.$transaction([
        prisma.documentVersion.create({
          data: {
            documentId: entityId,
            fileUrl,
            uploadedBy: session.user.id,
          },
        }),
        prisma.document.update({
          where: { id: entityId },
          data: {
            fileUrl,
            status: "UPLOADED",
            uploadedBy: session.user.id,
            uploadedAt: new Date(),
            expiresAt: expiresAt ? new Date(expiresAt) : null,
          },
        }),
      ]);

      await createAuditLog({
        userId: session.user.id,
        action: AuditActions.DOCUMENT_UPLOADED,
        entityType: "Document",
        entityId,
        details: { name: document.name },
      });

      return NextResponse.json({ success: true, fileUrl });
    }

    return NextResponse.json({ fileUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
