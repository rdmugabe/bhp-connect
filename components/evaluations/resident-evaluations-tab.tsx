"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import {
  Download,
  Upload,
  Loader2,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { UploadEvaluationDialog } from "./upload-evaluation-dialog";
import { SetDueDateDialog } from "./set-due-date-dialog";
import { getReEvaluationState } from "@/lib/evaluation-cycles";

interface EvaluationRow {
  id: string;
  cycleNumber: number;
  cycleStartDate: string;
  cycleEndDate: string;
  completedDate: string;
  fileName: string;
  fileSize: number;
  notes: string | null;
  uploadedBy: string;
  createdAt: string;
}

interface ApiResponse {
  evaluations: EvaluationRow[];
  admissionDate: string | null;
  residentName: string;
  nextReEvaluationDueDate: string | null;
}

interface Props {
  intakeId: string;
  residentName: string;
  readOnly?: boolean;
}

export function ResidentEvaluationsTab({ intakeId, residentName, readOnly }: Props) {
  const { toast } = useToast();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [setDateOpen, setSetDateOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/residents/${intakeId}/evaluations`);
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      setData(await res.json());
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not load re-evaluations",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }, [intakeId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const download = async (evaluationId: string) => {
    try {
      setDownloadingId(evaluationId);
      const res = await fetch(
        `/api/residents/${intakeId}/evaluations/${evaluationId}/download`
      );
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const { url } = await res.json();
      window.open(url, "_blank");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Download failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const state = getReEvaluationState(
    data.nextReEvaluationDueDate ? new Date(data.nextReEvaluationDueDate) : null
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Re-Evaluation Countdown</CardTitle>
              <CardDescription>
                {data.nextReEvaluationDueDate
                  ? `Next re-evaluation due ${fmt(data.nextReEvaluationDueDate)}.`
                  : "No re-evaluation date set yet."}
              </CardDescription>
            </div>
            {!readOnly && (
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => setSetDateOpen(true)}>
                  <CalendarClock className="h-3.5 w-3.5 mr-1" />
                  {data.nextReEvaluationDueDate ? "Edit date" : "Set date"}
                </Button>
                <Button size="sm" onClick={() => setUploadOpen(true)}>
                  <Upload className="h-3.5 w-3.5 mr-1" />
                  Upload re-evaluation
                </Button>
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <CountdownBadge state={state} />
          </div>
        </CardHeader>
        <CardContent>
          {data.evaluations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No re-evaluations have been uploaded yet.
            </p>
          ) : (
            <div className="overflow-x-auto"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Evaluation date</TableHead>
                  <TableHead>Set next due</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.evaluations.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-semibold text-muted-foreground">
                      {e.cycleNumber}
                    </TableCell>
                    <TableCell className="text-xs">{fmt(e.completedDate)}</TableCell>
                    <TableCell className="text-xs">{fmt(e.cycleEndDate)}</TableCell>
                    <TableCell className="text-xs">
                      <span className="truncate max-w-[280px] inline-block align-middle">
                        {e.fileName}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={downloadingId === e.id}
                        onClick={() => download(e.id)}
                      >
                        {downloadingId === e.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Download className="h-3.5 w-3.5 mr-1" />
                            PDF
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>

      <UploadEvaluationDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        intakeId={intakeId}
        residentName={residentName}
        currentDueDate={data.nextReEvaluationDueDate}
        onUploaded={() => {
          setUploadOpen(false);
          load();
        }}
      />

      <SetDueDateDialog
        open={setDateOpen}
        onOpenChange={setSetDateOpen}
        intakeId={intakeId}
        residentName={residentName}
        currentDueDate={data.nextReEvaluationDueDate}
        onSaved={() => {
          setSetDateOpen(false);
          load();
        }}
      />
    </>
  );
}

function CountdownBadge({ state }: { state: ReturnType<typeof getReEvaluationState> }) {
  const cfg = {
    OVERDUE: {
      cls: "bg-red-100 text-red-800 border-red-300",
      icon: AlertTriangle,
      label: `Overdue by ${state.daysOverdue} day${state.daysOverdue === 1 ? "" : "s"}`,
    },
    DUE_SOON: {
      cls: "bg-amber-100 text-amber-800 border-amber-300",
      icon: AlertTriangle,
      label: `Due in ${state.daysUntilDue} day${state.daysUntilDue === 1 ? "" : "s"}`,
    },
    NOT_YET: {
      cls: "bg-emerald-100 text-emerald-800 border-emerald-300",
      icon: CheckCircle2,
      label: `${state.daysUntilDue} days until due`,
    },
    UNSCHEDULED: {
      cls: "bg-slate-100 text-slate-700 border-slate-300",
      icon: Clock,
      label: "No date set",
    },
  } as const;
  const c = cfg[state.status];
  return (
    <Badge variant="outline" className={`${c.cls} gap-1`}>
      <c.icon className="h-3.5 w-3.5" />
      {c.label}
    </Badge>
  );
}

function fmt(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
