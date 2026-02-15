import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSignedDownloadUrl } from "@/lib/s3";
import { createAuditLog, AuditActions } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // For public credential pages, we allow unauthenticated access
    // but still log it. For other documents, require authentication.
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    // Check if this is a public credential access
    const isPublicCredential = key.startsWith("credentials/");

    if (!isPublicCredential && !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate signed URL
    const signedUrl = await getSignedDownloadUrl(key, 3600); // 1 hour expiry

    // Log document access if user is authenticated
    if (session) {
      await createAuditLog({
        userId: session.user.id,
        action: AuditActions.DOCUMENT_VIEWED,
        entityType: "Document",
        details: { key },
      });
    }

    // Redirect to signed URL
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    );
  }
}
