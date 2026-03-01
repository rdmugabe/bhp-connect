"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, XCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EmployeeComplianceBadgeProps {
  status: "VALID" | "EXPIRING_SOON" | "EXPIRED" | "COMPLIANT" | "NON_COMPLIANT";
  showIcon?: boolean;
  missingCertifications?: string[];
  expiredCertifications?: string[];
  expiringSoonCertifications?: string[];
  totalRequired?: number;
  totalCompleted?: number;
}

export function EmployeeComplianceBadge({
  status,
  showIcon = true,
  missingCertifications = [],
  expiredCertifications = [],
  expiringSoonCertifications = [],
  totalRequired,
  totalCompleted,
}: EmployeeComplianceBadgeProps) {
  const config = {
    VALID: {
      variant: "success" as const,
      label: "Compliant",
      icon: CheckCircle,
    },
    COMPLIANT: {
      variant: "success" as const,
      label: "Compliant",
      icon: CheckCircle,
    },
    EXPIRING_SOON: {
      variant: "warning" as const,
      label: "Expiring Soon",
      icon: AlertCircle,
    },
    EXPIRED: {
      variant: "danger" as const,
      label: "Non-Compliant",
      icon: XCircle,
    },
    NON_COMPLIANT: {
      variant: "danger" as const,
      label: "Non-Compliant",
      icon: XCircle,
    },
  };

  const { variant, label, icon: Icon } = config[status];

  const hasIssues =
    missingCertifications.length > 0 ||
    expiredCertifications.length > 0 ||
    expiringSoonCertifications.length > 0;

  const badge = (
    <Badge variant={variant} className="gap-1 cursor-default">
      {showIcon && <Icon className="h-3 w-3" />}
      {label}
      {totalRequired !== undefined && totalCompleted !== undefined && (
        <span className="ml-1 text-xs opacity-75">
          ({totalCompleted}/{totalRequired})
        </span>
      )}
    </Badge>
  );

  if (!hasIssues) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent className="max-w-sm">
          <div className="space-y-2 text-sm">
            {missingCertifications.length > 0 && (
              <div>
                <p className="font-semibold text-red-600">Missing:</p>
                <ul className="list-disc pl-4">
                  {missingCertifications.map((cert) => (
                    <li key={cert}>{cert}</li>
                  ))}
                </ul>
              </div>
            )}
            {expiredCertifications.length > 0 && (
              <div>
                <p className="font-semibold text-red-600">Expired:</p>
                <ul className="list-disc pl-4">
                  {expiredCertifications.map((cert) => (
                    <li key={cert}>{cert}</li>
                  ))}
                </ul>
              </div>
            )}
            {expiringSoonCertifications.length > 0 && (
              <div>
                <p className="font-semibold text-yellow-600">Expiring Soon:</p>
                <ul className="list-disc pl-4">
                  {expiringSoonCertifications.map((cert) => (
                    <li key={cert}>{cert}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
