import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { History, ArrowRight, Eye, CheckCircle, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AdmissionRecord {
  id: string;
  admissionDate: Date | null;
  dischargedAt: Date | null;
  status: string;
  createdAt: Date;
}

interface AdmissionHistoryProps {
  currentIntakeId: string;
  previousIntakes: AdmissionRecord[];
  subsequentIntakes: AdmissionRecord[];
}

export function AdmissionHistory({
  currentIntakeId,
  previousIntakes,
  subsequentIntakes,
}: AdmissionHistoryProps) {
  const allAdmissions = [
    ...previousIntakes.map((intake) => ({ ...intake, type: "previous" as const })),
    ...subsequentIntakes.map((intake) => ({ ...intake, type: "subsequent" as const })),
  ].sort((a, b) => {
    const dateA = a.admissionDate || a.createdAt;
    const dateB = b.admissionDate || b.createdAt;
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });

  if (allAdmissions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Admission History
        </CardTitle>
        <CardDescription>
          Previous and subsequent admissions for this patient
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-4">
            {allAdmissions.map((admission, index) => {
              const isCurrent = admission.id === currentIntakeId;
              const admissionDate = admission.admissionDate || admission.createdAt;

              return (
                <div key={admission.id} className="relative pl-10">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-2.5 w-3 h-3 rounded-full border-2 ${
                      isCurrent
                        ? "bg-primary border-primary"
                        : admission.dischargedAt
                        ? "bg-muted border-muted-foreground"
                        : "bg-green-500 border-green-500"
                    }`}
                  />

                  <div
                    className={`p-3 rounded-lg border ${
                      isCurrent ? "bg-muted/50 border-primary" : "bg-background"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          Admission {index + 1}
                        </span>
                        {isCurrent && (
                          <Badge variant="default" className="text-xs">
                            Current
                          </Badge>
                        )}
                        {admission.dischargedAt ? (
                          <Badge variant="secondary" className="text-xs flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            Discharged
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs flex items-center gap-1 text-green-600 border-green-600">
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </Badge>
                        )}
                      </div>
                      {!isCurrent && (
                        <Link href={`/facility/residents/${admission.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      )}
                    </div>

                    <div className="mt-2 text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <span>Admitted:</span>
                        <span className="font-medium text-foreground">
                          {formatDate(admissionDate)}
                        </span>
                      </div>
                      {admission.dischargedAt && (
                        <div className="flex items-center gap-2">
                          <span>Discharged:</span>
                          <span className="font-medium text-foreground">
                            {formatDate(admission.dischargedAt)}
                          </span>
                        </div>
                      )}
                    </div>

                    {index < allAdmissions.length - 1 && (
                      <div className="absolute -bottom-2 left-3.5">
                        <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
