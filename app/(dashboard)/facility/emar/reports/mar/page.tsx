"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS, STATUS_LABELS, ROUTE_LABELS } from "@/lib/emar";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { RefreshCw, FileText, Download, Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Patient {
  id: string;
  residentName: string;
}

interface MARData {
  patient: {
    id: string;
    residentName: string;
    dateOfBirth: string;
    allergies: string | null;
  };
  facility: {
    id: string;
    name: string;
  };
  reportPeriod: {
    startDate: string;
    endDate: string;
    days: {
      date: string;
      dayOfMonth: string;
      dayOfWeek: string;
    }[];
  };
  medications: {
    order: {
      id: string;
      medicationName: string;
      genericName: string | null;
      strength: string;
      dose: string;
      route: string;
      frequency: string;
      scheduleTimes: string[];
      isPRN: boolean;
      isControlled: boolean;
      prnReason: string | null;
      instructions: string | null;
      prescriberName: string;
      prescriberNPI: string | null;
      prescriberPhone: string | null;
      pharmacyName: string | null;
      pharmacyPhone: string | null;
      rxNumber: string | null;
    };
    dailyData: {
      date: string;
      dayOfMonth: string;
      schedules: {
        id: string;
        time: string;
        status: string;
        administration: {
          id: string;
          time: string;
          status: string;
          administeredBy: string;
        } | null;
      }[];
      prnAdministrations: {
        id: string;
        time: string;
        status: string;
        administeredBy: string;
        prnReason: string | null;
      }[];
    }[];
  }[];
}

export default function MARReportPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [marData, setMarData] = useState<MARData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch("/api/intakes?status=APPROVED");
        if (response.ok) {
          const data = await response.json();
          // Filter out discharged patients
          const activePatients = (data.intakes || []).filter(
            (intake: any) => !intake.dischargedAt
          );
          setPatients(activePatients);
        }
      } catch (error) {
        console.error("Failed to fetch patients:", error);
      } finally {
        setLoadingPatients(false);
      }
    };

    fetchPatients();
  }, []);

  const generateReport = async () => {
    if (!selectedPatient) return;

    setLoading(true);
    try {
      const [year, month] = selectedMonth.split("-");
      const startDate = startOfMonth(new Date(parseInt(year), parseInt(month) - 1));
      const endDate = endOfMonth(startDate);

      const params = new URLSearchParams();
      params.set("intakeId", selectedPatient);
      params.set("startDate", format(startDate, "yyyy-MM-dd"));
      params.set("endDate", format(endDate, "yyyy-MM-dd"));

      const response = await fetch(`/api/emar/reports/mar?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setMarData(data);
      }
    } catch (error) {
      console.error("Failed to generate MAR:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    if (!marData) return [];
    return marData.reportPeriod.days;
  };

  const getStatusAbbrev = (status: string) => {
    switch (status) {
      case "GIVEN": return "G";
      case "REFUSED": return "R";
      case "HELD": return "H";
      case "MISSED": return "M";
      case "NOT_AVAILABLE": return "NA";
      case "LOA": return "LOA";
      default: return "-";
    }
  };

  const getStatusColor = (status: string) => {
    const colors = STATUS_COLORS[status];
    if (!colors) return "";
    return cn(colors.bg, colors.text);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!marData) return;

    setDownloading(true);
    try {
      const [year, month] = selectedMonth.split("-");
      const startDate = startOfMonth(new Date(parseInt(year), parseInt(month) - 1));
      const endDate = endOfMonth(startDate);

      const response = await fetch("/api/emar/reports/mar/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intakeId: selectedPatient,
          startDate: format(startDate, "yyyy-MM-dd"),
          endDate: format(endDate, "yyyy-MM-dd"),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `eMAR-${marData.patient.residentName.replace(/\s+/g, "-")}-${selectedMonth}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download PDF:", error);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/facility/emar/reports">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Medication Administration Record
            </h1>
            <p className="text-muted-foreground">
              Generate monthly MAR reports
            </p>
          </div>
        </div>
        {marData && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        )}
      </div>

      {/* Report Parameters */}
      <Card className="mb-6 print:hidden">
        <CardHeader>
          <CardTitle>Report Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Patient</Label>
              <Select
                value={selectedPatient}
                onValueChange={setSelectedPatient}
                disabled={loadingPatients}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.residentName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Month</Label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={generateReport}
                disabled={!selectedPatient || loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Report"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MAR Report */}
      {marData && (
        <Card>
          <CardHeader className="print:pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">
                  {marData.patient.residentName}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  DOB: {format(new Date(marData.patient.dateOfBirth), "MM/dd/yyyy")}
                  {marData.patient.allergies && (
                    <span className="ml-4 text-orange-600">
                      Allergies: {marData.patient.allergies}
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {format(new Date(marData.reportPeriod.startDate + "T12:00:00"), "MMMM yyyy")}
                </p>
                {marData.facility && (
                  <p className="text-sm text-muted-foreground">
                    {marData.facility.name}
                  </p>
                )}
              </div>
            </div>

            {/* Pharmacy & Prescriber Information */}
            {marData.medications.length > 0 && (() => {
              // Collect unique prescribers and pharmacies from all medications
              const prescribers = new Map<string, { name: string; npi?: string; phone?: string }>();
              const pharmacies = new Map<string, { name: string; phone?: string }>();

              marData.medications.forEach((med) => {
                if (med.order.prescriberName) {
                  prescribers.set(med.order.prescriberName, {
                    name: med.order.prescriberName,
                    npi: med.order.prescriberNPI || undefined,
                    phone: med.order.prescriberPhone || undefined,
                  });
                }
                if (med.order.pharmacyName) {
                  pharmacies.set(med.order.pharmacyName, {
                    name: med.order.pharmacyName,
                    phone: med.order.pharmacyPhone || undefined,
                  });
                }
              });

              const prescriberList = Array.from(prescribers.values());
              const pharmacyList = Array.from(pharmacies.values());

              if (prescriberList.length === 0 && pharmacyList.length === 0) {
                return null;
              }

              return (
                <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {/* Prescriber(s) */}
                  {prescriberList.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-muted-foreground mb-2">
                        Prescriber{prescriberList.length > 1 ? "s" : ""}
                      </h4>
                      <div className="space-y-2">
                        {prescriberList.map((prescriber, idx) => (
                          <div key={idx}>
                            <p className="font-medium">{prescriber.name}</p>
                            {prescriber.npi && (
                              <p className="text-muted-foreground">NPI: {prescriber.npi}</p>
                            )}
                            {prescriber.phone && (
                              <p className="text-muted-foreground">Phone: {prescriber.phone}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pharmacy(ies) */}
                  {pharmacyList.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-muted-foreground mb-2">
                        Pharmacy{pharmacyList.length > 1 ? "ies" : ""}
                      </h4>
                      <div className="space-y-2">
                        {pharmacyList.map((pharmacy, idx) => (
                          <div key={idx}>
                            <p className="font-medium">{pharmacy.name}</p>
                            {pharmacy.phone && (
                              <p className="text-muted-foreground">Phone: {pharmacy.phone}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {marData.medications.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No medications found for this period
              </p>
            ) : (
              <>
                {/* Legend */}
                <div className="flex flex-wrap gap-4 mb-4 text-sm print:text-xs">
                  <span className="flex items-center gap-1">
                    <Badge className={getStatusColor("GIVEN")}>G</Badge> Given
                  </span>
                  <span className="flex items-center gap-1">
                    <Badge className={getStatusColor("REFUSED")}>R</Badge> Refused
                  </span>
                  <span className="flex items-center gap-1">
                    <Badge className={getStatusColor("HELD")}>H</Badge> Held
                  </span>
                  <span className="flex items-center gap-1">
                    <Badge className={getStatusColor("MISSED")}>M</Badge> Missed
                  </span>
                  <span className="flex items-center gap-1">
                    <Badge variant="secondary">NA</Badge> Not Available
                  </span>
                  <span className="flex items-center gap-1">
                    <Badge variant="outline">LOA</Badge> Leave of Absence
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-yellow-500">○</span> Scheduled (not given)
                  </span>
                  <span className="text-muted-foreground">
                    * Initials below status indicate who administered
                  </span>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-white z-10 min-w-[200px]">
                        Medication
                      </TableHead>
                      <TableHead className="text-center min-w-[60px]">Time</TableHead>
                      {getDaysInMonth().map((day) => (
                        <TableHead
                          key={day.date}
                          className="text-center min-w-[30px] px-1 print:text-xs"
                        >
                          {day.dayOfMonth}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marData.medications.map((med) => {
                      const order = med.order;

                      // Derive schedule times from actual schedule data if order.scheduleTimes is empty
                      let scheduleTimes: string[] = order.scheduleTimes;
                      if (scheduleTimes.length === 0 && !order.isPRN) {
                        // Extract unique times from the daily schedule data
                        const timesSet = new Set<string>();
                        med.dailyData.forEach(day => {
                          day.schedules.forEach(s => timesSet.add(s.time));
                        });
                        scheduleTimes = Array.from(timesSet).sort();
                      }
                      if (scheduleTimes.length === 0) {
                        scheduleTimes = order.isPRN ? ["PRN"] : ["--"];
                      }

                      return scheduleTimes.map((time, timeIdx) => (
                        <TableRow key={`${order.id}-${time}`}>
                          {timeIdx === 0 && (
                            <TableCell
                              rowSpan={scheduleTimes.length}
                              className="sticky left-0 bg-white z-10 align-top"
                            >
                              <div className="font-medium flex items-center gap-2">
                                {order.medicationName}
                                {order.isPRN && (
                                  <Badge variant="outline" className="text-xs">PRN</Badge>
                                )}
                                {order.isControlled && (
                                  <Badge variant="destructive" className="text-xs px-1">C</Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {order.strength} - {order.dose}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {ROUTE_LABELS[order.route]}
                              </div>
                            </TableCell>
                          )}
                          <TableCell className="text-center font-medium">
                            {time}
                          </TableCell>
                          {getDaysInMonth().map((day) => {
                            const dayData = med.dailyData.find(d => d.date === day.date);

                            // Helper to get initials from name
                            const getInitials = (name: string | undefined | null) => {
                              if (!name) return "";
                              return name
                                .split(" ")
                                .map(n => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 3);
                            };

                            // For PRN meds, show PRN administrations
                            if (order.isPRN) {
                              const prnAdmin = dayData?.prnAdministrations[0];
                              return (
                                <TableCell key={day.date} className="text-center px-1">
                                  {prnAdmin ? (
                                    <div className="flex flex-col items-center">
                                      <Badge
                                        className={cn(
                                          getStatusColor(prnAdmin.status),
                                          "text-xs px-1 font-medium"
                                        )}
                                        title={prnAdmin.administeredBy || undefined}
                                      >
                                        {getStatusAbbrev(prnAdmin.status)}
                                      </Badge>
                                      <span className="text-[10px] text-muted-foreground mt-0.5">
                                        {getInitials(prnAdmin.administeredBy)}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-300">-</span>
                                  )}
                                </TableCell>
                              );
                            }

                            // For scheduled meds, find the matching schedule
                            const schedule = dayData?.schedules.find(s => {
                              const schedHour = parseInt(s.time.split(":")[0]);
                              const timeHour = parseInt(time.split(":")[0]);
                              return Math.abs(schedHour - timeHour) <= 1;
                            });

                            const admin = schedule?.administration;

                            return (
                              <TableCell
                                key={day.date}
                                className="text-center px-1"
                              >
                                {admin ? (
                                  <div className="flex flex-col items-center">
                                    <Badge
                                      className={cn(
                                        getStatusColor(admin.status),
                                        "text-xs px-1 font-medium"
                                      )}
                                      title={admin.administeredBy || undefined}
                                    >
                                      {getStatusAbbrev(admin.status)}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground mt-0.5">
                                      {getInitials(admin.administeredBy)}
                                    </span>
                                  </div>
                                ) : schedule ? (
                                  <span className="text-yellow-500 text-xs">○</span>
                                ) : (
                                  <span className="text-gray-300">-</span>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ));
                    })}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
