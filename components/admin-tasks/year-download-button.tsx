"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Props {
  endpoint: "fire-drill-reports" | "evacuation-drill-reports";
  label: string;
  currentYear: number;
}

/**
 * "Download all reports for year Y" dropdown button, rendered inside the
 * admin-tasks tiles. Click stops propagation so it doesn't trip the parent
 * Link navigation.
 */
export function YearDownloadButton({ endpoint, label, currentYear }: Props) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  // Offer the current year and the two prior.
  const years = [currentYear, currentYear - 1, currentYear - 2];

  async function download(year: number, e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    setBusy(true);
    try {
      const res = await fetch(`/api/${endpoint}/zip?year=${year}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast({
          title: err.error || "No reports available for that year",
          variant: "destructive",
        });
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${label.replace(/\s+/g, "")}_${year}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5 mr-1" />
          )}
          Download year
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {years.map((y) => (
          <DropdownMenuItem
            key={y}
            onSelect={(e) => {
              e.preventDefault();
              download(y);
            }}
          >
            {y}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
