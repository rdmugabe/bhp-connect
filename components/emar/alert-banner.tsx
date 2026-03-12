"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertTriangle,
  Bell,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Alert {
  id: string;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  triggeredAt: string;
  intake?: {
    residentName: string;
  };
}

interface AlertBannerProps {
  alerts: Alert[];
  onAcknowledge: (alertId: string) => void;
  onRefresh: () => void;
}

const SEVERITY_STYLES = {
  CRITICAL: {
    bg: "bg-red-50 border-red-300",
    icon: "text-red-600",
    text: "text-red-800",
  },
  WARNING: {
    bg: "bg-yellow-50 border-yellow-300",
    icon: "text-yellow-600",
    text: "text-yellow-800",
  },
  INFO: {
    bg: "bg-blue-50 border-blue-300",
    icon: "text-blue-600",
    text: "text-blue-800",
  },
};

const ALERT_TYPE_ICONS: Record<string, typeof Bell> = {
  MEDICATION_DUE: Clock,
  MEDICATION_OVERDUE: AlertTriangle,
  MISSED_DOSE: XCircle,
  ALLERGY_WARNING: AlertTriangle,
  DUPLICATE_MEDICATION: AlertTriangle,
  PRN_FOLLOWUP_DUE: Bell,
};

export function AlertBanner({
  alerts,
  onAcknowledge,
  onRefresh,
}: AlertBannerProps) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(true);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);

  if (alerts.length === 0) return null;

  const criticalCount = alerts.filter((a) => a.severity === "CRITICAL").length;
  const warningCount = alerts.filter((a) => a.severity === "WARNING").length;

  const handleAcknowledge = async (alertId: string) => {
    setAcknowledging(alertId);
    try {
      const response = await fetch(`/api/emar/alerts/${alertId}/acknowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error("Failed to acknowledge alert");
      }

      onAcknowledge(alertId);
      toast({
        title: "Alert Acknowledged",
        description: "The alert has been acknowledged",
      });
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      toast({
        title: "Error",
        description: "Failed to acknowledge alert",
        variant: "destructive",
      });
    } finally {
      setAcknowledging(null);
    }
  };

  const highestSeverity = criticalCount > 0 ? "CRITICAL" : warningCount > 0 ? "WARNING" : "INFO";
  const styles = SEVERITY_STYLES[highestSeverity];

  return (
    <div className={cn("border rounded-lg overflow-hidden", styles.bg)}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className={cn("h-5 w-5", styles.icon)} />
          <div>
            <span className={cn("font-medium", styles.text)}>
              {alerts.length} Active Alert{alerts.length !== 1 && "s"}
            </span>
            {(criticalCount > 0 || warningCount > 0) && (
              <span className="ml-2 text-sm">
                {criticalCount > 0 && (
                  <span className="text-red-600 font-medium">
                    {criticalCount} critical
                  </span>
                )}
                {criticalCount > 0 && warningCount > 0 && ", "}
                {warningCount > 0 && (
                  <span className="text-yellow-600 font-medium">
                    {warningCount} warning
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm">
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Alert List */}
      {expanded && (
        <div className="border-t border-inherit">
          {alerts.map((alert) => {
            const alertStyles = SEVERITY_STYLES[alert.severity as keyof typeof SEVERITY_STYLES] || SEVERITY_STYLES.INFO;
            const Icon = ALERT_TYPE_ICONS[alert.alertType] || Bell;

            return (
              <div
                key={alert.id}
                className={cn(
                  "flex items-start justify-between px-4 py-3 border-b last:border-b-0",
                  "hover:bg-black/5 transition-colors"
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon className={cn("h-4 w-4 mt-0.5", alertStyles.icon)} />
                  <div>
                    <p className={cn("font-medium text-sm", alertStyles.text)}>
                      {alert.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      {alert.intake && (
                        <span>Patient: {alert.intake.residentName}</span>
                      )}
                      <span>•</span>
                      <span>
                        {format(new Date(alert.triggeredAt), "h:mm a")}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAcknowledge(alert.id);
                  }}
                  disabled={acknowledging === alert.id}
                  className="shrink-0"
                >
                  {acknowledging === alert.id ? (
                    "..."
                  ) : (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Ack
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
