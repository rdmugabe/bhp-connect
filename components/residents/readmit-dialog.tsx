"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { RefreshCcw, Loader2, CheckCircle } from "lucide-react";

interface ReadmitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residentId: string;
  residentName: string;
  onSuccess?: (newIntakeId: string) => void;
}

export function ReadmitDialog({
  open,
  onOpenChange,
  residentId,
  residentName,
  onSuccess,
}: ReadmitDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleReadmit = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/intakes/${residentId}/readmit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create re-admission");
      }

      const data = await response.json();

      toast({
        title: "Re-admission Created",
        description: `A new intake draft has been created for ${residentName}. You will be redirected to complete it.`,
      });

      onOpenChange(false);
      onSuccess?.(data.intake.id);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create re-admission",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCcw className="h-5 w-5" />
            Re-admit Patient
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <p>
              Create a new intake for <strong>{residentName}</strong>?
            </p>
            <p className="text-sm">
              A new intake draft will be created with:
            </p>
            <ul className="text-sm list-inside space-y-1 text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Demographics and contact information pre-filled
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Insurance and medical history copied
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Previous medications included
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Link to previous admission for reference
              </li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              You&apos;ll need to complete the current symptoms, behavioral assessment, and other time-sensitive sections.
            </p>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleReadmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Create Re-admission
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
