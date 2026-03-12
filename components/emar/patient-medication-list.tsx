"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { PRNAdministrationDialog } from "./prn-administration-dialog";
import { ROUTE_LABELS, getFrequencyLabel, STATUS_COLORS } from "@/lib/emar";
import {
  Pill,
  Plus,
  MoreHorizontal,
  Clock,
  Pause,
  StopCircle,
  RefreshCw,
  AlertTriangle,
  Syringe,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface MedicationOrder {
  id: string;
  medicationName: string;
  genericName: string | null;
  strength: string;
  dose: string;
  route: string;
  frequency: string;
  isPRN: boolean;
  prnReason: string | null;
  prnMinIntervalHours: number | null;
  prnMaxDailyDoses: number | null;
  isControlled: boolean;
  status: string;
  startDate: string;
  endDate: string | null;
  prescriberName: string;
  instructions: string | null;
  _count: {
    schedules: number;
    administrations: number;
  };
}

interface PatientInfo {
  id: string;
  residentName: string;
  dateOfBirth: string;
  allergies: string | null;
}

interface PatientMedicationListProps {
  intakeId: string;
  patientName: string;
  allergies?: string;
  readOnly?: boolean;
}

export function PatientMedicationList({
  intakeId,
  patientName,
  allergies,
  dateOfBirth,
  readOnly = false,
}: PatientMedicationListProps & { dateOfBirth?: string }) {
  const { toast } = useToast();
  const [orders, setOrders] = useState<MedicationOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [discontinueDialogOpen, setDiscontinueDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<MedicationOrder | null>(null);
  const [discontinueReason, setDiscontinueReason] = useState("");
  const [discontinuing, setDiscontinuing] = useState(false);
  const [prnDialogOpen, setPrnDialogOpen] = useState(false);
  const [selectedPrnOrder, setSelectedPrnOrder] = useState<MedicationOrder | null>(null);
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`/api/emar/orders?intakeId=${intakeId}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast({
        title: "Error",
        description: "Failed to load medications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientInfo = async () => {
    try {
      const response = await fetch(`/api/intakes/${intakeId}`);
      if (response.ok) {
        const data = await response.json();
        setPatientInfo({
          id: data.intake.id,
          residentName: data.intake.residentName,
          dateOfBirth: data.intake.dateOfBirth,
          allergies: data.intake.allergies,
        });
      }
    } catch (error) {
      console.error("Failed to fetch patient info:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchPatientInfo();
  }, [intakeId]);

  const handleDiscontinue = async () => {
    if (!selectedOrder || !discontinueReason) return;

    setDiscontinuing(true);

    try {
      const response = await fetch(`/api/emar/orders/${selectedOrder.id}/discontinue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discontinueReason }),
      });

      if (!response.ok) {
        throw new Error("Failed to discontinue medication");
      }

      toast({
        title: "Medication Discontinued",
        description: `${selectedOrder.medicationName} has been discontinued`,
      });

      setDiscontinueDialogOpen(false);
      setSelectedOrder(null);
      setDiscontinueReason("");
      fetchOrders();
    } catch (error) {
      console.error("Error discontinuing medication:", error);
      toast({
        title: "Error",
        description: "Failed to discontinue medication",
        variant: "destructive",
      });
    } finally {
      setDiscontinuing(false);
    }
  };

  const activeOrders = orders.filter((o) => o.status === "ACTIVE");
  const inactiveOrders = orders.filter((o) => o.status !== "ACTIVE");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Patient Info Header */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{patientName}</h2>
              <p className="text-sm text-muted-foreground">
                {activeOrders.length} active medication{activeOrders.length !== 1 && "s"}
              </p>
            </div>
            {allergies && (
              <div className="flex items-center gap-2 px-3 py-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-700">
                  <strong>Allergies:</strong> {allergies}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add New Medication Button */}
      {!readOnly && (
        <div className="flex justify-end">
          <Link href={`/facility/emar/patients/${intakeId}/orders/new`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Medication Order
            </Button>
          </Link>
        </div>
      )}

      {/* Active Medications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Active Medications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No active medications
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medication</TableHead>
                  <TableHead>Dose</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Prescriber</TableHead>
                  <TableHead>Start Date</TableHead>
                  {!readOnly && <TableHead></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {order.medicationName}
                          {order.isPRN && (
                            <Badge variant="outline" className="text-xs">PRN</Badge>
                          )}
                          {order.isControlled && (
                            <Badge variant="destructive" className="text-xs">C</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.strength}
                          {order.genericName && ` (${order.genericName})`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{order.dose}</TableCell>
                    <TableCell>
                      <div>
                        {getFrequencyLabel(order.frequency as any)}
                        {order.isPRN && order.prnReason && (
                          <div className="text-xs text-muted-foreground">
                            For: {order.prnReason}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{ROUTE_LABELS[order.route]}</TableCell>
                    <TableCell>{order.prescriberName}</TableCell>
                    <TableCell>
                      {format(new Date(order.startDate), "MM/dd/yyyy")}
                    </TableCell>
                    {!readOnly && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {order.isPRN && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-purple-600 border-purple-300 hover:bg-purple-50"
                              onClick={() => {
                                setSelectedPrnOrder(order);
                                setPrnDialogOpen(true);
                              }}
                            >
                              <Syringe className="h-4 w-4 mr-1" />
                              Give PRN
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {order.isPRN && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedPrnOrder(order);
                                      setPrnDialogOpen(true);
                                    }}
                                  >
                                    <Syringe className="h-4 w-4 mr-2" />
                                    Administer PRN
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuItem asChild>
                                <Link href={`/facility/emar/patients/${intakeId}/orders/${order.id}`}>
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setDiscontinueDialogOpen(true);
                                }}
                              >
                                <StopCircle className="h-4 w-4 mr-2" />
                                Discontinue
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Inactive Medications */}
      {inactiveOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-muted-foreground">
              Inactive Medications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medication</TableHead>
                  <TableHead>Dose</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Range</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inactiveOrders.map((order) => (
                  <TableRow key={order.id} className="opacity-60">
                    <TableCell>
                      <div className="font-medium">{order.medicationName}</div>
                      <div className="text-sm text-muted-foreground">
                        {order.strength}
                      </div>
                    </TableCell>
                    <TableCell>{order.dose}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{order.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.startDate), "MM/dd/yyyy")} -
                      {order.endDate
                        ? format(new Date(order.endDate), "MM/dd/yyyy")
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Discontinue Dialog */}
      <AlertDialog open={discontinueDialogOpen} onOpenChange={setDiscontinueDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discontinue Medication</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to discontinue {selectedOrder?.medicationName}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label>Reason for Discontinuation *</Label>
            <Textarea
              value={discontinueReason}
              onChange={(e) => setDiscontinueReason(e.target.value)}
              placeholder="Enter the reason for discontinuing this medication"
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={discontinuing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscontinue}
              disabled={!discontinueReason || discontinuing}
              className="bg-red-600 hover:bg-red-700"
            >
              {discontinuing ? "Discontinuing..." : "Discontinue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PRN Administration Dialog */}
      <PRNAdministrationDialog
        order={selectedPrnOrder}
        patient={patientInfo}
        open={prnDialogOpen}
        onOpenChange={(open) => {
          setPrnDialogOpen(open);
          if (!open) setSelectedPrnOrder(null);
        }}
        onSuccess={() => {
          fetchOrders();
        }}
      />
    </div>
  );
}
