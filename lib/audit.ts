import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";

interface AuditLogParams {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
}

export async function createAuditLog({
  userId,
  action,
  entityType,
  entityId,
  details,
}: AuditLogParams) {
  try {
    const headersList = headers();
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0] ||
      headersList.get("x-real-ip") ||
      "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        details: details as Prisma.InputJsonValue,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Don't throw - audit logging should not break the main operation
  }
}

export const AuditActions = {
  // User actions
  USER_REGISTERED: "USER_REGISTERED",
  USER_LOGIN: "USER_LOGIN",
  USER_LOGOUT: "USER_LOGOUT",
  USER_MFA_ENABLED: "USER_MFA_ENABLED",
  USER_MFA_DISABLED: "USER_MFA_DISABLED",
  USER_PROFILE_UPDATED: "USER_PROFILE_UPDATED",
  USER_APPROVED: "USER_APPROVED",
  USER_REJECTED: "USER_REJECTED",

  // Facility application actions
  FACILITY_APPLICATION_SUBMITTED: "FACILITY_APPLICATION_SUBMITTED",
  FACILITY_APPLICATION_APPROVED: "FACILITY_APPLICATION_APPROVED",
  FACILITY_APPLICATION_REJECTED: "FACILITY_APPLICATION_REJECTED",

  // Facility actions
  FACILITY_CREATED: "FACILITY_CREATED",
  FACILITY_UPDATED: "FACILITY_UPDATED",
  FACILITY_DELETED: "FACILITY_DELETED",

  // Intake actions
  INTAKE_DRAFT_SAVED: "INTAKE_DRAFT_SAVED",
  INTAKE_SUBMITTED: "INTAKE_SUBMITTED",
  INTAKE_UPDATED: "INTAKE_UPDATED",
  INTAKE_APPROVED: "INTAKE_APPROVED",
  INTAKE_CONDITIONAL: "INTAKE_CONDITIONAL",
  INTAKE_DENIED: "INTAKE_DENIED",
  INTAKE_PDF_DOWNLOADED: "INTAKE_PDF_DOWNLOADED",

  // Document actions
  DOCUMENT_REQUESTED: "DOCUMENT_REQUESTED",
  DOCUMENT_UPLOADED: "DOCUMENT_UPLOADED",
  DOCUMENT_APPROVED: "DOCUMENT_APPROVED",
  DOCUMENT_VIEWED: "DOCUMENT_VIEWED",

  // Credential actions
  CREDENTIAL_UPLOADED: "CREDENTIAL_UPLOADED",
  CREDENTIAL_UPDATED: "CREDENTIAL_UPDATED",
  CREDENTIAL_DELETED: "CREDENTIAL_DELETED",

  // Message actions
  MESSAGE_SENT: "MESSAGE_SENT",
  MESSAGE_READ: "MESSAGE_READ",

  // Employee actions
  EMPLOYEE_CREATED: "EMPLOYEE_CREATED",
  EMPLOYEE_UPDATED: "EMPLOYEE_UPDATED",
  EMPLOYEE_DEACTIVATED: "EMPLOYEE_DEACTIVATED",

  // Employee document actions
  EMPLOYEE_DOCUMENT_UPLOADED: "EMPLOYEE_DOCUMENT_UPLOADED",
  EMPLOYEE_DOCUMENT_UPDATED: "EMPLOYEE_DOCUMENT_UPDATED",
  EMPLOYEE_DOCUMENT_DELETED: "EMPLOYEE_DOCUMENT_DELETED",

  // Employee document type actions
  EMPLOYEE_DOC_TYPE_CREATED: "EMPLOYEE_DOC_TYPE_CREATED",
  EMPLOYEE_DOC_TYPE_UPDATED: "EMPLOYEE_DOC_TYPE_UPDATED",
  EMPLOYEE_DOC_TYPE_DELETED: "EMPLOYEE_DOC_TYPE_DELETED",

  // Meeting actions
  MEETING_CREATED: "MEETING_CREATED",
  MEETING_UPDATED: "MEETING_UPDATED",
  MEETING_CANCELLED: "MEETING_CANCELLED",
  MEETING_STARTED: "MEETING_STARTED",
  MEETING_ENDED: "MEETING_ENDED",

  // ASAM Assessment actions
  ASAM_DRAFT_SAVED: "ASAM_DRAFT_SAVED",
  ASAM_SUBMITTED: "ASAM_SUBMITTED",
  ASAM_UPDATED: "ASAM_UPDATED",
  ASAM_APPROVED: "ASAM_APPROVED",
  ASAM_CONDITIONAL: "ASAM_CONDITIONAL",
  ASAM_DENIED: "ASAM_DENIED",
  ASAM_PDF_DOWNLOADED: "ASAM_PDF_DOWNLOADED",
} as const;

export type AuditAction = (typeof AuditActions)[keyof typeof AuditActions];
