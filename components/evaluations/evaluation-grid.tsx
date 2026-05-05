"use client";

import { useCallback, useEffect, useState } from "react";
import {
  EvaluationCountdownTile,
  EvaluationCountdownTileSkeleton,
  type TileResident,
} from "./evaluation-countdown-tile";
import { AlertTriangle, CheckCircle2, Clock, Flame, CalendarPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatusResponse {
  residents: TileResident[];
  counts: {
    total: number;
    overdue: number;
    dueSoon: number;
    notYet: number;
    unscheduled: number;
  };
}

interface Props {
  readOnly?: boolean;
}

export function EvaluationGrid({ readOnly }: Props) {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/residents/evaluations/status");
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const json = (await res.json()) as StatusResponse;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <EvaluationCountdownTileSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-300">
        <CardContent className="p-4 text-sm text-red-700">
          Could not load re-evaluation status: {error}
        </CardContent>
      </Card>
    );
  }

  if (!data || data.residents.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          No active residents yet. Admit a resident to start tracking re-evaluations.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <StatusSummary counts={data.counts} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.residents.map((r) => (
          <EvaluationCountdownTile
            key={r.intakeId}
            resident={r}
            onChanged={load}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  );
}

function StatusSummary({ counts }: { counts: StatusResponse["counts"] }) {
  const chips = [
    {
      label: "Overdue",
      value: counts.overdue,
      icon: Flame,
      color: "text-red-700 bg-red-100 border-red-300",
      urgent: counts.overdue > 0,
    },
    {
      label: "Due soon",
      value: counts.dueSoon,
      icon: AlertTriangle,
      color: "text-amber-800 bg-amber-100 border-amber-300",
      urgent: counts.dueSoon > 0,
    },
    {
      label: "On track",
      value: counts.notYet,
      icon: Clock,
      color: "text-slate-700 bg-slate-100 border-slate-300",
      urgent: false,
    },
    {
      label: "No date set",
      value: counts.unscheduled,
      icon: CalendarPlus,
      color: "text-slate-600 bg-slate-50 border-slate-300",
      urgent: false,
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((c) => (
        <div
          key={c.label}
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${c.color} ${
            c.urgent ? "shadow-sm" : ""
          }`}
        >
          <c.icon className="h-3.5 w-3.5" />
          <span>
            <strong className="text-sm">{c.value}</strong> {c.label}
          </span>
        </div>
      ))}
    </div>
  );
}
