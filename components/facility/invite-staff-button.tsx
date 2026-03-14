"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { InviteStaffDialog } from "./invite-staff-dialog";

interface InviteStaffButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
}

export function InviteStaffButton({ variant = "outline" }: InviteStaffButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button variant={variant} onClick={() => setDialogOpen(true)}>
        <UserPlus className="mr-2 h-4 w-4" />
        Invite Staff
      </Button>
      <InviteStaffDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
