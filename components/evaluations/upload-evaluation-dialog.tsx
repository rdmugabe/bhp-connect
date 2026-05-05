"use client";

import { useState, useRef, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileText, Loader2 } from "lucide-react";

const todayIso = new Date().toISOString().slice(0, 10);

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intakeId: string;
  residentName: string;
  /** Current next-due-date, used as a default suggestion. */
  currentDueDate?: string | Date | null;
  onUploaded?: () => void;
}

export function UploadEvaluationDialog({
  open,
  onOpenChange,
  intakeId,
  residentName,
  currentDueDate,
  onUploaded,
}: Props) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [completedDate, setCompletedDate] = useState(todayIso);
  const [nextDueDate, setNextDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      // Pre-fill next due date: use current if set, else +30 days from today
      if (currentDueDate) {
        const d =
          typeof currentDueDate === "string"
            ? new Date(currentDueDate)
            : currentDueDate;
        setNextDueDate(d.toISOString().slice(0, 10));
      } else {
        const fallback = new Date();
        fallback.setUTCDate(fallback.getUTCDate() + 30);
        setNextDueDate(fallback.toISOString().slice(0, 10));
      }
      setCompletedDate(todayIso);
    }
  }, [open, currentDueDate]);

  const reset = () => {
    setFile(null);
    setNotes("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please choose a PDF to upload.",
      });
      return;
    }
    if (!nextDueDate) {
      toast({
        variant: "destructive",
        title: "Next due date required",
        description: "Enter when the next re-evaluation is due.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("completedDate", completedDate);
      form.append("nextDueDate", nextDueDate);
      if (notes.trim()) form.append("notes", notes.trim());

      const res = await fetch(`/api/residents/${intakeId}/evaluations`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Upload failed (${res.status})`);
      }

      toast({
        title: "Re-evaluation uploaded",
        description: `Saved for ${residentName}. Next re-evaluation due ${nextDueDate}.`,
      });
      reset();
      onUploaded?.();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Re-Evaluation</DialogTitle>
          <DialogDescription>
            For <strong>{residentName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eval-file">Signed Re-Evaluation PDF *</Label>
            <Input
              id="eval-file"
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={submitting}
            />
            {file && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                {file.name} · {(file.size / 1024).toFixed(0)} KB
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="eval-completed-date">Evaluation date *</Label>
              <Input
                id="eval-completed-date"
                type="date"
                value={completedDate}
                max={todayIso}
                onChange={(e) => setCompletedDate(e.target.value)}
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">When the eval was signed.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="eval-next-due">Next due date *</Label>
              <Input
                id="eval-next-due"
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                When the next re-evaluation is due.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="eval-notes">Notes (optional)</Label>
            <Textarea
              id="eval-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any context for auditors or other staff..."
              disabled={submitting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !file || !nextDueDate}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
