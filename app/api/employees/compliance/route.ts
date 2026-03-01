import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface CertificationIssue {
  employeeId: string;
  employeeName: string;
  type: "missing" | "expired" | "expiring_soon";
  certificationName: string;
  expiresAt?: Date;
  daysUntilExpiration?: number;
}

export interface ComplianceSummary {
  totalEmployees: number;
  compliantEmployees: number;
  nonCompliantEmployees: number;
  totalMissingCertifications: number;
  totalExpiredCertifications: number;
  totalExpiringSoonCertifications: number;
  issues: CertificationIssue[];
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get("facilityId");

    let targetFacilityId: string | null = null;

    if (session.user.role === "BHRF") {
      const bhrfProfile = await prisma.bHRFProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhrfProfile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }

      targetFacilityId = bhrfProfile.facilityId;
    } else if (session.user.role === "BHP") {
      if (!facilityId) {
        return NextResponse.json(
          { error: "facilityId required for BHP users" },
          { status: 400 }
        );
      }

      // Verify BHP owns this facility
      const bhpProfile = await prisma.bHPProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!bhpProfile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }

      const facility = await prisma.facility.findFirst({
        where: {
          id: facilityId,
          bhpId: bhpProfile.id,
        },
      });

      if (!facility) {
        return NextResponse.json(
          { error: "Facility not found" },
          { status: 404 }
        );
      }

      targetFacilityId = facilityId;
    }

    if (!targetFacilityId) {
      return NextResponse.json({ error: "No facility access" }, { status: 403 });
    }

    // Get required certification types
    const requiredCertTypes = await prisma.employeeDocumentType.findMany({
      where: {
        isRequired: true,
        isActive: true,
        facilityId: null,
      },
    });

    // Get all active employees with their documents
    const employees = await prisma.employee.findMany({
      where: {
        facilityId: targetFacilityId,
        isActive: true,
      },
      include: {
        employeeDocuments: {
          include: {
            documentType: true,
          },
        },
      },
    });

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const issues: CertificationIssue[] = [];
    let compliantCount = 0;
    let totalMissing = 0;
    let totalExpired = 0;
    let totalExpiringSoon = 0;

    employees.forEach((employee) => {
      const employeeName = `${employee.firstName} ${employee.lastName}`;
      let isCompliant = true;

      // Check for missing required certifications
      requiredCertTypes.forEach((certType) => {
        const hasDoc = employee.employeeDocuments.some(
          (doc) => doc.documentTypeId === certType.id
        );
        if (!hasDoc) {
          isCompliant = false;
          totalMissing++;
          issues.push({
            employeeId: employee.id,
            employeeName,
            type: "missing",
            certificationName: certType.name,
          });
        }
      });

      // Check for expired/expiring documents
      employee.employeeDocuments.forEach((doc) => {
        if (doc.noExpiration || !doc.expiresAt) return;

        const expiresAt = new Date(doc.expiresAt);
        const daysUntilExpiration = Math.ceil(
          (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (expiresAt < now) {
          isCompliant = false;
          totalExpired++;
          issues.push({
            employeeId: employee.id,
            employeeName,
            type: "expired",
            certificationName: doc.documentType.name,
            expiresAt,
            daysUntilExpiration,
          });
        } else if (expiresAt <= thirtyDaysFromNow) {
          totalExpiringSoon++;
          issues.push({
            employeeId: employee.id,
            employeeName,
            type: "expiring_soon",
            certificationName: doc.documentType.name,
            expiresAt,
            daysUntilExpiration,
          });
        }
      });

      if (isCompliant) {
        compliantCount++;
      }
    });

    // Sort issues: expired first, then missing, then expiring soon
    issues.sort((a, b) => {
      const priority = { expired: 0, missing: 1, expiring_soon: 2 };
      return priority[a.type] - priority[b.type];
    });

    const summary: ComplianceSummary = {
      totalEmployees: employees.length,
      compliantEmployees: compliantCount,
      nonCompliantEmployees: employees.length - compliantCount,
      totalMissingCertifications: totalMissing,
      totalExpiredCertifications: totalExpired,
      totalExpiringSoonCertifications: totalExpiringSoon,
      issues,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Get employee compliance error:", error);
    return NextResponse.json(
      { error: "Failed to fetch compliance data" },
      { status: 500 }
    );
  }
}
