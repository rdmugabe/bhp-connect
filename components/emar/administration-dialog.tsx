"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { SixRightsChecklist } from "./six-rights-checklist";
import { ROUTE_LABELS, SIX_RIGHTS } from "@/lib/emar";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle, XCircle, Clock, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

interface Schedule {
  id: string;
  scheduledTime: string;
  scheduledDateTime: string;
  status: string;
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
}

interface AdministrationDialogProps {
  schedule: Schedule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type AdministrationStatus = "GIVEN" | "REFUSED" | "HELD" | "NOT_AVAILABLE" | "LOA";

export function AdministrationDialog({
  schedule,
  open,
  onOpenChange,
  onSuccess,
}: AdministrationDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<AdministrationStatus>("GIVEN");
  const [checkedRights, setCheckedRights] = useState<Record<string, boolean>>({});
  const [refusedReason, setRefusedReason] = useState("");
  const [heldReason, setHeldReason] = useState("");
  const [notGivenReason, setNotGivenReason] = useState("");
  const [notes, setNotes] = useState("");
  const [witnessId, setWitnessId] = useState("");
  const [witnessName, setWitnessName] = useState("");

  // Vitals
  const [vitalsBP, setVitalsBP] = useState("");
  const [vitalsPulse, setVitalsPulse] = useState("");
  const [vitalsTemp, setVitalsTemp] = useState("");
  const [vitalsResp, setVitalsResp] = useState("");
  const [vitalsPain, setVitalsPain] = useState("");

  const handleCheckRight = (rightId: string, checked: boolean) => {
    setCheckedRights((prev) => ({ ...prev, [rightId]: checked }));
  };

  const allRightsChecked = SIX_RIGHTS.every((right) => checkedRights[right.id]);

  const resetForm = () => {
    setStatus("GIVEN");
    setCheckedRights({});
    setRefusedReason("");
    setHeldReason("");
    setNotGivenReason("");
    setNotes("");
    setWitnessId("");
    setWitnessName("");
    setVitalsBP("");
    setVitalsPulse("");
    setVitalsTemp("");
    setVitalsResp("");
    setVitalsPain("");
  };

  const handleSubmit = async () => {
    if (!schedule) return;

    if (status === "GIVEN" && !allRightsChecked) {
      toast({
        title: "Verification Required",
        description: "Please verify all 6 Rights before administering medication",
        variant: "destructive",
      });
      return;
    }

    if (status === "REFUSED" && !refusedReason) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for refusal",
        variant: "destructive",
      });
      return;
    }

    if (status === "HELD" && !heldReason) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for holding the medication",
        variant: "destructive",
      });
      return;
    }

    if (schedule.medicationOrder.isControlled && status === "GIVEN" && (!witnessId || !witnessName)) {
      toast({
        title: "Witness Required",
        description: "Controlled substances require a witness signature",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/emar/administer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleId: schedule.id,
          medicationOrderId: schedule.medicationOrder.id,
          administeredAt: new Date().toISOString(),
          doseGiven: schedule.medicationOrder.dose,
          route: schedule.medicationOrder.route,
          status,
          refusedReason: status === "REFUSED" ? refusedReason : undefined,
          heldReason: status === "HELD" ? heldReason : undefined,
          notGivenReason: status === "NOT_AVAILABLE" || status === "LOA" ? notGivenReason : undefined,
          vitalsBP: vitalsBP || undefined,
          vitalsPulse: vitalsPulse ? parseInt(vitalsPulse) : undefined,
          vitalsTemp: vitalsTemp || undefined,
          vitalsResp: vitalsResp ? parseInt(vitalsResp) : undefined,
          vitalsPain: vitalsPain ? parseInt(vitalsPain) : undefined,
          witnessId: witnessId || undefined,
          witnessName: witnessName || undefined,
          notes: notes || undefined,
          sixRightsVerified: allRightsChecked,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to record administration");
      }

      toast({
        title: "Administration Recorded",
        description: `${schedule.medicationOrder.medicationName} - ${status}`,
      });

      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error recording administration:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record administration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!schedule) return null;

  const { medicationOrder } = schedule;
  const patient = medicationOrder.intake;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Administer Medication</DialogTitle>
        </DialogHeader>

        {/* Patient & Medication Info */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
          <div>
            <p className="text-sm text-blue-600">Patient</p>
            <p className="font-semibold">{patient.residentName}</p>
            <p className="text-sm text-muted-foreground">
              DOB: {format(new Date(patient.dateOfBirth), "MM/dd/yyyy")}
            </p>
          </div>
          <div>
            <p className="text-sm text-blue-600">Medication</p>
            <p className="font-semibold">{medicationOrder.medicationName}</p>
            <p className="text-sm text-muted-foreground">
              {medicationOrder.dose} - {ROUTE_LABELS[medicationOrder.route]}
            </p>
          </div>
        </div>

        {/* Allergy Warning */}
        {patient.allergies && (
          <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-orange-700">
              <strong>Allergies:</strong> {patient.allergies}
            </span>
          </div>
        )}

        {/* Special Instructions */}
        {medicationOrder.instructions && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium">Instructions:</p>
            <p className="text-sm text-muted-foreground">{medicationOrder.instructions}</p>
          </div>
        )}

        {/* Status Selection */}
        <div className="space-y-3">
          <Label>Administration Status</Label>
          <div className="grid grid-cols-5 gap-2">
            {[
              { value: "GIVEN", label: "Given", icon: CheckCircle, color: "text-green-600" },
              { value: "REFUSED", label: "Refused", icon: XCircle, color: "text-red-600" },
              { value: "HELD", label: "Held", icon: Clock, color: "text-orange-600" },
              { value: "NOT_AVAILABLE", label: "Not Available", icon: Ban, color: "text-gray-600" },
              { value: "LOA", label: "LOA", icon: Ban, color: "text-blue-600" },
            ].map(({ value, label, icon: Icon, color }) => (
              <Button
                key={value}
                type="button"
                variant={status === value ? "default" : "outline"}
                className={cn(
                  "flex flex-col h-auto py-3 gap-1",
                  status === value && "ring-2 ring-offset-2"
                )}
                onClick={() => setStatus(value as AdministrationStatus)}
              >
                <Icon className={cn("h-5 w-5", status !== value && color)} />
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Status-specific content */}
        {status === "GIVEN" && (
          <>
            {/* 6 Rights Checklist */}
            <SixRightsChecklist
              patientName={patient.residentName}
              dateOfBirth={format(new Date(patient.dateOfBirth), "MM/dd/yyyy")}
              medicationName={medicationOrder.medicationName}
              strength={medicationOrder.strength}
              dose={medicationOrder.dose}
              route={ROUTE_LABELS[medicationOrder.route]}
              scheduledTime={format(new Date(schedule.scheduledDateTime), "h:mm a")}
              checkedRights={checkedRights}
              onCheckRight={handleCheckRight}
            />

            {/* Controlled Substance Witness */}
            {medicationOrder.isControlled && (
              <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <Label className="text-yellow-800 font-medium">
                    Controlled Substance - Witness Required
                  </Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Witness Name</Label>
                    <Input
                      value={witnessName}
                      onChange={(e) => setWitnessName(e.target.value)}
                      placeholder="Full name of witness"
                    />
                  </div>
                  <div>
                    <Label>Witness ID</Label>
                    <Input
                      value={witnessId}
                      onChange={(e) => setWitnessId(e.target.value)}
                      placeholder="Employee ID"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Optional Vitals */}
            <div className="space-y-3">
              <Label>Vitals (Optional)</Label>
              <div className="grid grid-cols-5 gap-3">
                <div>
                  <Label className="text-xs">BP</Label>
                  <Input
                    value={vitalsBP}
                    onChange={(e) => setVitalsBP(e.target.value)}
                    placeholder="120/80"
                  />
                </div>
                <div>
                  <Label className="text-xs">Pulse</Label>
                  <Input
                    type="number"
                    value={vitalsPulse}
                    onChange={(e) => setVitalsPulse(e.target.value)}
                    placeholder="72"
                  />
                </div>
                <div>
                  <Label className="text-xs">Temp</Label>
                  <Input
                    value={vitalsTemp}
                    onChange={(e) => setVitalsTemp(e.target.value)}
                    placeholder="98.6"
                  />
                </div>
                <div>
                  <Label className="text-xs">Resp</Label>
                  <Input
                    type="number"
                    value={vitalsResp}
                    onChange={(e) => setVitalsResp(e.target.value)}
                    placeholder="16"
                  />
                </div>
                <div>
                  <Label className="text-xs">Pain (0-10)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={vitalsPain}
                    onChange={(e) => setVitalsPain(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {status === "REFUSED" && (
          <div className="space-y-2">
            <Label>Reason for Refusal *</Label>
            <Textarea
              value={refusedReason}
              onChange={(e) => setRefusedReason(e.target.value)}
              placeholder="Document why the patient refused the medication"
              rows={3}
            />
          </div>
        )}

        {status === "HELD" && (
          <div className="space-y-2">
            <Label>Reason for Holding *</Label>
            <Textarea
              value={heldReason}
              onChange={(e) => setHeldReason(e.target.value)}
              placeholder="Document why the medication was held"
              rows={3}
            />
          </div>
        )}

        {(status === "NOT_AVAILABLE" || status === "LOA") && (
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              value={notGivenReason}
              onChange={(e) => setNotGivenReason(e.target.value)}
              placeholder="Additional notes"
              rows={2}
            />
          </div>
        )}

        {/* Additional Notes */}
        <div className="space-y-2">
          <Label>Additional Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional observations or comments"
            rows={2}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || (status === "GIVEN" && !allRightsChecked)}
          >
            {loading ? "Recording..." : "Record Administration"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
