"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IntakeFormWizard } from "@/components/intakes/intake-form-wizard";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export default function NewIntakePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/facility/intakes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Intake Assessment</h1>
          <p className="text-muted-foreground">
            Complete the full intake assessment for BHP review
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-blue-800">Save Your Progress</p>
          <p className="text-sm text-blue-700">
            You can save your progress as a draft at any time and continue later.
            Once submitted for BHP review, the intake cannot be modified.
          </p>
        </div>
      </div>

      <IntakeFormWizard />
    </div>
  );
}
