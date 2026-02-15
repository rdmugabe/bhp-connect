"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, XCircle } from "lucide-react";

interface EmployeeComplianceBadgeProps {
  status: "VALID" | "EXPIRING_SOON" | "EXPIRED";
  showIcon?: boolean;
}

export function EmployeeComplianceBadge({
  status,
  showIcon = true,
}: EmployeeComplianceBadgeProps) {
  const config = {
    VALID: {
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
  };

  const { variant, label, icon: Icon } = config[status];

  return (
    <Badge variant={variant} className="gap-1">
      {showIcon && <Icon className="h-3 w-3" />}
      {label}
    </Badge>
  );
}
