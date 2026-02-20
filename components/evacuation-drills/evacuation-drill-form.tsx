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
import { Plus, Trash2 } from "lucide-react";

interface Staff {
  name: string;
}

interface Resident {
  name: string;
  assistanceRequired: string;
}

interface EvacuationDrillReport {
  id: string;
  drillType: "EVACUATION" | "DISASTER";
  drillDate: string;
  drillTime: string;
  dayOfWeek: string;
  totalLengthMinutes: number | null;
  shift: "AM" | "PM";
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  year: number;
  disasterDrillType: string | null;
  staffInvolved: Staff[];
  residentsInvolved: Resident[] | null;
  exitBlocked: string | null;
  exitUsed: string | null;
  assemblyPoint: string | null;
  correctLocation: boolean | null;
  allAccountedFor: boolean | null;
  issuesIdentified: boolean | null;
  observations: string | null;
  drillResult: "SATISFACTORY" | "NEEDS_IMPROVEMENT" | "UNSATISFACTORY";
  signatures: {
    conductedBy?: string;
    conductedByDate?: string;
    supervisor?: string;
    supervisorDate?: string;
  } | null;
}

interface EvacuationDrillFormProps {
  report?: EvacuationDrillReport | null;
  preselectedType?: "EVACUATION" | "DISASTER";
  approvedResidents?: { name: string }[];
}

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DISASTER_TYPES = ["Fire", "Earthquake", "Flood", "Tornado", "Power Outage", "Gas Leak", "Active Shooter", "Other"];

function getCurrentQuarter(): "Q1" | "Q2" | "Q3" | "Q4" {
  const month = new Date().getMonth();
  if (month < 3) return "Q1";
  if (month < 6) return "Q2";
  if (month < 9) return "Q3";
  return "Q4";
}

export function EvacuationDrillForm({
  report,
  preselectedType,
  approvedResidents = [],
}: EvacuationDrillFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    drillType: preselectedType || ("EVACUATION" as "EVACUATION" | "DISASTER"),
    drillDate: "",
    drillTime: "",
    dayOfWeek: "",
    totalLengthHours: "",
    totalLengthMinutes: "",
    shift: "AM" as "AM" | "PM",
    quarter: getCurrentQuarter(),
    year: new Date().getFullYear(),
    disasterDrillType: "",
    staffInvolved: [{ name: "" }] as Staff[],
    residentsInvolved: [] as Resident[],
    exitBlocked: "",
    exitUsed: "",
    assemblyPoint: "",
    correctLocation: false,
    allAccountedFor: false,
    issuesIdentified: false,
    observations: "",
    drillResult: "SATISFACTORY" as "SATISFACTORY" | "NEEDS_IMPROVEMENT" | "UNSATISFACTORY",
    signatures: {
      conductedBy: "",
      conductedByDate: "",
      supervisor: "",
      supervisorDate: "",
    },
  });

  useEffect(() => {
    if (report) {
      const totalMinutes = report.totalLengthMinutes || 0;
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;

      setFormData({
        drillType: report.drillType,
        drillDate: new Date(report.drillDate).toISOString().split("T")[0],
        drillTime: report.drillTime,
        dayOfWeek: report.dayOfWeek,
        totalLengthHours: hours > 0 ? hours.toString() : "",
        totalLengthMinutes: mins > 0 ? mins.toString() : "",
        shift: report.shift,
        quarter: report.quarter,
        year: report.year,
        disasterDrillType: report.disasterDrillType || "",
        staffInvolved: report.staffInvolved.length > 0 ? report.staffInvolved : [{ name: "" }],
        residentsInvolved: report.residentsInvolved || [],
        exitBlocked: report.exitBlocked || "",
        exitUsed: report.exitUsed || "",
        assemblyPoint: report.assemblyPoint || "",
        correctLocation: report.correctLocation || false,
        allAccountedFor: report.allAccountedFor || false,
        issuesIdentified: report.issuesIdentified || false,
        observations: report.observations || "",
        drillResult: report.drillResult,
        signatures: {
          conductedBy: report.signatures?.conductedBy || "",
          conductedByDate: report.signatures?.conductedByDate || "",
          supervisor: report.signatures?.supervisor || "",
          supervisorDate: report.signatures?.supervisorDate || "",
        },
      });
    } else if (approvedResidents.length > 0 && formData.drillType === "EVACUATION") {
      setFormData((prev) => ({
        ...prev,
        residentsInvolved: approvedResidents.map((r) => ({
          name: r.name,
          assistanceRequired: "",
        })),
      }));
    }
  }, [report, approvedResidents]);

  // Update day of week when date changes
  useEffect(() => {
    if (formData.drillDate) {
      const date = new Date(formData.drillDate + "T00:00:00");
      const dayIndex = date.getDay();
      setFormData((prev) => ({
        ...prev,
        dayOfWeek: DAYS_OF_WEEK[dayIndex],
      }));
    }
  }, [formData.drillDate]);

  const addStaff = () => {
    setFormData({
      ...formData,
      staffInvolved: [...formData.staffInvolved, { name: "" }],
    });
  };

  const removeStaff = (index: number) => {
    if (formData.staffInvolved.length > 1) {
      const updated = formData.staffInvolved.filter((_, i) => i !== index);
      setFormData({ ...formData, staffInvolved: updated });
    }
  };

  const updateStaff = (index: number, name: string) => {
    const updated = [...formData.staffInvolved];
    updated[index] = { name };
    setFormData({ ...formData, staffInvolved: updated });
  };

  const addResident = () => {
    setFormData({
      ...formData,
      residentsInvolved: [...formData.residentsInvolved, { name: "", assistanceRequired: "" }],
    });
  };

  const removeResident = (index: number) => {
    const updated = formData.residentsInvolved.filter((_, i) => i !== index);
    setFormData({ ...formData, residentsInvolved: updated });
  };

  const updateResident = (index: number, field: "name" | "assistanceRequired", value: string) => {
    const updated = [...formData.residentsInvolved];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, residentsInvolved: updated });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = report
        ? `/api/evacuation-drill-reports/${report.id}`
        : "/api/evacuation-drill-reports";
      const method = report ? "PUT" : "POST";

      // Calculate total minutes
      const totalMinutes =
        (parseInt(formData.totalLengthHours) || 0) * 60 +
        (parseInt(formData.totalLengthMinutes) || 0);

      const payload = {
        ...formData,
        totalLengthMinutes: totalMinutes > 0 ? totalMinutes : null,
        staffInvolved: formData.staffInvolved.filter((s) => s.name.trim()),
        residentsInvolved:
          formData.drillType === "EVACUATION"
            ? formData.residentsInvolved.filter((r) => r.name.trim())
            : null,
        disasterDrillType:
          formData.drillType === "DISASTER" ? formData.disasterDrillType : null,
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
          ? "Drill report updated successfully"
          : "Drill report submitted successfully",
      });

      router.push("/facility/admin-tasks/evacuation-drills");
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
      {/* Drill Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Drill Type</CardTitle>
          <CardDescription>
            Select the type of drill being conducted
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                formData.drillType === "EVACUATION"
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-primary/50"
              }`}
              onClick={() => setFormData({ ...formData, drillType: "EVACUATION" })}
            >
              <div className="font-medium">Evacuation Drill</div>
              <div className="text-sm text-muted-foreground">
                Staff and Residents - Every 6 Months
              </div>
            </div>
            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                formData.drillType === "DISASTER"
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-primary/50"
              }`}
              onClick={() => setFormData({ ...formData, drillType: "DISASTER" })}
            >
              <div className="font-medium">Disaster Drill</div>
              <div className="text-sm text-muted-foreground">
                Staff Only - Every 3 Months
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drill Information */}
      <Card>
        <CardHeader>
          <CardTitle>Drill Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="drillDate">Date of Drill *</Label>
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
              <Label htmlFor="dayOfWeek">Day of Week</Label>
              <Input
                id="dayOfWeek"
                value={formData.dayOfWeek}
                disabled
                className="mt-1 bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="drillTime">Time of Drill *</Label>
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
          </div>

          {formData.drillType === "DISASTER" && (
            <div>
              <Label htmlFor="disasterDrillType">Disaster Drill Type</Label>
              <Select
                value={formData.disasterDrillType}
                onValueChange={(value) =>
                  setFormData({ ...formData, disasterDrillType: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select disaster type" />
                </SelectTrigger>
                <SelectContent>
                  {DISASTER_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Total Length</Label>
              <div className="flex gap-2 mt-1">
                <div className="flex-1">
                  <Input
                    type="number"
                    min="0"
                    placeholder="Hrs"
                    value={formData.totalLengthHours}
                    onChange={(e) =>
                      setFormData({ ...formData, totalLengthHours: e.target.value })
                    }
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="Min"
                    value={formData.totalLengthMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, totalLengthMinutes: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="shift">Shift *</Label>
              <Select
                value={formData.shift}
                onValueChange={(value: "AM" | "PM") =>
                  setFormData({ ...formData, shift: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM (7:00AM - 7:00PM)</SelectItem>
                  <SelectItem value="PM">PM (7:00PM - 7:00AM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="quarter">Quarter *</Label>
              <Select
                value={formData.quarter}
                onValueChange={(value: "Q1" | "Q2" | "Q3" | "Q4") =>
                  setFormData({ ...formData, quarter: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Q1">Q1 (Jan, Feb, Mar)</SelectItem>
                  <SelectItem value="Q2">Q2 (Apr, May, Jun)</SelectItem>
                  <SelectItem value="Q3">Q3 (Jul, Aug, Sep)</SelectItem>
                  <SelectItem value="Q4">Q4 (Oct, Nov, Dec)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                type="number"
                min="2020"
                max="2100"
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: parseInt(e.target.value) })
                }
                required
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Involved */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Involved</CardTitle>
          <CardDescription>
            List all staff members who participated in the drill
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {formData.staffInvolved.map((staff, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground w-8">{index + 1}.</span>
              <Input
                value={staff.name}
                onChange={(e) => updateStaff(index, e.target.value)}
                placeholder="Staff name"
                className="flex-1"
              />
              {formData.staffInvolved.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStaff(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addStaff}>
            <Plus className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
        </CardContent>
      </Card>

      {/* Residents Involved - Only for Evacuation Drills */}
      {formData.drillType === "EVACUATION" && (
        <Card>
          <CardHeader>
            <CardTitle>Clients/Residents Involved</CardTitle>
            <CardDescription>
              List all residents who participated in the evacuation drill
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {formData.residentsInvolved.map((resident, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-8">{index + 1}.</span>
                <Input
                  value={resident.name}
                  onChange={(e) => updateResident(index, "name", e.target.value)}
                  placeholder="Client name"
                  className="flex-1"
                />
                <Input
                  value={resident.assistanceRequired}
                  onChange={(e) => updateResident(index, "assistanceRequired", e.target.value)}
                  placeholder="Type of assistance required"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeResident(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addResident}>
              <Plus className="h-4 w-4 mr-2" />
              Add Resident
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Evacuation Details */}
      <Card>
        <CardHeader>
          <CardTitle>Evacuation Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="exitBlocked">Exit Blocked (Scenario)</Label>
              <Input
                id="exitBlocked"
                value={formData.exitBlocked}
                onChange={(e) =>
                  setFormData({ ...formData, exitBlocked: e.target.value })
                }
                className="mt-1"
                placeholder="e.g., Front door"
              />
            </div>
            <div>
              <Label htmlFor="exitUsed">Exit Used</Label>
              <Input
                id="exitUsed"
                value={formData.exitUsed}
                onChange={(e) =>
                  setFormData({ ...formData, exitUsed: e.target.value })
                }
                className="mt-1"
                placeholder="e.g., Back door"
              />
            </div>
            <div>
              <Label htmlFor="assemblyPoint">Assembly Point</Label>
              <Input
                id="assemblyPoint"
                value={formData.assemblyPoint}
                onChange={(e) =>
                  setFormData({ ...formData, assemblyPoint: e.target.value })
                }
                className="mt-1"
                placeholder="e.g., Parking lot"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="correctLocation"
                checked={formData.correctLocation}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, correctLocation: checked as boolean })
                }
              />
              <Label htmlFor="correctLocation">Correct Location?</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="allAccountedFor"
                checked={formData.allAccountedFor}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, allAccountedFor: checked as boolean })
                }
              />
              <Label htmlFor="allAccountedFor">All Accounted For?</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="issuesIdentified"
                checked={formData.issuesIdentified}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, issuesIdentified: checked as boolean })
                }
              />
              <Label htmlFor="issuesIdentified">Issues Identified?</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observations */}
      <Card>
        <CardHeader>
          <CardTitle>Observations / Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.observations}
            onChange={(e) =>
              setFormData({ ...formData, observations: e.target.value })
            }
            placeholder="Enter any observations or notes about the drill..."
            rows={4}
          />
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
              <SelectValue />
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
              <Label htmlFor="conductedBy">Conducted By</Label>
              <Input
                id="conductedBy"
                value={formData.signatures.conductedBy}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    signatures: {
                      ...formData.signatures,
                      conductedBy: e.target.value,
                    },
                  })
                }
                className="mt-1"
                placeholder="Type full name"
              />
            </div>
            <div>
              <Label htmlFor="conductedByDate">Date</Label>
              <Input
                id="conductedByDate"
                type="date"
                value={formData.signatures.conductedByDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    signatures: {
                      ...formData.signatures,
                      conductedByDate: e.target.value,
                    },
                  })
                }
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supervisor">Administrator/Supervisor</Label>
              <Input
                id="supervisor"
                value={formData.signatures.supervisor}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    signatures: {
                      ...formData.signatures,
                      supervisor: e.target.value,
                    },
                  })
                }
                className="mt-1"
                placeholder="Type full name"
              />
            </div>
            <div>
              <Label htmlFor="supervisorDate">Date</Label>
              <Input
                id="supervisorDate"
                type="date"
                value={formData.signatures.supervisorDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    signatures: {
                      ...formData.signatures,
                      supervisorDate: e.target.value,
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
          onClick={() => router.push("/facility/admin-tasks/evacuation-drills")}
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
