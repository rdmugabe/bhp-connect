"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { X, Mail, Plus, Loader2 } from "lucide-react";

interface EnrollmentEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residentId: string;
  residentName: string;
  bhpEmail: string;
}

export function EnrollmentEmailDialog({
  open,
  onOpenChange,
  residentId,
  residentName,
  bhpEmail,
}: EnrollmentEmailDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [additionalRecipients, setAdditionalRecipients] = useState<string[]>([]);
  const [emailError, setEmailError] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddEmail = () => {
    const email = newEmail.trim().toLowerCase();

    if (!email) {
      setEmailError("Please enter an email address");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    if (email === bhpEmail.toLowerCase()) {
      setEmailError("This email is already included as the primary recipient");
      return;
    }

    if (additionalRecipients.includes(email)) {
      setEmailError("This email has already been added");
      return;
    }

    setAdditionalRecipients([...additionalRecipients, email]);
    setNewEmail("");
    setEmailError("");
  };

  const handleRemoveEmail = (email: string) => {
    setAdditionalRecipients(additionalRecipients.filter((e) => e !== email));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const handleSend = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/residents/${residentId}/send-enrollment-email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ additionalRecipients }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send email");
      }

      toast({
        title: "Email Sent",
        description: `Enrollment notification sent successfully`,
      });

      // Reset state and close dialog
      setAdditionalRecipients([]);
      setNewEmail("");
      setEmailError("");
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to send email",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setAdditionalRecipients([]);
    setNewEmail("");
    setEmailError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Enrollment Email
          </DialogTitle>
          <DialogDescription>
            Send enrollment notification for <strong>{residentName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Primary recipient (BHP email) */}
          <div className="space-y-2">
            <Label>Primary Recipient</Label>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="px-3 py-1.5">
                {bhpEmail}
              </Badge>
              <span className="text-xs text-muted-foreground">(You)</span>
            </div>
          </div>

          {/* Additional recipients */}
          <div className="space-y-2">
            <Label htmlFor="additionalEmail">Additional Recipients</Label>

            {additionalRecipients.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {additionalRecipients.map((email) => (
                  <Badge
                    key={email}
                    variant="outline"
                    className="px-2 py-1 flex items-center gap-1"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(email)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                id="additionalEmail"
                type="email"
                placeholder="Enter email address"
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value);
                  setEmailError("");
                }}
                onKeyDown={handleKeyDown}
                className={emailError ? "border-red-500" : ""}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddEmail}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {emailError && (
              <p className="text-sm text-red-500">{emailError}</p>
            )}

            <p className="text-xs text-muted-foreground">
              Press Enter or click + to add recipients
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
