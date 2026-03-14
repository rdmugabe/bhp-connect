"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CareCoordinationActivityType } from "@prisma/client";
import { groupEntriesByDate, CareCoordinationEntryWithDetails } from "@/lib/care-coordination";
import { CareCoordinationEntryCard } from "./care-coordination-entry-card";
import {
  CareCoordinationFiltersComponent,
  CareCoordinationFilters,
} from "./care-coordination-filters";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  Calendar,
  Plus,
  Download,
  Sparkles,
  RefreshCw,
  ClipboardList,
} from "lucide-react";

interface CareCoordinationTimelineProps {
  intakeId: string;
  residentName: string;
  isAdmin?: boolean;
}

export function CareCoordinationTimeline({
  intakeId,
  residentName,
  isAdmin = false,
}: CareCoordinationTimelineProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [entries, setEntries] = useState<CareCoordinationEntryWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CareCoordinationFilters>({});
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ intakeId });
      if (filters.activityType) {
        params.append("activityType", filters.activityType);
      }
      if (filters.startDate) {
        params.append("startDate", filters.startDate);
      }
      if (filters.endDate) {
        params.append("endDate", filters.endDate);
      }
      if (filters.followUpNeeded) {
        params.append("followUpNeeded", "true");
      }

      const response = await fetch(`/api/care-coordination?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch entries");
      }

      const data = await response.json();
      setEntries(data.entries || []);
    } catch (error) {
      console.error("Fetch entries error:", error);
      toast({
        title: "Error",
        description: "Failed to load care coordination entries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [intakeId, filters]);

  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    try {
      const response = await fetch(`/api/care-coordination/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intakeId,
          startDate: filters.startDate,
          endDate: filters.endDate,
          activityTypes: filters.activityType ? [filters.activityType] : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate summary");
      }

      const data = await response.json();

      // Open a dialog or navigate to a page showing the summary
      // For now, we'll show a toast with the summary
      toast({
        title: "Summary Generated",
        description: "AI summary has been generated successfully. View in PDF export.",
      });
    } catch (error) {
      console.error("Generate summary error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to generate summary",
        variant: "destructive",
      });
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const params = new URLSearchParams();
      params.append("intakeId", intakeId);
      if (filters.startDate) {
        params.append("startDate", filters.startDate);
      }
      if (filters.endDate) {
        params.append("endDate", filters.endDate);
      }
      if (filters.activityType) {
        params.append("activityTypes", filters.activityType);
      }
      params.append("includeSummary", "true");

      const response = await fetch(
        `/api/care-coordination/pdf?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `care_coordination_${residentName.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      toast({
        title: "PDF Downloaded",
        description: "Care coordination report has been downloaded.",
      });
    } catch (error) {
      console.error("Download PDF error:", error);
      toast({
        title: "Error",
        description: "Failed to download PDF",
        variant: "destructive",
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    const reason = prompt("Enter reason for archiving this entry:");
    if (!reason) return;

    try {
      const response = await fetch(`/api/care-coordination/${entryId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archiveReason: reason }),
      });

      if (!response.ok) {
        throw new Error("Failed to archive entry");
      }

      toast({
        title: "Entry Archived",
        description: "The entry has been archived successfully.",
      });

      fetchEntries();
    } catch (error) {
      console.error("Archive entry error:", error);
      toast({
        title: "Error",
        description: "Failed to archive entry",
        variant: "destructive",
      });
    }
  };

  const groupedEntries = groupEntriesByDate(entries);

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <CareCoordinationFiltersComponent
          filters={filters}
          onChange={setFilters}
        />

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchEntries()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {entries.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateSummary}
                disabled={generatingSummary}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                {generatingSummary ? "Generating..." : "AI Summary"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
              >
                <Download className="h-4 w-4 mr-1" />
                {downloadingPdf ? "Downloading..." : "Export PDF"}
              </Button>
            </>
          )}

          <Button
            onClick={() =>
              router.push(`/facility/residents/${intakeId}/care-coordination/new`)
            }
          >
            <Plus className="h-4 w-4 mr-1" />
            New Entry
          </Button>
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
          <ClipboardList className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Care Coordination Entries
          </h3>
          <p className="text-gray-500 mb-4">
            {Object.keys(filters).length > 0
              ? "No entries match your current filters."
              : "Start tracking care coordination activities for this resident."}
          </p>
          {Object.keys(filters).length > 0 ? (
            <Button variant="outline" onClick={() => setFilters({})}>
              Clear Filters
            </Button>
          ) : (
            <Button
              onClick={() =>
                router.push(`/facility/residents/${intakeId}/care-coordination/new`)
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Entry
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {groupedEntries.map((group) => (
            <div key={group.date} className="relative">
              {/* Date Header */}
              <div className="sticky top-0 z-10 bg-white pb-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                    <Calendar className="h-4 w-4" />
                    {group.dateFormatted}
                  </div>
                  <span className="text-sm text-gray-500">
                    {group.entries.length} {group.entries.length === 1 ? "entry" : "entries"}
                  </span>
                </div>
              </div>

              {/* Entries for this date */}
              <div className="ml-4 pl-4 border-l-2 border-blue-100 space-y-4">
                {group.entries.map((entry) => (
                  <div key={entry.id} className="relative">
                    {/* Timeline dot */}
                    <div className="absolute -left-[21px] top-6 w-3 h-3 bg-blue-400 rounded-full border-2 border-white" />

                    <CareCoordinationEntryCard
                      entry={entry}
                      residentId={intakeId}
                      showActions={true}
                      isAdmin={isAdmin}
                      onEdit={() =>
                        router.push(
                          `/facility/residents/${intakeId}/care-coordination/${entry.id}?edit=true`
                        )
                      }
                      onDelete={() => handleDeleteEntry(entry.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
