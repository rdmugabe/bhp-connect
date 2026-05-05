"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intakeId: string;
  residentName: string;
  currentDueDate: string | Date | null;
  onSaved?: () => void;
}

export function SetDueDateDialog({
  open,
  onOpenChange,
  intakeId,
  residentName,
  currentDueDate,
  onSaved,
}: Props) {
  const { toast } = useToast();
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      // Default to current value (if set), else 30 days from today
      if (currentDueDate) {
        const d =
          typeof currentDueDate === "string"
            ? new Date(currentDueDate)
            : currentDueDate;
        setDueDate(d.toISOString().slice(0, 10));
      } else {
        const fallback = new Date();
        fallback.setUTCDate(fallback.getUTCDate() + 30);
        setDueDate(fallback.toISOString().slice(0, 10));
      }
    }
  }, [open, currentDueDate]);

  const handleSubmit = async (clear = false) => {
    if (!clear && !dueDate) {
      toast({
        variant: "destructive",
        title: "Date required",
        description: "Please choose a re-evaluation due date.",
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/residents/${intakeId}/re-evaluation-due-date`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate: clear ? null : dueDate }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed (${res.status})`);
      }
      toast({
        title: clear ? "Due date cleared" : "Due date set",
        description: clear
          ? `${residentName} has no scheduled re-evaluation.`
          : `${residentName}'s re-evaluation due ${dueDate}.`,
      });
      onSaved?.();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not save",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Re-Evaluation Due Date
          </DialogTitle>
          <DialogDescription>
            Set when <strong>{residentName}</strong>&apos;s next re-evaluation is due.
            The countdown updates immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="due-date">Next due date *</Label>
          <Input
            id="due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={submitting}
          />
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between sm:gap-0">
          <Button
            variant="ghost"
            disabled={submitting || !currentDueDate}
            onClick={() => handleSubmit(true)}
            className="text-destructive hover:text-destructive"
          >
            Clear due date
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={() => handleSubmit(false)} disabled={submitting || !dueDate}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
