"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROUTE_LABELS, getFrequencyLabel, STATUS_COLORS, STATUS_LABELS } from "@/lib/emar";
import { MedicationHistoryTable, MedicationScheduleTable } from "@/components/emar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  RefreshCw,
  Pill,
  Calendar,
  History,
  AlertTriangle,
  User,
} from "lucide-react";

interface Patient {
  id: string;
  residentName: string;
  dateOfBirth: string;
  allergies: string | null;
  facility: {
    id: string;
    name: string;
  };
}

interface MedicationOrder {
  id: string;
  medicationName: string;
  genericName: string | null;
  strength: string;
  dose: string;
  route: string;
  frequency: string;
  isPRN: boolean;
  isControlled: boolean;
  status: string;
  startDate: string;
  endDate: string | null;
  prescriberName: string;
}

interface Schedule {
  id: string;
  scheduledTime: string;
  scheduledDateTime: string;
  status: string;
  windowStartTime: string;
  windowEndTime: string;
  medicationOrder: {
    id: string;
    medicationName: string;
    strength: string;
    dose: string;
    route: string;
    isPRN: boolean;
    isControlled: boolean;
    instructions?: string;
    intake: {
      id: string;
      residentName: string;
      dateOfBirth: string;
      allergies?: string;
    };
  };
  administration?: {
    id: string;
    administeredAt: string;
    administeredBy: string;
    status: string;
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

export default function BhpPatientEmarPage({
  params,
}: {
  params: Promise<{ intakeId: string }>;
}) {
  const { intakeId } = use(params);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [orders, setOrders] = useState<MedicationOrder[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [administrations, setAdministrations] = useState<Administration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("medications");
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );

  const fetchPatient = async () => {
    try {
      const response = await fetch(`/api/intakes/${intakeId}`);
      if (response.ok) {
        const data = await response.json();
        setPatient(data.intake);
      }
    } catch (error) {
      console.error("Failed to fetch patient:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch(`/api/emar/orders?intakeId=${intakeId}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  };

  const fetchSchedules = async () => {
    try {
      const response = await fetch(
        `/api/emar/schedules?intakeId=${intakeId}&date=${selectedDate}`
      );
      if (response.ok) {
        const data = await response.json();
        setSchedules(data.schedules || []);
      }
    } catch (error) {
      console.error("Failed to fetch schedules:", error);
    }
  };

  const fetchAdministrations = async () => {
    try {
      const response = await fetch(
        `/api/emar/administrations?intakeId=${intakeId}&startDate=${selectedDate}&endDate=${selectedDate}`
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
    await Promise.all([
      fetchPatient(),
      fetchOrders(),
      fetchSchedules(),
      fetchAdministrations(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [intakeId, selectedDate]);

  const activeOrders = orders.filter((o) => o.status === "ACTIVE");
  const inactiveOrders = orders.filter((o) => o.status !== "ACTIVE");

  if (loading && !patient) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/bhp/emar">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{patient?.residentName}</h1>
            <p className="text-muted-foreground">
              {patient?.facility.name} • DOB:{" "}
              {patient && format(new Date(patient.dateOfBirth), "MM/dd/yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-blue-600 border-blue-300">
            Read-Only View
          </Badge>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Allergy Warning */}
      {patient?.allergies && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span className="font-medium text-orange-800">
                Allergies: {patient.allergies}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="medications" className="flex items-center gap-2">
              <Pill className="h-4 w-4" />
              Medications ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          {(activeTab === "schedule" || activeTab === "history") && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            />
          )}
        </div>

        <TabsContent value="medications">
          {/* Active Medications */}
          <Card className="mb-6">
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
                                <Badge variant="outline" className="text-xs">
                                  PRN
                                </Badge>
                              )}
                              {order.isControlled && (
                                <Badge variant="destructive" className="text-xs">
                                  C
                                </Badge>
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
                          {getFrequencyLabel(order.frequency as any)}
                        </TableCell>
                        <TableCell>{ROUTE_LABELS[order.route]}</TableCell>
                        <TableCell>{order.prescriberName}</TableCell>
                        <TableCell>
                          {format(new Date(order.startDate), "MM/dd/yyyy")}
                        </TableCell>
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
                          {format(new Date(order.startDate), "MM/dd/yyyy")} -{" "}
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
        </TabsContent>

        <TabsContent value="schedule">
          <MedicationScheduleTable
            schedules={schedules}
            onRefresh={fetchSchedules}
            showPatientColumn={false}
            readOnly={true}
          />
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>
                Administration History -{" "}
                {format(new Date(selectedDate), "MMMM d, yyyy")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MedicationHistoryTable
                administrations={administrations}
                showPatientColumn={false}
                readOnly={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
