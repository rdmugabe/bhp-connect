"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, RefreshCcw } from "lucide-react";
import { DischargeConfirmationDialog } from "./discharge-confirmation-dialog";
import { ReadmitDialog } from "./readmit-dialog";

interface ResidentActionsProps {
  residentId: string;
  residentName: string;
  isDischargedReady: boolean;
  isAlreadyDischarged: boolean;
}

export function ResidentActions({
  residentId,
  residentName,
  isDischargedReady,
  isAlreadyDischarged,
}: ResidentActionsProps) {
  const router = useRouter();
  const [dischargeDialogOpen, setDischargeDialogOpen] = useState(false);
  const [readmitDialogOpen, setReadmitDialogOpen] = useState(false);

  const handleDischargeSuccess = () => {
    router.refresh();
  };

  const handleReadmitSuccess = (newIntakeId: string) => {
    router.push(`/facility/intakes/${newIntakeId}/edit`);
  };

  if (isAlreadyDischarged) {
    return (
      <>
        <Button onClick={() => setReadmitDialogOpen(true)}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Re-admit Patient
        </Button>
        <ReadmitDialog
          open={readmitDialogOpen}
          onOpenChange={setReadmitDialogOpen}
          residentId={residentId}
          residentName={residentName}
          onSuccess={handleReadmitSuccess}
        />
      </>
    );
  }

  if (isDischargedReady) {
    return (
      <>
        <Button variant="outline" onClick={() => setDischargeDialogOpen(true)}>
          <LogOut className="h-4 w-4 mr-2" />
          Discharge Patient
        </Button>
        <DischargeConfirmationDialog
          open={dischargeDialogOpen}
          onOpenChange={setDischargeDialogOpen}
          residentId={residentId}
          residentName={residentName}
          onSuccess={handleDischargeSuccess}
        />
      </>
    );
  }

  return null;
}
