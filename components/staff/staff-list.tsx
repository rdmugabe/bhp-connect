"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus,
  UserX,
  UserCheck,
  ShieldCheck,
  ShieldOff,
  Loader2,
  X as XIcon,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { InviteStaffDialog } from "./invite-staff-dialog";

interface StaffMember {
  userId: string;
  bhrfProfileId: string;
  name: string;
  email: string;
  isActive: boolean;
  deactivatedAt: string | null;
  isFacilityAdmin: boolean;
  createdAt: string;
  employee: { id: string; position: string; isActive: boolean } | null;
}

interface Invitation {
  id: string;
  token: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
  invitedBy: { name: string };
}

interface StaffListResponse {
  staff: StaffMember[];
  invitations: Invitation[];
  currentUserIsFacilityAdmin: boolean;
  currentUserId: string;
}

export function StaffList() {
  const { toast } = useToast();
  const [data, setData] = useState<StaffListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [busyInvitationId, setBusyInvitationId] = useState<string | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/facility/staff");
      if (!res.ok) throw new Error("Failed to load staff");
      const payload = await res.json();
      setData(payload);
    } catch (err) {
      toast({
        title: "Failed to load staff",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function callAction(
    url: string,
    method: "POST" | "DELETE",
    body?: unknown,
    successMessage?: string
  ) {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(payload.error || "Request failed");
    }
    if (successMessage) {
      toast({ title: successMessage });
    }
  }

  async function handleDeactivate(userId: string, name: string) {
    if (!confirm(`Deactivate ${name}'s login? They will no longer be able to sign in.`)) {
      return;
    }
    setBusyUserId(userId);
    try {
      await callAction(
        `/api/facility/staff/${userId}/deactivate`,
        "POST",
        undefined,
        `${name} has been deactivated`
      );
      await fetchData();
    } catch (err) {
      toast({
        title: "Failed to deactivate",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleReactivate(userId: string, name: string) {
    setBusyUserId(userId);
    try {
      await callAction(
        `/api/facility/staff/${userId}/reactivate`,
        "POST",
        undefined,
        `${name} has been reactivated`
      );
      await fetchData();
    } catch (err) {
      toast({
        title: "Failed to reactivate",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleToggleAdmin(
    userId: string,
    name: string,
    makeAdmin: boolean
  ) {
    setBusyUserId(userId);
    try {
      await callAction(
        `/api/facility/staff/${userId}/set-admin`,
        "POST",
        { isFacilityAdmin: makeAdmin },
        makeAdmin ? `${name} is now a facility admin` : `${name} is no longer a facility admin`
      );
      await fetchData();
    } catch (err) {
      toast({
        title: "Failed to update admin status",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleCancelInvitation(inv: Invitation) {
    if (!confirm(`Cancel the invitation to ${inv.email}?`)) return;
    setBusyInvitationId(inv.id);
    try {
      await callAction(
        `/api/facility/invitations/${inv.token}`,
        "DELETE",
        undefined,
        "Invitation cancelled"
      );
      await fetchData();
    } catch (err) {
      toast({
        title: "Failed to cancel invitation",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusyInvitationId(null);
    }
  }

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading staff...
      </div>
    );
  }

  const isAdmin = data.currentUserIsFacilityAdmin;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Staff Logins</CardTitle>
              <CardDescription>
                Users who can sign in to this facility. Deactivating a user blocks their login
                while preserving all their historical records.
              </CardDescription>
            </div>
            {isAdmin && (
              <Button onClick={() => setShowInviteDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Invite Staff
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.staff.map((member) => {
                const isSelf = member.userId === data.currentUserId;
                const busy = busyUserId === member.userId;
                return (
                  <TableRow key={member.userId}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {member.name}
                        {member.isFacilityAdmin && (
                          <Badge variant="secondary" className="gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Admin
                          </Badge>
                        )}
                        {isSelf && (
                          <Badge variant="outline" className="text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{member.employee?.position || "—"}</TableCell>
                    <TableCell>
                      {member.isActive ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          Deactivated
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(member.createdAt)}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!isSelf && (
                            <>
                              {member.isFacilityAdmin ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleToggleAdmin(member.userId, member.name, false)
                                  }
                                  disabled={busy}
                                  title="Remove admin"
                                >
                                  <ShieldOff className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleToggleAdmin(member.userId, member.name, true)
                                  }
                                  disabled={busy || !member.isActive}
                                  title="Make admin"
                                >
                                  <ShieldCheck className="h-4 w-4" />
                                </Button>
                              )}
                              {member.isActive ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleDeactivate(member.userId, member.name)
                                  }
                                  disabled={busy}
                                  className="text-red-600 hover:text-red-700"
                                  title="Deactivate"
                                >
                                  <UserX className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleReactivate(member.userId, member.name)
                                  }
                                  disabled={busy}
                                  className="text-green-600 hover:text-green-700"
                                  title="Reactivate"
                                >
                                  <UserCheck className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                          {busy && (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground self-center" />
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>

      {data.invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              Invitations awaiting acceptance. These expire 7 days after being sent.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Invited By</TableHead>
                  <TableHead>Expires</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.email}</TableCell>
                    <TableCell>{inv.role}</TableCell>
                    <TableCell>{inv.invitedBy.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(inv.expiresAt)}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelInvitation(inv)}
                          disabled={busyInvitationId === inv.id}
                          className="text-red-600 hover:text-red-700"
                        >
                          {busyInvitationId === inv.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XIcon className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          </CardContent>
        </Card>
      )}

      <InviteStaffDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        onInvited={fetchData}
      />
    </div>
  );
}
