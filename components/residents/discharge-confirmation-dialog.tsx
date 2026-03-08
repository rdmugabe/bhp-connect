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
import { AlertTriangle, LogOut, Loader2 } from "lucide-react";

interface DischargeConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residentId: string;
  residentName: string;
  onSuccess?: () => void;
}

export function DischargeConfirmationDialog({
  open,
  onOpenChange,
  residentId,
  residentName,
  onSuccess,
}: DischargeConfirmationDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleDischarge = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/intakes/${residentId}/discharge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to discharge resident");
      }

      toast({
        title: "Resident Discharged",
        description: `${residentName} has been successfully discharged.`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to discharge resident",
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
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Confirm Discharge
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <p>
              Are you sure you want to discharge <strong>{residentName}</strong>?
            </p>
            <p className="text-sm">
              This action will:
            </p>
            <ul className="text-sm list-disc list-inside space-y-1 text-muted-foreground">
              <li>Move the resident to the &quot;Discharged&quot; category</li>
              <li>All documents will remain accessible for record-keeping</li>
              <li>The resident can be re-admitted later if needed</li>
            </ul>
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
          <Button
            onClick={handleDischarge}
            disabled={isLoading}
            variant="default"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Discharging...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4 mr-2" />
                Discharge Patient
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
