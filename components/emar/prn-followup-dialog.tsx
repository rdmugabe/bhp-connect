"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { Clock, CheckCircle } from "lucide-react";

interface PRNAdministration {
  id: string;
  administeredAt: string;
  prnReasonGiven?: string;
  medicationOrder: {
    medicationName: string;
    strength: string;
    dose: string;
    intake: {
      residentName: string;
    };
  };
}

interface PRNFollowupDialogProps {
  administration: PRNAdministration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EFFECTIVENESS_OPTIONS = [
  { value: "EFFECTIVE", label: "Effective - Symptoms relieved" },
  { value: "PARTIALLY_EFFECTIVE", label: "Partially Effective - Some relief" },
  { value: "NOT_EFFECTIVE", label: "Not Effective - No relief" },
  { value: "UNABLE_TO_ASSESS", label: "Unable to Assess" },
];

export function PRNFollowupDialog({
  administration,
  open,
  onOpenChange,
  onSuccess,
}: PRNFollowupDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [effectiveness, setEffectiveness] = useState("");
  const [notes, setNotes] = useState("");
  const [followupTime, setFollowupTime] = useState("");

  // Set default time to now when dialog opens
  useEffect(() => {
    if (open) {
      const now = new Date();
      setFollowupTime(format(now, "HH:mm"));
    }
  }, [open]);

  const resetForm = () => {
    setEffectiveness("");
    setNotes("");
    setFollowupTime(format(new Date(), "HH:mm"));
  };

  const handleSubmit = async () => {
    if (!administration || !effectiveness) {
      toast({
        title: "Effectiveness Required",
        description: "Please select the effectiveness of the PRN medication",
        variant: "destructive",
      });
      return;
    }

    if (!followupTime) {
      toast({
        title: "Time Required",
        description: "Please enter the time the follow-up was done",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Build the follow-up datetime using today's date and the entered time
    const now = new Date();
    const [hours, minutes] = followupTime.split(":").map(Number);
    const followupDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);

    try {
      const response = await fetch(
        `/api/emar/administrations/${administration.id}/prn-followup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prnEffectiveness: effectiveness,
            prnFollowupNotes: notes || "Follow-up completed",
            followupTime: followupDateTime.toISOString(),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to record follow-up");
      }

      toast({
        title: "Follow-up Recorded",
        description: "PRN effectiveness has been documented",
      });

      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error recording follow-up:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to record follow-up",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!administration) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            PRN Follow-up
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Administration Info */}
          <div className="p-4 bg-blue-50 rounded-lg space-y-2">
            <p className="text-sm text-blue-600">
              <strong>Patient:</strong>{" "}
              {administration.medicationOrder.intake.residentName}
            </p>
            <p className="text-sm text-blue-600">
              <strong>Medication:</strong>{" "}
              {administration.medicationOrder.medicationName}{" "}
              {administration.medicationOrder.strength}
            </p>
            <p className="text-sm text-blue-600">
              <strong>Administered:</strong>{" "}
              {format(new Date(administration.administeredAt), "MM/dd/yyyy h:mm a")}
            </p>
            {administration.prnReasonGiven && (
              <p className="text-sm text-blue-600">
                <strong>Reason:</strong> {administration.prnReasonGiven}
              </p>
            )}
          </div>

          {/* Follow-up Time */}
          <div className="space-y-2">
            <Label>Follow-up Time *</Label>
            <Input
              type="time"
              value={followupTime}
              onChange={(e) => setFollowupTime(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Enter the time when you assessed the medication effectiveness
            </p>
          </div>

          {/* Effectiveness */}
          <div className="space-y-2">
            <Label>Effectiveness *</Label>
            <Select value={effectiveness} onValueChange={setEffectiveness}>
              <SelectTrigger>
                <SelectValue placeholder="Select effectiveness" />
              </SelectTrigger>
              <SelectContent>
                {EFFECTIVENESS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Follow-up Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Document patient response and any observations"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !effectiveness}>
              {loading ? "Recording..." : "Record Follow-up"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
