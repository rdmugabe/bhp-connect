"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SIX_RIGHTS } from "@/lib/emar";

interface SixRightsChecklistProps {
  patientName: string;
  dateOfBirth: string;
  medicationName: string;
  strength: string;
  dose: string;
  route: string;
  scheduledTime?: string;
  checkedRights: Record<string, boolean>;
  onCheckRight: (rightId: string, checked: boolean) => void;
}

export function SixRightsChecklist({
  patientName,
  dateOfBirth,
  medicationName,
  strength,
  dose,
  route,
  scheduledTime,
  checkedRights,
  onCheckRight,
}: SixRightsChecklistProps) {
  const allChecked = SIX_RIGHTS.every((right) => checkedRights[right.id]);

  // Dynamic values for verification
  const verificationValues: Record<string, string> = {
    right_patient: `${patientName} - DOB: ${dateOfBirth}`,
    right_medication: `${medicationName} ${strength}`,
    right_dose: dose,
    right_route: route,
    right_time: scheduledTime || "Now",
    right_documentation: "Order is current and valid",
  };

  return (
    <Card className={cn(
      "border-2 transition-colors",
      allChecked ? "border-green-500 bg-green-50" : "border-yellow-400 bg-yellow-50"
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {allChecked ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-yellow-600" />
          )}
          6 Rights Verification
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Verify each right before administering medication
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {SIX_RIGHTS.map((right) => (
          <div
            key={right.id}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border transition-colors",
              checkedRights[right.id]
                ? "bg-green-100 border-green-300"
                : "bg-white border-gray-200"
            )}
          >
            <Checkbox
              id={right.id}
              checked={checkedRights[right.id] || false}
              onCheckedChange={(checked) => onCheckRight(right.id, checked === true)}
              className="mt-1"
            />
            <div className="flex-1">
              <Label
                htmlFor={right.id}
                className={cn(
                  "font-medium cursor-pointer",
                  checkedRights[right.id] ? "text-green-800" : "text-gray-900"
                )}
              >
                {right.label}
              </Label>
              <p className="text-sm text-muted-foreground mt-0.5">
                {right.description}
              </p>
              <p className={cn(
                "text-sm font-medium mt-1",
                checkedRights[right.id] ? "text-green-700" : "text-gray-700"
              )}>
                {verificationValues[right.id]}
              </p>
            </div>
            {checkedRights[right.id] && (
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-1" />
            )}
          </div>
        ))}

        {!allChecked && (
          <p className="text-sm text-yellow-700 text-center py-2">
            You must verify all 6 rights before administering this medication
          </p>
        )}
      </CardContent>
    </Card>
  );
}
