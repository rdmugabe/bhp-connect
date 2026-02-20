"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { SafetyChecklist } from "./safety-checklist";

interface Resident {
  name: string;
  evacuated: boolean;
}

interface Signatures {
  staffSignature: string;
  staffSignatureDate: string;
  supervisorSignature: string;
  supervisorSignatureDate: string;
}

interface FireDrillReport {
  id: string;
  drillDate: string;
  drillTime: string;
  location: string | null;
  shift: "AM" | "PM";
  drillType: "ANNOUNCED" | "UNANNOUNCED";
  conductedBy: string;
  alarmActivatedTime: string | null;
  buildingClearTime: string | null;
  totalEvacuationTime: string | null;
  numberEvacuated: number | null;
  safetyChecklist: {
    fireAlarmFunctioned: boolean;
    allResidentsAccountedFor: boolean;
    staffFollowedProcedures: boolean;
    exitRoutesClear: boolean;
    emergencyExitsOpenedProperly: boolean;
    fireExtinguishersAccessible: boolean;
  };
  residentsPresent: Resident[] | null;
  observations: string | null;
  correctiveActions: string | null;
  drillResult: "SATISFACTORY" | "NEEDS_IMPROVEMENT" | "UNSATISFACTORY";
  signatures: Partial<Signatures> | null;
}

interface FireDrillFormProps {
  report?: FireDrillReport | null;
  preselectedShift?: "AM" | "PM";
  approvedResidents?: { name: string }[];
}

export function FireDrillForm({
  report,
  preselectedShift,
  approvedResidents = [],
}: FireDrillFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    drillDate: "",
    drillTime: "",
    location: "",
    shift: preselectedShift || ("AM" as "AM" | "PM"),
    drillType: "UNANNOUNCED" as "ANNOUNCED" | "UNANNOUNCED",
    conductedBy: "",
    alarmActivatedTime: "",
    buildingClearTime: "",
    totalEvacuationTime: "",
    numberEvacuated: "",
    safetyChecklist: {
      fireAlarmFunctioned: false,
      allResidentsAccountedFor: false,
      staffFollowedProcedures: false,
      exitRoutesClear: false,
      emergencyExitsOpenedProperly: false,
      fireExtinguishersAccessible: false,
    },
    residentsPresent: [] as Resident[],
    observations: "",
    correctiveActions: "",
    drillResult: "SATISFACTORY" as
      | "SATISFACTORY"
      | "NEEDS_IMPROVEMENT"
      | "UNSATISFACTORY",
    signatures: {
      staffSignature: "",
      staffSignatureDate: "",
      supervisorSignature: "",
      supervisorSignatureDate: "",
    },
  });

  useEffect(() => {
    if (report) {
      setFormData({
        drillDate: new Date(report.drillDate).toISOString().split("T")[0],
        drillTime: report.drillTime,
        location: report.location || "",
        shift: report.shift,
        drillType: report.drillType,
        conductedBy: report.conductedBy,
        alarmActivatedTime: report.alarmActivatedTime || "",
        buildingClearTime: report.buildingClearTime || "",
        totalEvacuationTime: report.totalEvacuationTime || "",
        numberEvacuated: report.numberEvacuated?.toString() || "",
        safetyChecklist: report.safetyChecklist,
        residentsPresent: report.residentsPresent || [],
        observations: report.observations || "",
        correctiveActions: report.correctiveActions || "",
        drillResult: report.drillResult,
        signatures: {
          staffSignature: report.signatures?.staffSignature || "",
          staffSignatureDate: report.signatures?.staffSignatureDate || "",
          supervisorSignature: report.signatures?.supervisorSignature || "",
          supervisorSignatureDate: report.signatures?.supervisorSignatureDate || "",
        },
      });
    } else if (approvedResidents.length > 0) {
      // Pre-populate residents from approved intakes
      setFormData((prev) => ({
        ...prev,
        residentsPresent: approvedResidents.map((r) => ({
          name: r.name,
          evacuated: true,
        })),
      }));
    }
  }, [report, approvedResidents]);

  const handleChecklistChange = (
    key: keyof typeof formData.safetyChecklist,
    value: boolean
  ) => {
    setFormData({
      ...formData,
      safetyChecklist: {
        ...formData.safetyChecklist,
        [key]: value,
      },
    });
  };

  const handleResidentEvacuatedChange = (index: number, evacuated: boolean) => {
    const updated = [...formData.residentsPresent];
    updated[index] = { ...updated[index], evacuated };
    setFormData({ ...formData, residentsPresent: updated });
  };

  const addResident = () => {
    setFormData({
      ...formData,
      residentsPresent: [...formData.residentsPresent, { name: "", evacuated: true }],
    });
  };

  const removeResident = (index: number) => {
    const updated = formData.residentsPresent.filter((_, i) => i !== index);
    setFormData({ ...formData, residentsPresent: updated });
  };

  const updateResidentName = (index: number, name: string) => {
    const updated = [...formData.residentsPresent];
    updated[index] = { ...updated[index], name };
    setFormData({ ...formData, residentsPresent: updated });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = report
        ? `/api/fire-drill-reports/${report.id}`
        : "/api/fire-drill-reports";
      const method = report ? "PUT" : "POST";

      const payload = {
        ...formData,
        numberEvacuated: formData.numberEvacuated
          ? parseInt(formData.numberEvacuated)
          : null,
        residentsPresent:
          formData.residentsPresent.length > 0
            ? formData.residentsPresent.filter((r) => r.name.trim())
            : null,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save report");
      }

      toast({
        title: "Success",
        description: report
          ? "Fire drill report updated successfully"
          : "Fire drill report submitted successfully",
      });

      router.push("/facility/admin-tasks/fire-drills");
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save report",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Drill Information */}
      <Card>
        <CardHeader>
          <CardTitle>Drill Information</CardTitle>
          <CardDescription>
            Enter the basic details about the fire drill
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="drillDate">Drill Date *</Label>
              <Input
                id="drillDate"
                type="date"
                value={formData.drillDate}
                onChange={(e) =>
                  setFormData({ ...formData, drillDate: e.target.value })
                }
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="drillTime">Drill Time *</Label>
              <Input
                id="drillTime"
                type="time"
                value={formData.drillTime}
                onChange={(e) =>
                  setFormData({ ...formData, drillTime: e.target.value })
                }
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="mt-1"
                placeholder="e.g., Main Building"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="shift">Shift *</Label>
              <Select
                value={formData.shift}
                onValueChange={(value: "AM" | "PM") =>
                  setFormData({ ...formData, shift: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM Shift</SelectItem>
                  <SelectItem value="PM">PM Shift</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="drillType">Drill Type *</Label>
              <Select
                value={formData.drillType}
                onValueChange={(value: "ANNOUNCED" | "UNANNOUNCED") =>
                  setFormData({ ...formData, drillType: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANNOUNCED">Announced</SelectItem>
                  <SelectItem value="UNANNOUNCED">Unannounced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="conductedBy">Conducted By *</Label>
              <Input
                id="conductedBy"
                value={formData.conductedBy}
                onChange={(e) =>
                  setFormData({ ...formData, conductedBy: e.target.value })
                }
                required
                className="mt-1"
                placeholder="Staff member name"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evacuation Times */}
      <Card>
        <CardHeader>
          <CardTitle>Evacuation Times</CardTitle>
          <CardDescription>
            Record the key times during the evacuation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="alarmActivatedTime">Alarm Activated</Label>
              <Input
                id="alarmActivatedTime"
                type="time"
                value={formData.alarmActivatedTime}
                onChange={(e) =>
                  setFormData({ ...formData, alarmActivatedTime: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="buildingClearTime">Building Clear</Label>
              <Input
                id="buildingClearTime"
                type="time"
                value={formData.buildingClearTime}
                onChange={(e) =>
                  setFormData({ ...formData, buildingClearTime: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="totalEvacuationTime">Total Evacuation Time</Label>
              <Input
                id="totalEvacuationTime"
                value={formData.totalEvacuationTime}
                onChange={(e) =>
                  setFormData({ ...formData, totalEvacuationTime: e.target.value })
                }
                className="mt-1"
                placeholder="e.g., 2 min 30 sec"
              />
            </div>
            <div>
              <Label htmlFor="numberEvacuated">Number Evacuated</Label>
              <Input
                id="numberEvacuated"
                type="number"
                min="0"
                value={formData.numberEvacuated}
                onChange={(e) =>
                  setFormData({ ...formData, numberEvacuated: e.target.value })
                }
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Safety Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Safety Checklist</CardTitle>
          <CardDescription>
            Check all items that were satisfactory during the drill
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SafetyChecklist
            checklist={formData.safetyChecklist}
            onChange={handleChecklistChange}
          />
        </CardContent>
      </Card>

      {/* Residents Present */}
      <Card>
        <CardHeader>
          <CardTitle>Residents Present</CardTitle>
          <CardDescription>
            List all residents present during the drill and their evacuation status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.residentsPresent.map((resident, index) => (
            <div key={index} className="flex items-center gap-4">
              <Input
                value={resident.name}
                onChange={(e) => updateResidentName(index, e.target.value)}
                placeholder="Resident name"
                className="flex-1"
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`evacuated-${index}`}
                  checked={resident.evacuated}
                  onCheckedChange={(checked) =>
                    handleResidentEvacuatedChange(index, checked as boolean)
                  }
                />
                <Label htmlFor={`evacuated-${index}`} className="text-sm">
                  Evacuated
                </Label>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeResident(index)}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addResident}>
            Add Resident
          </Button>
        </CardContent>
      </Card>

      {/* Observations & Corrective Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Observations & Corrective Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="observations">Observations</Label>
            <Textarea
              id="observations"
              value={formData.observations}
              onChange={(e) =>
                setFormData({ ...formData, observations: e.target.value })
              }
              className="mt-1"
              placeholder="Note any observations during the drill..."
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="correctiveActions">Corrective Actions Needed</Label>
            <Textarea
              id="correctiveActions"
              value={formData.correctiveActions}
              onChange={(e) =>
                setFormData({ ...formData, correctiveActions: e.target.value })
              }
              className="mt-1"
              placeholder="Describe any corrective actions that need to be taken..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Drill Result */}
      <Card>
        <CardHeader>
          <CardTitle>Drill Result *</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={formData.drillResult}
            onValueChange={(
              value: "SATISFACTORY" | "NEEDS_IMPROVEMENT" | "UNSATISFACTORY"
            ) => setFormData({ ...formData, drillResult: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select drill result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SATISFACTORY">Satisfactory</SelectItem>
              <SelectItem value="NEEDS_IMPROVEMENT">Needs Improvement</SelectItem>
              <SelectItem value="UNSATISFACTORY">Unsatisfactory</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Signatures */}
      <Card>
        <CardHeader>
          <CardTitle>Signatures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="staffSignature">Staff Signature</Label>
              <Input
                id="staffSignature"
                value={formData.signatures.staffSignature}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    signatures: {
                      ...formData.signatures,
                      staffSignature: e.target.value,
                    },
                  })
                }
                className="mt-1"
                placeholder="Type full name"
              />
            </div>
            <div>
              <Label htmlFor="staffSignatureDate">Date</Label>
              <Input
                id="staffSignatureDate"
                type="date"
                value={formData.signatures.staffSignatureDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    signatures: {
                      ...formData.signatures,
                      staffSignatureDate: e.target.value,
                    },
                  })
                }
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supervisorSignature">Supervisor Signature</Label>
              <Input
                id="supervisorSignature"
                value={formData.signatures.supervisorSignature}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    signatures: {
                      ...formData.signatures,
                      supervisorSignature: e.target.value,
                    },
                  })
                }
                className="mt-1"
                placeholder="Type full name"
              />
            </div>
            <div>
              <Label htmlFor="supervisorSignatureDate">Date</Label>
              <Input
                id="supervisorSignatureDate"
                type="date"
                value={formData.signatures.supervisorSignatureDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    signatures: {
                      ...formData.signatures,
                      supervisorSignatureDate: e.target.value,
                    },
                  })
                }
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-4 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/facility/admin-tasks/fire-drills")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : report ? "Update Report" : "Submit Report"}
        </Button>
      </div>
    </form>
  );
}
