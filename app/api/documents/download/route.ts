import { NextRequest, NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSignedDownloadUrl } from "@/lib/s3";
import { createAuditLog, AuditActions } from "@/lib/audit";

/**
 * Secure file download.
 *
 * A raw S3 key cannot be signed on its own — that was an IDOR (any
 * authenticated user could pull any file by guessing the key, and
 * `credentials/`-prefixed keys were served with no auth at all).
 *
 * Instead we resolve the key to the record that owns it, then authorize
 * against THAT record's facility / BHP:
 *   - Credential (isPublic)      → public (powers the public credentials page)
 *   - Document                   → caller's facility must own it (BHRF) or
 *                                  caller's BHP must manage the facility
 *   - EmployeeDocument           → same, scoped via the employee's facility
 *   - unknown key                → 404 (never sign an arbitrary key)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const { searchParams } = new URL(request.url);
    const rawKey = searchParams.get("key");

    if (!rawKey) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    // Normalize: the key may arrive URL-encoded once or twice.
    let key = rawKey;
    if (key.includes("%")) {
      try {
        key = decodeURIComponent(key);
      } catch {
        key = rawKey;
      }
    }

    // Resolve the key to its owning record.
    const [credential, document, employeeDoc] = await Promise.all([
      prisma.credential.findFirst({ where: { fileUrl: key } }),
      prisma.document.findFirst({
        where: { fileUrl: key },
        select: { id: true, facilityId: true, facility: { select: { bhpId: true } } },
      }),
      prisma.employeeDocument.findFirst({
        where: { fileUrl: key },
        select: {
          id: true,
          employee: {
            select: { facilityId: true, facility: { select: { bhpId: true } } },
          },
        },
      }),
    ]);

    // 1) Public BHP credential — intentionally unauthenticated.
    if (credential) {
      if (!credential.isPublic && !session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return await sign(key, session?.user.id, "Credential");
    }

    // Everything else requires a session.
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2) Facility document
    if (document) {
      const ok = await callerOwnsFacility(
        session,
        document.facilityId,
        document.facility?.bhpId ?? null
      );
      if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      return await sign(key, session.user.id, "Document");
    }

    // 3) Employee compliance document
    if (employeeDoc?.employee) {
      const ok = await callerOwnsFacility(
        session,
        employeeDoc.employee.facilityId,
        employeeDoc.employee.facility?.bhpId ?? null
      );
      if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      return await sign(key, session.user.id, "EmployeeDocument");
    }

    // Unknown key — do not sign arbitrary paths.
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    );
  }
}

/** True if the caller (BHRF or BHP/ADMIN) is allowed to access this facility. */
async function callerOwnsFacility(
  session: Session,
  facilityId: string,
  facilityBhpId: string | null
): Promise<boolean> {
  const role = session.user.role;

  if (role === "ADMIN") return true;

  if (role === "BHRF") {
    const bhrf = await prisma.bHRFProfile.findUnique({
      where: { userId: session.user.id },
    });
    return !!bhrf && bhrf.facilityId === facilityId;
  }

  if (role === "BHP") {
    const bhp = await prisma.bHPProfile.findUnique({
      where: { userId: session.user.id },
    });
    return !!bhp && facilityBhpId === bhp.id;
  }

  return false;
}

async function sign(key: string, userId: string | undefined, entityType: string) {
  const signedUrl = await getSignedDownloadUrl(key, 3600); // 1 hour expiry
  if (userId) {
    await createAuditLog({
      userId,
      action: AuditActions.DOCUMENT_VIEWED,
      entityType,
      details: { key },
    });
  }
  return NextResponse.redirect(signedUrl);
}
