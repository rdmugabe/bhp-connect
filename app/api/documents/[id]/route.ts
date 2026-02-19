import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, AuditActions } from "@/lib/audit";
import { deleteFromS3 } from "@/lib/s3";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documentId = params.id;

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
