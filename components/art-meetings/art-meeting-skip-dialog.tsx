"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { SkipForward } from "lucide-react";

interface ARTMeetingSkipDialogProps {
  meetingId: string;
  residentName: string;
  meetingMonth: number;
  meetingYear: number;
  trigger?: React.ReactNode;
  onSkipped?: () => void;
}

export function ARTMeetingSkipDialog({
  meetingId,
  residentName,
  meetingMonth,
  meetingYear,
  trigger,
  onSkipped,
}: ARTMeetingSkipDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [skipReason, setSkipReason] = useState("");

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  async function handleSkip() {
    if (skipReason.length < 10) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Skip reason must be at least 10 characters",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/art-meetings/${meetingId}/skip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skipReason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to skip ART meeting");
      }

      toast({
        title: "Meeting Skipped",
        description: `ART meeting for ${monthNames[meetingMonth - 1]} ${meetingYear} has been marked as skipped.`,
      });

      setOpen(false);
      setSkipReason("");

      if (onSkipped) {
        onSkipped();
      } else {
        router.refresh();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to skip ART meeting",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <SkipForward className="h-4 w-4 mr-1" />
            Skip
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Skip ART Meeting</DialogTitle>
          <DialogDescription>
            Skip the {monthNames[meetingMonth - 1]} {meetingYear} ART meeting for{" "}
            <strong>{residentName}</strong>. You must provide a reason for skipping.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="skipReason">
              Reason for Skipping *
            </Label>
            <Textarea
              id="skipReason"
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              placeholder="Explain why this meeting is being skipped (minimum 10 characters)..."
              rows={4}
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              {skipReason.length} / 10 minimum characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSkip}
            disabled={isLoading || skipReason.length < 10}
          >
            {isLoading ? "Skipping..." : "Skip Meeting"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
