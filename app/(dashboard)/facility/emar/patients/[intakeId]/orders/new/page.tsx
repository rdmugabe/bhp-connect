"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MedicationOrderForm } from "@/components/emar";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface PatientInfo {
  id: string;
  residentName: string;
  dateOfBirth: string;
  allergies: string | null;
  facilityId: string;
}

export default function NewMedicationOrderPage({
  params,
}: {
  params: { intakeId: string };
}) {
  const { intakeId } = params;
  const router = useRouter();
  const { toast } = useToast();
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await fetch(`/api/intakes/${intakeId}`);
        if (response.ok) {
          const data = await response.json();
          setPatient(data.intake);
        }
      } catch (error) {
        console.error("Failed to fetch patient:", error);
        toast({
          title: "Error",
          description: "Failed to load patient information",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [intakeId]);

  const handleSuccess = () => {
    toast({
      title: "Medication Order Created",
      description: "The medication order has been created successfully",
    });
    router.push(`/facility/emar/patients/${intakeId}`);
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

  if (!patient) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Patient not found</p>
          <Link href="/facility/emar/patients">
            <Button className="mt-4">Back to Patients</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/facility/emar/patients/${intakeId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Medication Order</h1>
          <p className="text-muted-foreground">
            Patient: {patient.residentName}
          </p>
        </div>
      </div>

      {/* Form */}
      <MedicationOrderForm
        intakeId={intakeId}
        patientName={patient.residentName}
        patientAllergies={patient.allergies || undefined}
        onSuccess={handleSuccess}
        onCancel={() => router.push(`/facility/emar/patients/${intakeId}`)}
      />
    </div>
  );
}
