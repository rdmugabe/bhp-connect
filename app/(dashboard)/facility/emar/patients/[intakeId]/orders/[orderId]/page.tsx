"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ROUTE_LABELS, getFrequencyLabel } from "@/lib/emar";
import { MedicationHistoryTable } from "@/components/emar";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import {
  ArrowLeft,
  RefreshCw,
  Pill,
  Calendar,
  User,
  AlertTriangle,
  StopCircle,
} from "lucide-react";

interface MedicationOrder {
  id: string;
  medicationName: string;
  genericName: string | null;
  strength: string;
  dosageForm: string | null;
  dose: string;
  route: string;
  frequency: string;
  customFrequency: string | null;
  scheduleTimes: string[];
  isPRN: boolean;
  prnReason: string | null;
  prnMinIntervalHours: number | null;
  prnMaxDailyDoses: number | null;
  prescriberName: string;
  prescriberNPI: string | null;
  prescriberPhone: string | null;
  startDate: string;
  endDate: string | null;
  instructions: string | null;
  administrationNotes: string | null;
  pharmacyName: string | null;
  pharmacyPhone: string | null;
  rxNumber: string | null;
  isControlled: boolean;
  controlSchedule: string | null;
  status: string;
  discontinuedAt: string | null;
  discontinuedBy: string | null;
  discontinueReason: string | null;
  orderedBy: string;
  orderedAt: string;
  intake: {
    id: string;
    residentName: string;
    dateOfBirth: string;
    allergies: string | null;
  };
  _count: {
    schedules: number;
    administrations: number;
  };
}

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

export default function MedicationOrderDetailPage({
  params,
}: {
  params: { intakeId: string; orderId: string };
}) {
  const { intakeId, orderId } = params;
  const router = useRouter();
  const { toast } = useToast();
  const [order, setOrder] = useState<MedicationOrder | null>(null);
  const [administrations, setAdministrations] = useState<Administration[]>([]);
  const [loading, setLoading] = useState(true);
  const [discontinueDialogOpen, setDiscontinueDialogOpen] = useState(false);
  const [discontinueReason, setDiscontinueReason] = useState("");
  const [discontinuing, setDiscontinuing] = useState(false);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/emar/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
      }
    } catch (error) {
      console.error("Failed to fetch order:", error);
    }
  };

  const fetchAdministrations = async () => {
    try {
      const response = await fetch(
        `/api/emar/administrations?medicationOrderId=${orderId}`
      );
      if (response.ok) {
        const data = await response.json();
        setAdministrations(data.administrations || []);
      }
    } catch (error) {
      console.error("Failed to fetch administrations:", error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchOrder(), fetchAdministrations()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [orderId]);

  const handleDiscontinue = async () => {
    if (!discontinueReason) return;

    setDiscontinuing(true);
    try {
      const response = await fetch(`/api/emar/orders/${orderId}/discontinue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discontinueReason }),
      });

      if (!response.ok) {
        throw new Error("Failed to discontinue medication");
      }

      toast({
        title: "Medication Discontinued",
        description: `${order?.medicationName} has been discontinued`,
      });

      setDiscontinueDialogOpen(false);
      router.push(`/facility/emar/patients/${intakeId}`);
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

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Medication order not found</p>
          <Link href={`/facility/emar/patients/${intakeId}`}>
            <Button className="mt-4">Back to Patient</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/facility/emar/patients/${intakeId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{order.medicationName}</h1>
              {order.isPRN && <Badge variant="outline">PRN</Badge>}
              {order.isControlled && (
                <Badge variant="destructive">Schedule {order.controlSchedule}</Badge>
              )}
              <Badge
                variant={order.status === "ACTIVE" ? "default" : "secondary"}
              >
                {order.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Patient: {order.intake.residentName}
            </p>
          </div>
        </div>
        {order.status === "ACTIVE" && (
          <Button
            variant="destructive"
            onClick={() => setDiscontinueDialogOpen(true)}
          >
            <StopCircle className="h-4 w-4 mr-2" />
            Discontinue
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Medication Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Medication Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Medication Name</Label>
                <p className="font-medium">{order.medicationName}</p>
              </div>
              {order.genericName && (
                <div>
                  <Label className="text-muted-foreground">Generic Name</Label>
                  <p className="font-medium">{order.genericName}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Strength</Label>
                <p className="font-medium">{order.strength}</p>
              </div>
              {order.dosageForm && (
                <div>
                  <Label className="text-muted-foreground">Dosage Form</Label>
                  <p className="font-medium">{order.dosageForm}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Dose</Label>
                <p className="font-medium">{order.dose}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Route</Label>
                <p className="font-medium">{ROUTE_LABELS[order.route]}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Frequency</Label>
                <p className="font-medium">
                  {getFrequencyLabel(order.frequency as any)}
                  {order.customFrequency && ` (${order.customFrequency})`}
                </p>
              </div>
              {order.scheduleTimes.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Schedule Times</Label>
                  <p className="font-medium">{order.scheduleTimes.join(", ")}</p>
                </div>
              )}
            </div>

            {order.isPRN && (
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-purple-800">
                  PRN Information
                </p>
                {order.prnReason && (
                  <p className="text-sm text-purple-600">
                    Reason: {order.prnReason}
                  </p>
                )}
                {order.prnMinIntervalHours && (
                  <p className="text-sm text-purple-600">
                    Min Interval: {order.prnMinIntervalHours} hours
                  </p>
                )}
                {order.prnMaxDailyDoses && (
                  <p className="text-sm text-purple-600">
                    Max Daily Doses: {order.prnMaxDailyDoses}
                  </p>
                )}
              </div>
            )}

            {order.instructions && (
              <div>
                <Label className="text-muted-foreground">Instructions</Label>
                <p className="font-medium">{order.instructions}</p>
              </div>
            )}

            {order.administrationNotes && (
              <div>
                <Label className="text-muted-foreground">
                  Administration Notes
                </Label>
                <p className="font-medium">{order.administrationNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prescriber & Pharmacy */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Prescriber Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label className="text-muted-foreground">Prescriber Name</Label>
                <p className="font-medium">{order.prescriberName}</p>
              </div>
              {order.prescriberNPI && (
                <div>
                  <Label className="text-muted-foreground">NPI</Label>
                  <p className="font-medium">{order.prescriberNPI}</p>
                </div>
              )}
              {order.prescriberPhone && (
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{order.prescriberPhone}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label className="text-muted-foreground">Start Date</Label>
                <p className="font-medium">
                  {format(new Date(order.startDate), "MM/dd/yyyy")}
                </p>
              </div>
              {order.endDate && (
                <div>
                  <Label className="text-muted-foreground">End Date</Label>
                  <p className="font-medium">
                    {format(new Date(order.endDate), "MM/dd/yyyy")}
                  </p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Ordered By</Label>
                <p className="font-medium">{order.orderedBy}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Ordered At</Label>
                <p className="font-medium">
                  {format(new Date(order.orderedAt), "MM/dd/yyyy h:mm a")}
                </p>
              </div>
              {order.discontinuedAt && (
                <div className="p-3 bg-red-50 rounded-lg mt-4">
                  <p className="text-sm font-medium text-red-800">
                    Discontinued
                  </p>
                  <p className="text-sm text-red-600">
                    By: {order.discontinuedBy}
                  </p>
                  <p className="text-sm text-red-600">
                    At: {format(new Date(order.discontinuedAt), "MM/dd/yyyy h:mm a")}
                  </p>
                  <p className="text-sm text-red-600">
                    Reason: {order.discontinueReason}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {(order.pharmacyName || order.rxNumber) && (
            <Card>
              <CardHeader>
                <CardTitle>Pharmacy Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {order.pharmacyName && (
                  <div>
                    <Label className="text-muted-foreground">Pharmacy</Label>
                    <p className="font-medium">{order.pharmacyName}</p>
                  </div>
                )}
                {order.pharmacyPhone && (
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{order.pharmacyPhone}</p>
                  </div>
                )}
                {order.rxNumber && (
                  <div>
                    <Label className="text-muted-foreground">Rx Number</Label>
                    <p className="font-medium">{order.rxNumber}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Administration History */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Administration History ({order._count.administrations})</CardTitle>
        </CardHeader>
        <CardContent>
          <MedicationHistoryTable
            administrations={administrations}
            showPatientColumn={false}
            onRefresh={fetchAdministrations}
          />
        </CardContent>
      </Card>

      {/* Discontinue Dialog */}
      <AlertDialog
        open={discontinueDialogOpen}
        onOpenChange={setDiscontinueDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discontinue Medication</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to discontinue {order.medicationName}? This
              action cannot be undone.
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
    </div>
  );
}
