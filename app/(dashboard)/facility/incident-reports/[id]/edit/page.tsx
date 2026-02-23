"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { IncidentReportForm } from "@/components/incident-reports/incident-report-form";
import { useToast } from "@/components/ui/use-toast";
import { IncidentReportDraftInput } from "@/lib/validations";

type FormData = IncidentReportDraftInput & {
  id: string;
  status: string;
};

export default function EditIncidentReportPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const [report, setReport] = useState<FormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      try {
        const response = await fetch(`/api/incident-reports/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch report");
        }
        const data = await response.json();

        // Transform data for the form - convert nulls to undefined
        const formData: FormData = {
          ...data,
          intakeId: data.intakeId || undefined,
          incidentDate: data.incidentDate ? new Date(data.incidentDate).toISOString().split("T")[0] : "",
          residentDOB: data.residentDOB ? new Date(data.residentDOB).toISOString().split("T")[0] : undefined,
          residentAdmissionDate: data.residentAdmissionDate ? new Date(data.residentAdmissionDate).toISOString().split("T")[0] : undefined,
          staffSignatureDate: data.staffSignatureDate ? new Date(data.staffSignatureDate).toISOString().split("T")[0] : undefined,
          adminSignatureDate: data.adminSignatureDate ? new Date(data.adminSignatureDate).toISOString().split("T")[0] : undefined,
          bhpSignatureDate: data.bhpSignatureDate ? new Date(data.bhpSignatureDate).toISOString().split("T")[0] : undefined,
        };

        setReport(formData);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load incident report",
          variant: "destructive",
        });
        router.push("/facility/incident-reports");
      } finally {
        setIsLoading(false);
      }
    }
    fetchReport();
  }, [id, router, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Incident Report</h1>
        <p className="text-muted-foreground">
          Update the incident report details
        </p>
      </div>

      <IncidentReportForm reportId={id} initialData={report} />
    </div>
  );
}
