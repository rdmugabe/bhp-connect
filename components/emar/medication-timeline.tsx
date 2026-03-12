"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS, STATUS_LABELS, ROUTE_LABELS } from "@/lib/emar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle, XCircle, AlertTriangle, Pill } from "lucide-react";

interface TimelineEntry {
  id: string;
  time: string;
  type: "scheduled" | "administered";
  status: string;
  medicationOrder: {
    medicationName: string;
    strength: string;
    dose: string;
    route: string;
    isPRN: boolean;
    isControlled: boolean;
    intake: {
      residentName: string;
    };
  };
  administeredBy?: string;
  administeredAt?: string;
}

interface MedicationTimelineProps {
  entries: TimelineEntry[];
  title?: string;
  showPatient?: boolean;
}

export function MedicationTimeline({
  entries,
  title = "Medication Timeline",
  showPatient = true,
}: MedicationTimelineProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "GIVEN":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "REFUSED":
      case "MISSED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "DUE":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "HELD":
        return <Clock className="h-4 w-4 text-orange-600" />;
      case "SCHEDULED":
        return <Clock className="h-4 w-4 text-gray-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = STATUS_COLORS[status] || STATUS_COLORS.SCHEDULED;
    return (
      <Badge className={cn(colors.bg, colors.text, "border-0 text-xs")}>
        {STATUS_LABELS[status] || status}
      </Badge>
    );
  };

  const getTimelineColor = (status: string) => {
    switch (status) {
      case "GIVEN":
        return "border-green-400 bg-green-50";
      case "REFUSED":
      case "MISSED":
        return "border-red-400 bg-red-50";
      case "DUE":
        return "border-yellow-400 bg-yellow-50";
      case "HELD":
        return "border-orange-400 bg-orange-50";
      default:
        return "border-gray-300 bg-gray-50";
    }
  };

  // Group entries by hour
  const groupedEntries = entries.reduce((acc, entry) => {
    const hour = format(new Date(entry.time), "h:00 a");
    if (!acc[hour]) {
      acc[hour] = [];
    }
    acc[hour].push(entry);
    return acc;
  }, {} as Record<string, TimelineEntry[]>);

  const sortedHours = Object.keys(groupedEntries).sort((a, b) => {
    const timeA = new Date(`1/1/2000 ${a}`);
    const timeB = new Date(`1/1/2000 ${b}`);
    return timeA.getTime() - timeB.getTime();
  });

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No medications in timeline</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

          {/* Entries */}
          <div className="space-y-6">
            {sortedHours.map((hour) => (
              <div key={hour} className="relative">
                {/* Hour marker */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center z-10">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="font-medium text-blue-600">{hour}</span>
                </div>

                {/* Medications for this hour */}
                <div className="ml-12 space-y-2">
                  {groupedEntries[hour].map((entry) => (
                    <div
                      key={entry.id}
                      className={cn(
                        "p-3 rounded-lg border-l-4 transition-all",
                        getTimelineColor(entry.status)
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getStatusIcon(entry.status)}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {entry.medicationOrder.medicationName}
                              </span>
                              {entry.medicationOrder.isPRN && (
                                <Badge variant="outline" className="text-xs">
                                  PRN
                                </Badge>
                              )}
                              {entry.medicationOrder.isControlled && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs px-1"
                                >
                                  C
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {entry.medicationOrder.dose} -{" "}
                              {ROUTE_LABELS[entry.medicationOrder.route]}
                            </p>
                            {showPatient && (
                              <p className="text-sm text-muted-foreground">
                                {entry.medicationOrder.intake.residentName}
                              </p>
                            )}
                            {entry.administeredBy && (
                              <p className="text-xs text-muted-foreground mt-1">
                                By {entry.administeredBy} at{" "}
                                {format(
                                  new Date(entry.administeredAt!),
                                  "h:mm a"
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(entry.time), "h:mm a")}
                          </span>
                          {getStatusBadge(entry.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
