"use client";

import { IncidentReportForm } from "@/components/incident-reports/incident-report-form";

export default function NewIncidentReportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Incident Report</h1>
        <p className="text-muted-foreground">
          Document a new incident at your facility
        </p>
      </div>

      <IncidentReportForm />
    </div>
  );
}
