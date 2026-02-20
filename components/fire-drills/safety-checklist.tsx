"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface SafetyChecklistItem {
  key: string;
  label: string;
  description: string;
}

const CHECKLIST_ITEMS: SafetyChecklistItem[] = [
  {
    key: "fireAlarmFunctioned",
    label: "Fire alarm functioned properly",
    description: "The fire alarm system activated and was audible throughout the facility",
  },
  {
    key: "allResidentsAccountedFor",
    label: "All residents accounted for",
    description: "All residents were located and accounted for at the assembly point",
  },
  {
    key: "staffFollowedProcedures",
    label: "Staff followed evacuation procedures",
    description: "Staff members executed the evacuation plan correctly",
  },
  {
    key: "exitRoutesClear",
    label: "Exit routes clear and accessible",
    description: "All exit routes and pathways were unobstructed",
  },
  {
    key: "emergencyExitsOpenedProperly",
    label: "Emergency exits opened properly",
    description: "All emergency exit doors functioned correctly",
  },
  {
    key: "fireExtinguishersAccessible",
    label: "Fire extinguishers accessible",
    description: "Fire extinguishers were visible and accessible",
  },
];

interface SafetyChecklistProps {
  checklist: {
    fireAlarmFunctioned: boolean;
    allResidentsAccountedFor: boolean;
    staffFollowedProcedures: boolean;
    exitRoutesClear: boolean;
    emergencyExitsOpenedProperly: boolean;
    fireExtinguishersAccessible: boolean;
  };
  onChange: (key: keyof SafetyChecklistProps["checklist"], value: boolean) => void;
  readOnly?: boolean;
}

export function SafetyChecklist({
  checklist,
  onChange,
  readOnly = false,
}: SafetyChecklistProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {CHECKLIST_ITEMS.map((item) => (
        <div
          key={item.key}
          className="flex items-start space-x-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <Checkbox
            id={item.key}
            checked={checklist[item.key as keyof typeof checklist]}
            onCheckedChange={(checked) =>
              !readOnly &&
              onChange(
                item.key as keyof typeof checklist,
                checked as boolean
              )
            }
            disabled={readOnly}
            className="mt-1"
          />
          <div className="space-y-1">
            <Label
              htmlFor={item.key}
              className="text-sm font-medium leading-none cursor-pointer"
            >
              {item.label}
            </Label>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
