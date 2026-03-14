"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Loader2, CheckCircle, UserPlus } from "lucide-react";

const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.string().min(1, "Please select a position"),
});

type InviteFormInput = z.infer<typeof inviteSchema>;

const COMMON_ROLES = [
  { value: "BHT", label: "BHT (Behavioral Health Technician)" },
  { value: "Case Manager", label: "Case Manager" },
  { value: "Administrator", label: "Administrator" },
  { value: "Nurse", label: "Nurse (RN/LPN)" },
  { value: "Counselor", label: "Counselor" },
  { value: "House Manager", label: "House Manager" },
  { value: "Program Director", label: "Program Director" },
  { value: "Other", label: "Other" },
];

interface InviteStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteStaffDialog({
  open,
  onOpenChange,
}: InviteStaffDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lastInvitedEmail, setLastInvitedEmail] = useState("");
  const [customRole, setCustomRole] = useState("");

  const form = useForm<InviteFormInput>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "",
    },
  });

  const selectedRole = form.watch("role");

  const handleClose = () => {
    form.reset();
    setSuccess(false);
    setLastInvitedEmail("");
    setCustomRole("");
    onOpenChange(false);
  };

  const handleSendAnother = () => {
    form.reset();
    setSuccess(false);
    setLastInvitedEmail("");
    setCustomRole("");
  };

  async function onSubmit(data: InviteFormInput) {
    setIsLoading(true);

    try {
      const roleToSend = data.role === "Other" ? customRole : data.role;

      if (data.role === "Other" && !customRole.trim()) {
        form.setError("role", { message: "Please enter a custom role" });
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/facility/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          role: roleToSend,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send invitation");
      }

      setLastInvitedEmail(data.email);
      setSuccess(true);

      toast({
        title: "Invitation Sent",
        description: `An invitation has been sent to ${data.email}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to send invitation",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Staff Member
          </DialogTitle>
          <DialogDescription>
            Send an invitation email to add a new staff member to your facility.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Invitation Sent!</h3>
              <p className="text-sm text-muted-foreground mb-1">
                An invitation email has been sent to:
              </p>
              <p className="font-medium text-primary">{lastInvitedEmail}</p>
              <p className="text-xs text-muted-foreground mt-4">
                The invitation will expire in 7 days.
              </p>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                Done
              </Button>
              <Button className="flex-1" onClick={handleSendAnother}>
                <Mail className="h-4 w-4 mr-2" />
                Send Another
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="newstaff@email.com"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The staff member will receive an invitation at this email.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COMMON_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The role or position of the new staff member.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedRole === "Other" && (
                <FormItem>
                  <FormLabel>Custom Position</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter position title"
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}

              <DialogFooter className="gap-2 sm:gap-0 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
