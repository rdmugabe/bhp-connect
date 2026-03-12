"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdministrationDialog } from "./administration-dialog";
import { ROUTE_LABELS, STATUS_COLORS, STATUS_LABELS } from "@/lib/emar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle, XCircle, AlertTriangle, Pill } from "lucide-react";

interface Schedule {
  id: string;
  scheduledTime: string;
  scheduledDateTime: string;
  status: string;
  windowStartTime: string;
  windowEndTime: string;
  medicationOrder: {
    id: string;
    medicationName: string;
    strength: string;
    dose: string;
    route: string;
    isPRN: boolean;
    isControlled: boolean;
    instructions?: string;
    intake: {
      id: string;
      residentName: string;
      dateOfBirth: string;
      allergies?: string;
    };
  };
  administration?: {
    id: string;
    administeredAt: string;
    administeredBy: string;
    status: string;
  };
}

interface MedicationScheduleTableProps {
  schedules: Schedule[];
  onRefresh: () => void;
  showPatientColumn?: boolean;
  readOnly?: boolean;
}

export function MedicationScheduleTable({
  schedules,
  onRefresh,
  showPatientColumn = true,
  readOnly = false,
}: MedicationScheduleTableProps) {
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAdminister = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    onRefresh();
  };

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
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = STATUS_COLORS[status] || STATUS_COLORS.SCHEDULED;
    return (
      <Badge className={cn(colors.bg, colors.text, "border-0")}>
        {STATUS_LABELS[status] || status}
      </Badge>
    );
  };

  const canAdminister = (schedule: Schedule) => {
    return ["SCHEDULED", "DUE"].includes(schedule.status) && !readOnly;
  };

  if (schedules.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No medications scheduled</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                {showPatientColumn && <TableHead>Patient</TableHead>}
                <TableHead>Medication</TableHead>
                <TableHead>Dose</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Status</TableHead>
                {!readOnly && <TableHead></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((schedule) => {
                const isOverdue =
                  schedule.status === "DUE" &&
                  new Date(schedule.windowEndTime) < new Date();

                return (
                  <TableRow
                    key={schedule.id}
                    className={cn(
                      isOverdue && "bg-red-50",
                      schedule.status === "DUE" && !isOverdue && "bg-yellow-50"
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(schedule.status)}
                        <div>
                          <div className="font-medium">
                            {format(new Date(schedule.scheduledDateTime), "h:mm a")}
                          </div>
                          {schedule.administration && (
                            <div className="text-xs text-muted-foreground">
                              Given at{" "}
                              {format(
                                new Date(schedule.administration.administeredAt),
                                "h:mm a"
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    {showPatientColumn && (
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {schedule.medicationOrder.intake.residentName}
                          </div>
                          {schedule.medicationOrder.intake.allergies && (
                            <div className="text-xs text-orange-600 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Allergies
                            </div>
                          )}
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {schedule.medicationOrder.medicationName}
                          {schedule.medicationOrder.isControlled && (
                            <Badge variant="destructive" className="text-xs px-1">
                              C
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {schedule.medicationOrder.strength}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{schedule.medicationOrder.dose}</TableCell>
                    <TableCell>
                      {ROUTE_LABELS[schedule.medicationOrder.route]}
                    </TableCell>
                    <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                    {!readOnly && (
                      <TableCell>
                        {canAdminister(schedule) && (
                          <Button
                            size="sm"
                            onClick={() => handleAdminister(schedule)}
                          >
                            Administer
                          </Button>
                        )}
                        {schedule.administration && (
                          <span className="text-xs text-muted-foreground">
                            by {schedule.administration.administeredBy}
                          </span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AdministrationDialog
        schedule={selectedSchedule}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleSuccess}
      />
    </>
  );
}
