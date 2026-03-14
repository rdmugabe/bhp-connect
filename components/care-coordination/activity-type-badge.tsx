"use client";

import { CareCoordinationActivityType } from "@prisma/client";
import { getActivityTypeConfig } from "@/lib/care-coordination";
import { cn } from "@/lib/utils";

interface ActivityTypeBadgeProps {
  type: CareCoordinationActivityType;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export function ActivityTypeBadge({
  type,
  size = "md",
  showIcon = true,
  className,
}: ActivityTypeBadgeProps) {
  const config = getActivityTypeConfig(type);
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md font-medium border",
        config.bgColor,
        config.textColor,
        config.borderColor,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </span>
  );
}
