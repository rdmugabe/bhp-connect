"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PatientMedicationList, MedicationScheduleTable, MedicationHistoryTable } from "@/components/emar";
import { ArrowLeft, RefreshCw, Calendar, History, Pill } from "lucide-react";
import { format } from "date-fns";

interface PatientInfo {
  id: string;
  residentName: string;
  dateOfBirth: string;
  allergies: string | null;
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

export default function PatientEmarPage({
  params,
}: {
  params: { intakeId: string };
}) {
  const { intakeId } = params;
  const [patient, setPatient] = useState<PatientInfo | null>(null);
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
    await Promise.all([fetchPatient(), fetchSchedules(), fetchAdministrations()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [intakeId, selectedDate]);

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
          <Link href="/facility/emar/patients">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{patient?.residentName}</h1>
            <p className="text-muted-foreground">
              DOB: {patient && format(new Date(patient.dateOfBirth), "MM/dd/yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          />
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="medications" className="flex items-center gap-2">
            <Pill className="h-4 w-4" />
            Medications
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Today's Schedule
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Administration History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="medications">
          {patient && (
            <PatientMedicationList
              intakeId={intakeId}
              patientName={patient.residentName}
              allergies={patient.allergies || undefined}
            />
          )}
        </TabsContent>

        <TabsContent value="schedule">
          <MedicationScheduleTable
            schedules={schedules}
            onRefresh={fetchSchedules}
            showPatientColumn={false}
          />
        </TabsContent>

        <TabsContent value="history">
          <MedicationHistoryTable
            administrations={administrations}
            showPatientColumn={false}
            onRefresh={fetchAdministrations}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
