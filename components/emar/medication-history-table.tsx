"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { ROUTE_LABELS, STATUS_COLORS, STATUS_LABELS } from "@/lib/emar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Eye, Edit, CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw } from "lucide-react";

interface Administration {
  id: string;
  administeredAt: string;
  administeredBy: string;
  doseGiven: string;
  route: string;
  status: string;
  refusedReason?: string;
  heldReason?: string;
  notGivenReason?: string;
  prnReasonGiven?: string;
  prnEffectiveness?: string;
  prnFollowupNotes?: string;
  vitalsBP?: string;
  vitalsPulse?: number;
  vitalsTemp?: string;
  vitalsResp?: number;
  vitalsPain?: number;
  witnessName?: string;
  notes?: string;
  medicationOrder: {
    medicationName: string;
    strength: string;
    isPRN: boolean;
    isControlled: boolean;
    intake: {
      residentName: string;
    };
  };
}

interface MedicationHistoryTableProps {
  administrations: Administration[];
  showPatientColumn?: boolean;
  onRefresh?: () => void;
  readOnly?: boolean;
}

export function MedicationHistoryTable({
  administrations,
  showPatientColumn = true,
  onRefresh,
  readOnly = false,
}: MedicationHistoryTableProps) {
  const { toast } = useToast();
  const [selectedAdmin, setSelectedAdmin] = useState<Administration | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editAdmin, setEditAdmin] = useState<Administration | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editReason, setEditReason] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editReasonForChange, setEditReasonForChange] = useState("");
  const [saving, setSaving] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "GIVEN":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "REFUSED":
      case "MISSED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "HELD":
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = STATUS_COLORS[status] || STATUS_COLORS.SCHEDULED;
    return (
      <Badge className={cn(colors.bg, colors.text, "border-0")}>
        {STATUS_LABELS[status] || status}
      </Badge>
    );
  };

  const viewDetails = (admin: Administration) => {
    setSelectedAdmin(admin);
    setDetailsOpen(true);
  };

  const openEdit = (admin: Administration) => {
    setEditAdmin(admin);
    setEditStatus(admin.status);
    setEditReason(
      admin.refusedReason || admin.heldReason || admin.notGivenReason || ""
    );
    setEditNotes(admin.notes || "");
    setEditReasonForChange("");
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editAdmin) return;

    // Require reason for change
    if (!editReasonForChange.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for this change",
        variant: "destructive",
      });
      return;
    }

    // Require reason for non-GIVEN statuses
    if (["REFUSED", "HELD", "MISSED", "NOT_AVAILABLE", "LOA"].includes(editStatus) && !editReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for this status",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        status: editStatus,
        notes: editNotes || null,
        editReason: editReasonForChange,
      };

      // Set the appropriate reason field
      if (editStatus === "REFUSED") {
        body.refusedReason = editReason;
      } else if (editStatus === "HELD") {
        body.heldReason = editReason;
      } else if (["MISSED", "NOT_AVAILABLE", "LOA"].includes(editStatus)) {
        body.notGivenReason = editReason;
      }

      const response = await fetch(`/api/emar/administrations/${editAdmin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Failed to update administration");
      }

      toast({
        title: "Updated",
        description: "Administration record has been updated",
      });

      setEditOpen(false);
      setEditAdmin(null);
      onRefresh?.();
    } catch (error) {
      console.error("Error updating administration:", error);
      toast({
        title: "Error",
        description: "Failed to update administration record",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getReasonLabel = (status: string) => {
    switch (status) {
      case "REFUSED":
        return "Reason for Refusal";
      case "HELD":
        return "Reason for Holding";
      case "MISSED":
        return "Reason for Missing";
      case "NOT_AVAILABLE":
        return "Reason Not Available";
      case "LOA":
        return "Leave of Absence Details";
      default:
        return "Reason";
    }
  };

  if (administrations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No administration history
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date/Time</TableHead>
            {showPatientColumn && <TableHead>Patient</TableHead>}
            <TableHead>Medication</TableHead>
            <TableHead>Dose</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Administered By</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {administrations.map((admin) => (
            <TableRow key={admin.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getStatusIcon(admin.status)}
                  <div>
                    <div className="font-medium">
                      {format(new Date(admin.administeredAt), "MM/dd/yyyy")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(admin.administeredAt), "h:mm a")}
                    </div>
                  </div>
                </div>
              </TableCell>
              {showPatientColumn && (
                <TableCell>
                  {admin.medicationOrder.intake.residentName}
                </TableCell>
              )}
              <TableCell>
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {admin.medicationOrder.medicationName}
                    {admin.medicationOrder.isPRN && (
                      <Badge variant="outline" className="text-xs">
                        PRN
                      </Badge>
                    )}
                    {admin.medicationOrder.isControlled && (
                      <Badge variant="destructive" className="text-xs px-1">
                        C
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {admin.medicationOrder.strength}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div>{admin.doseGiven}</div>
                  <div className="text-sm text-muted-foreground">
                    {ROUTE_LABELS[admin.route]}
                  </div>
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(admin.status)}</TableCell>
              <TableCell>
                <div>
                  <div>{admin.administeredBy}</div>
                  {admin.witnessName && (
                    <div className="text-xs text-muted-foreground">
                      Witness: {admin.witnessName}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => viewDetails(admin)}
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(admin)}
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Administration Details</DialogTitle>
          </DialogHeader>
          {selectedAdmin && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Patient</p>
                  <p className="font-medium">
                    {selectedAdmin.medicationOrder.intake.residentName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Medication</p>
                  <p className="font-medium">
                    {selectedAdmin.medicationOrder.medicationName}{" "}
                    {selectedAdmin.medicationOrder.strength}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dose Given</p>
                  <p className="font-medium">{selectedAdmin.doseGiven}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Route</p>
                  <p className="font-medium">
                    {ROUTE_LABELS[selectedAdmin.route]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date/Time</p>
                  <p className="font-medium">
                    {format(
                      new Date(selectedAdmin.administeredAt),
                      "MM/dd/yyyy h:mm a"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedAdmin.status)}
                </div>
              </div>

              {/* Staff Info */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600">
                  <strong>Administered By:</strong> {selectedAdmin.administeredBy}
                </p>
                {selectedAdmin.witnessName && (
                  <p className="text-sm text-blue-600 mt-1">
                    <strong>Witness:</strong> {selectedAdmin.witnessName}
                  </p>
                )}
              </div>

              {/* Reasons */}
              {selectedAdmin.refusedReason && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-600">
                    <strong>Reason for Refusal:</strong>{" "}
                    {selectedAdmin.refusedReason}
                  </p>
                </div>
              )}
              {selectedAdmin.heldReason && (
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-600">
                    <strong>Reason for Holding:</strong>{" "}
                    {selectedAdmin.heldReason}
                  </p>
                </div>
              )}
              {selectedAdmin.notGivenReason && (
                <div className="p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Reason:</strong> {selectedAdmin.notGivenReason}
                  </p>
                </div>
              )}

              {/* PRN Info */}
              {selectedAdmin.prnReasonGiven && (
                <div className="p-3 bg-purple-50 rounded-lg space-y-2">
                  <p className="text-sm text-purple-600">
                    <strong>PRN Reason:</strong> {selectedAdmin.prnReasonGiven}
                  </p>
                  {selectedAdmin.prnEffectiveness && (
                    <p className="text-sm text-purple-600">
                      <strong>Effectiveness:</strong>{" "}
                      {selectedAdmin.prnEffectiveness}
                    </p>
                  )}
                  {selectedAdmin.prnFollowupNotes && (
                    <p className="text-sm text-purple-600">
                      <strong>Follow-up Notes:</strong>{" "}
                      {selectedAdmin.prnFollowupNotes}
                    </p>
                  )}
                </div>
              )}

              {/* Vitals */}
              {(selectedAdmin.vitalsBP ||
                selectedAdmin.vitalsPulse ||
                selectedAdmin.vitalsTemp ||
                selectedAdmin.vitalsResp ||
                selectedAdmin.vitalsPain !== undefined) && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800 mb-2">
                    Vitals Recorded:
                  </p>
                  <div className="grid grid-cols-5 gap-2 text-sm text-green-600">
                    {selectedAdmin.vitalsBP && (
                      <div>
                        <span className="font-medium">BP:</span>{" "}
                        {selectedAdmin.vitalsBP}
                      </div>
                    )}
                    {selectedAdmin.vitalsPulse && (
                      <div>
                        <span className="font-medium">Pulse:</span>{" "}
                        {selectedAdmin.vitalsPulse}
                      </div>
                    )}
                    {selectedAdmin.vitalsTemp && (
                      <div>
                        <span className="font-medium">Temp:</span>{" "}
                        {selectedAdmin.vitalsTemp}
                      </div>
                    )}
                    {selectedAdmin.vitalsResp && (
                      <div>
                        <span className="font-medium">Resp:</span>{" "}
                        {selectedAdmin.vitalsResp}
                      </div>
                    )}
                    {selectedAdmin.vitalsPain !== undefined && (
                      <div>
                        <span className="font-medium">Pain:</span>{" "}
                        {selectedAdmin.vitalsPain}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedAdmin.notes && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Notes:</strong> {selectedAdmin.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Administration Record</DialogTitle>
          </DialogHeader>
          {editAdmin && (
            <div className="space-y-4">
              {/* Medication Info */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">
                  {editAdmin.medicationOrder.medicationName}{" "}
                  {editAdmin.medicationOrder.strength}
                </p>
                <p className="text-sm text-muted-foreground">
                  {editAdmin.medicationOrder.intake.residentName} •{" "}
                  {format(new Date(editAdmin.administeredAt), "MM/dd/yyyy h:mm a")}
                </p>
              </div>

              {/* Status Select */}
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GIVEN">Given</SelectItem>
                    <SelectItem value="REFUSED">Refused</SelectItem>
                    <SelectItem value="HELD">Held</SelectItem>
                    <SelectItem value="MISSED">Missed</SelectItem>
                    <SelectItem value="NOT_AVAILABLE">Not Available</SelectItem>
                    <SelectItem value="LOA">Leave of Absence</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reason for status (required for non-GIVEN) */}
              {editStatus && editStatus !== "GIVEN" && (
                <div className="space-y-2">
                  <Label>{getReasonLabel(editStatus)} *</Label>
                  <Textarea
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    placeholder={`Enter ${getReasonLabel(editStatus).toLowerCase()}`}
                    rows={2}
                  />
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Optional notes"
                  rows={2}
                />
              </div>

              {/* Reason for change (required) */}
              <div className="space-y-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Label className="text-yellow-800">Reason for Change *</Label>
                <Textarea
                  value={editReasonForChange}
                  onChange={(e) => setEditReasonForChange(e.target.value)}
                  placeholder="Why is this record being changed? (required for audit trail)"
                  rows={2}
                  className="border-yellow-300"
                />
                <p className="text-xs text-yellow-700">
                  This will be recorded in the audit log for compliance purposes.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
