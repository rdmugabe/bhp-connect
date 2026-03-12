"use client";

import { AlertTriangle, ShieldAlert, Heart, UserX, Pill, DoorOpen, Activity } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface RiskFlagBannerProps {
  riskFlags: string[];
}

const RISK_FLAG_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bgColor: string }
> = {
  SELF_HARM: {
    label: "Self-Harm Risk",
    icon: Heart,
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200",
  },
  SUICIDAL_IDEATION: {
    label: "Suicidal Ideation",
    icon: AlertTriangle,
    color: "text-red-700",
    bgColor: "bg-red-50 border-red-300",
  },
  HOMICIDAL_IDEATION: {
    label: "Homicidal Ideation",
    icon: ShieldAlert,
    color: "text-red-700",
    bgColor: "bg-red-50 border-red-300",
  },
  AGGRESSION: {
    label: "Aggressive Behavior",
    icon: UserX,
    color: "text-orange-600",
    bgColor: "bg-orange-50 border-orange-200",
  },
  MEDICAL_DISTRESS: {
    label: "Medical Distress",
    icon: Activity,
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200",
  },
  ELOPEMENT_RISK: {
    label: "Elopement Risk",
    icon: DoorOpen,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 border-yellow-200",
  },
  SUBSTANCE_USE: {
    label: "Substance Use Concern",
    icon: Pill,
    color: "text-purple-600",
    bgColor: "bg-purple-50 border-purple-200",
  },
};

export function RiskFlagBanner({ riskFlags }: RiskFlagBannerProps) {
  if (!riskFlags || riskFlags.length === 0) return null;

  // Separate critical and other flags
  const criticalFlags = riskFlags.filter(
    (f) => f === "SUICIDAL_IDEATION" || f === "HOMICIDAL_IDEATION" || f === "SELF_HARM"
  );
  const otherFlags = riskFlags.filter(
    (f) => f !== "SUICIDAL_IDEATION" && f !== "HOMICIDAL_IDEATION" && f !== "SELF_HARM"
  );

  return (
    <div className="space-y-3">
      {criticalFlags.length > 0 && (
        <Alert variant="destructive" className="border-2">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="font-bold">Critical Risk Indicators Detected</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1">
              {criticalFlags.map((flag) => {
                const config = RISK_FLAG_CONFIG[flag];
                if (!config) return null;
                const Icon = config.icon;
                return (
                  <div key={flag} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{config.label}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-sm">
              Staff should continue to monitor the resident closely and follow facility
              protocol by notifying appropriate clinical personnel immediately.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {otherFlags.length > 0 && (
        <Alert className="border bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Risk Indicators Noted</AlertTitle>
          <AlertDescription className="text-yellow-700">
            <div className="mt-2 flex flex-wrap gap-2">
              {otherFlags.map((flag) => {
                const config = RISK_FLAG_CONFIG[flag];
                if (!config) return null;
                const Icon = config.icon;
                return (
                  <div
                    key={flag}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full ${config.bgColor}`}
                  >
                    <Icon className={`h-3 w-3 ${config.color}`} />
                    <span className={`text-sm font-medium ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-sm">
              Continue to monitor and follow facility protocol as appropriate.
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

interface RiskFlagBadgeProps {
  flag: string;
  size?: "sm" | "md";
}

export function RiskFlagBadge({ flag, size = "md" }: RiskFlagBadgeProps) {
  const config = RISK_FLAG_CONFIG[flag];
  if (!config) return null;

  const Icon = config.icon;
  const sizeClasses = size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-sm";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border ${config.bgColor} ${sizeClasses}`}
    >
      <Icon className={`${iconSize} ${config.color}`} />
      <span className={`font-medium ${config.color}`}>{config.label}</span>
    </div>
  );
}
