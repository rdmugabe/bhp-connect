"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, CheckCircle2, AlertTriangle, Clock, CalendarClock, CalendarPlus } from "lucide-react";
import type { ReEvaluationStatus } from "@/lib/evaluation-cycles";
import { UploadEvaluationDialog } from "./upload-evaluation-dialog";
import { SetDueDateDialog } from "./set-due-date-dialog";

export interface TileResident {
  intakeId: string;
  residentName: string;
  state: {
    status: ReEvaluationStatus;
    dueDate: string | Date | null;
    daysUntilDue: number | null;
    daysOverdue: number;
    isInActionWindow: boolean;
    isOverdue: boolean;
  };
  latestEvaluation: {
    id: string;
    completedDate: string | Date;
    fileName: string;
  } | null;
}

interface Props {
  resident: TileResident;
  onChanged?: () => void;
  readOnly?: boolean;
}

const STATUS_THEME: Record<
  ReEvaluationStatus,
  {
    ring: string;
    bg: string;
    border: string;
    badge: string;
    icon: React.ComponentType<{ className?: string }>;
    glow: string;
  }
> = {
  NOT_YET: {
    ring: "stroke-emerald-500",
    bg: "bg-white",
    border: "border-emerald-200",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
    icon: Clock,
    glow: "",
  },
  DUE_SOON: {
    ring: "stroke-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-400",
    badge: "bg-amber-200 text-amber-900 border-amber-400 font-bold",
    icon: AlertTriangle,
    glow: "shadow-[0_0_0_4px_rgba(251,191,36,0.25)]",
  },
  OVERDUE: {
    ring: "stroke-red-600",
    bg: "bg-red-50",
    border: "border-red-500",
    badge: "bg-red-600 text-white border-red-700 font-bold",
    icon: AlertTriangle,
    glow: "shadow-[0_0_0_4px_rgba(220,38,38,0.35)] animate-pulse",
  },
  UNSCHEDULED: {
    ring: "stroke-slate-400",
    bg: "bg-slate-50",
    border: "border-slate-300",
    badge: "bg-slate-200 text-slate-700 border-slate-300",
    icon: CalendarPlus,
    glow: "",
  },
};

const STATUS_LABEL: Record<ReEvaluationStatus, string> = {
  NOT_YET: "On track",
  DUE_SOON: "Due soon",
  OVERDUE: "OVERDUE",
  UNSCHEDULED: "No date set",
};

function formatDate(d: string | Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function EvaluationCountdownTile({ resident, onChanged, readOnly }: Props) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [setDateOpen, setSetDateOpen] = useState(false);
  const { state, residentName } = resident;
  const theme = STATUS_THEME[state.status];
  const Icon = theme.icon;

  // Ring fill: 0 → "no progress yet", 1 → "due today / overdue".
  // Use a 30-day reference period for the visual sweep (most cycles are 30 days).
  let progress = 0;
  if (state.dueDate && state.daysUntilDue !== null) {
    if (state.isOverdue) progress = 1;
    else progress = Math.max(0, Math.min(1, (30 - state.daysUntilDue) / 30));
  }
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  let bigNumber: string;
  let bigNumberLabel: string;
  if (state.status === "UNSCHEDULED") {
    bigNumber = "—";
    bigNumberLabel = "no date set";
  } else if (state.status === "OVERDUE") {
    bigNumber = `-${state.daysOverdue}`;
    bigNumberLabel = state.daysOverdue === 1 ? "day overdue" : "days overdue";
  } else {
    const n = state.daysUntilDue ?? 0;
    bigNumber = String(n);
    bigNumberLabel = n === 1 ? "day until due" : "days until due";
  }

  const initials = residentName
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <>
      <Card
        className={`${theme.bg} ${theme.border} border-2 ${theme.glow} transition-shadow`}
      >
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">{residentName}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {state.dueDate
                    ? `Due ${formatDate(state.dueDate)}`
                    : "Re-evaluation"}
                </div>
              </div>
            </div>
            <Badge
              className={`${theme.badge} text-[10px] uppercase tracking-wide shrink-0`}
            >
              {STATUS_LABEL[state.status]}
            </Badge>
          </div>

          <div className="relative flex items-center justify-center">
            <svg width="120" height="120" viewBox="0 0 100 100" className="rotate-[-90deg]">
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-200"
              />
              {state.status !== "UNSCHEDULED" && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className={theme.ring}
                  style={{ transition: "stroke-dashoffset 600ms ease-out" }}
                />
              )}
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <Icon className={`h-4 w-4 mb-0.5 ${theme.ring.replace("stroke-", "text-")}`} />
              <div
                className={`text-2xl font-extrabold leading-none ${
                  state.status === "OVERDUE"
                    ? "text-red-700"
                    : state.status === "DUE_SOON"
                      ? "text-amber-700"
                      : state.status === "UNSCHEDULED"
                        ? "text-slate-500"
                        : "text-slate-900"
                }`}
              >
                {bigNumber}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5 text-center">
                {bigNumberLabel}
              </div>
            </div>
          </div>

          {resident.latestEvaluation && (
            <div className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              Last upload {formatDate(resident.latestEvaluation.completedDate)}
            </div>
          )}

          {!readOnly && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => setSetDateOpen(true)}
              >
                <CalendarClock className="h-3.5 w-3.5 mr-1" />
                {state.dueDate ? "Edit date" : "Set date"}
              </Button>
              <Button
                size="sm"
                variant={
                  state.status === "OVERDUE" || state.status === "DUE_SOON"
                    ? "default"
                    : "outline"
                }
                className="flex-1"
                onClick={() => setUploadOpen(true)}
              >
                <Upload className="h-3.5 w-3.5 mr-1" />
                Upload
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <UploadEvaluationDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        intakeId={resident.intakeId}
        residentName={resident.residentName}
        currentDueDate={state.dueDate}
        onUploaded={() => {
          setUploadOpen(false);
          onChanged?.();
        }}
      />

      <SetDueDateDialog
        open={setDateOpen}
        onOpenChange={setSetDateOpen}
        intakeId={resident.intakeId}
        residentName={resident.residentName}
        currentDueDate={state.dueDate}
        onSaved={() => {
          setSetDateOpen(false);
          onChanged?.();
        }}
      />
    </>
  );
}

export function EvaluationCountdownTileSkeleton() {
  return (
    <Card className="border-2 border-slate-200 animate-pulse">
      <CardContent className="p-4 space-y-3">
        <div className="h-5 w-3/4 bg-slate-200 rounded" />
        <div className="flex justify-center">
          <div className="h-[120px] w-[120px] rounded-full bg-slate-100" />
        </div>
        <div className="h-8 bg-slate-100 rounded" />
      </CardContent>
    </Card>
  );
}
