"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { RiskFlagBanner } from "./risk-flag-banner";
import { formatDate } from "@/lib/utils";
import { PROGRESS_NOTE_SHIFTS } from "@/lib/validations";
import { Sparkles, Loader2, Save, CheckCircle } from "lucide-react";

interface ResidentInfo {
  id: string;
  residentName: string;
  dateOfBirth: Date | string;
}

interface ProgressNoteData {
  id?: string;
  noteDate?: string | Date | null;
  shift?: string | null;
  authorName?: string | null;
  authorTitle?: string | null;
  residentStatus?: string | null;
  observedBehaviors?: string | null;
  moodAffect?: string | null;
  activityParticipation?: string | null;
  staffInteractions?: string | null;
  peerInteractions?: string | null;
  medicationCompliance?: string | null;
  hygieneAdl?: string | null;
  mealsAppetite?: string | null;
  sleepPattern?: string | null;
  staffInterventions?: string | null;
  residentResponse?: string | null;
  notableEvents?: string | null;
  additionalNotes?: string | null;
  generatedNote?: string | null;
  riskFlagsDetected?: string[];
  status?: string;
  // Signature fields
  bhtSignature?: string | null;
  bhtCredentials?: string | null;
  bhtSignatureDate?: string | Date | null;
}

interface ProgressNoteFormProps {
  resident: ResidentInfo;
  initialData?: ProgressNoteData;
  mode?: "create" | "edit";
  readOnly?: boolean;
}

export function ProgressNoteForm({
  resident,
  initialData,
  mode = "create",
  readOnly = false,
}: ProgressNoteFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [formData, setFormData] = useState({
    noteDate: initialData?.noteDate
      ? new Date(initialData.noteDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    shift: initialData?.shift || "",
    authorName: initialData?.authorName || "",
    authorTitle: initialData?.authorTitle || "",
    residentStatus: initialData?.residentStatus || "",
    observedBehaviors: initialData?.observedBehaviors || "",
    moodAffect: initialData?.moodAffect || "",
    activityParticipation: initialData?.activityParticipation || "",
    staffInteractions: initialData?.staffInteractions || "",
    peerInteractions: initialData?.peerInteractions || "",
    medicationCompliance: initialData?.medicationCompliance || "",
    hygieneAdl: initialData?.hygieneAdl || "",
    mealsAppetite: initialData?.mealsAppetite || "",
    sleepPattern: initialData?.sleepPattern || "",
    staffInterventions: initialData?.staffInterventions || "",
    residentResponse: initialData?.residentResponse || "",
    notableEvents: initialData?.notableEvents || "",
    additionalNotes: initialData?.additionalNotes || "",
    // Signature fields
    bhtSignature: initialData?.bhtSignature || "",
    bhtCredentials: initialData?.bhtCredentials || "",
    bhtSignatureDate: initialData?.bhtSignatureDate
      ? new Date(initialData.bhtSignatureDate).toISOString().split("T")[0]
      : "",
  });

  const [generatedNote, setGeneratedNote] = useState(
    initialData?.generatedNote || ""
  );
  const [riskFlags, setRiskFlags] = useState<string[]>(
    initialData?.riskFlagsDetected || []
  );

  async function handleSave(isDraft: boolean = true) {
    if (isDraft) {
      setIsSavingDraft(true);
    } else {
      setIsLoading(true);
    }

    try {
      const url =
        mode === "edit" && initialData?.id
          ? `/api/progress-notes/${initialData.id}`
          : "/api/progress-notes";

      const method = mode === "edit" ? "PATCH" : "POST";

      const payload: Record<string, unknown> = {
        ...formData,
        intakeId: resident.id,
        isDraft,
      };

      // Include generated note and risk flags if they exist
      if (mode === "edit" && generatedNote) {
        payload.generatedNote = generatedNote;
        payload.riskFlagsDetected = riskFlags;
      }

      // If finalizing, include the generated note
      if (!isDraft) {
        payload.status = "FINAL";
        if (generatedNote) {
          payload.generatedNote = generatedNote;
          payload.riskFlagsDetected = riskFlags;
        }
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save progress note");
      }

      toast({
        title: isDraft ? "Draft Saved" : "Note Finalized",
        description: isDraft
          ? "Progress note draft saved successfully"
          : "Progress note has been finalized",
      });

      router.push(`/facility/residents/${resident.id}/progress-notes`);
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save progress note",
      });
    } finally {
      setIsLoading(false);
      setIsSavingDraft(false);
    }
  }

  async function handleGenerate() {
    // First save the current data
    if (mode === "create") {
      // Need to create the note first
      setIsSavingDraft(true);
      try {
        const response = await fetch("/api/progress-notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            intakeId: resident.id,
            isDraft: true,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to save progress note");
        }

        const data = await response.json();
        // Now generate with the new ID
        await generateNote(data.progressNote.id);

        // Redirect to edit page
        router.push(`/facility/residents/${resident.id}/progress-notes/${data.progressNote.id}`);
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to create progress note",
        });
      } finally {
        setIsSavingDraft(false);
      }
    } else if (initialData?.id) {
      // Save current changes first
      setIsSavingDraft(true);
      try {
        await fetch(`/api/progress-notes/${initialData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } catch {
        // Continue with generation even if save fails
      }
      setIsSavingDraft(false);
      await generateNote(initialData.id);
    }
  }

  async function generateNote(noteId: string) {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/progress-notes/${noteId}/generate`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate note");
      }

      const data = await response.json();
      setGeneratedNote(data.generatedNote);
      setRiskFlags(data.riskFlags || []);

      toast({
        title: "Note Generated",
        description: "AI has generated a professional clinical note",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description:
          error instanceof Error ? error.message : "Failed to generate note",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Risk Flag Banner */}
      {riskFlags.length > 0 && <RiskFlagBanner riskFlags={riskFlags} />}

      {/* Resident Information */}
      <Card>
        <CardHeader>
          <CardTitle>Resident Information</CardTitle>
          <CardDescription>
            Daily Progress Note for {formatDate(formData.noteDate)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-muted-foreground">Resident Name</Label>
              <p className="font-medium">{resident.residentName}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Date of Birth</Label>
              <p className="font-medium">{formatDate(resident.dateOfBirth)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Note Status</Label>
              <p className="font-medium">
                {initialData?.status === "FINAL" ? (
                  <span className="text-green-600">Finalized</span>
                ) : (
                  <span className="text-yellow-600">Draft</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Note Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Note Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="noteDate">Date *</Label>
              <Input
                id="noteDate"
                type="date"
                value={formData.noteDate}
                onChange={(e) =>
                  setFormData({ ...formData, noteDate: e.target.value })
                }
                required={!readOnly}
                disabled={readOnly}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="shift">Shift</Label>
              <Select
                value={formData.shift}
                onValueChange={(value) =>
                  setFormData({ ...formData, shift: value })
                }
                disabled={readOnly}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  {PROGRESS_NOTE_SHIFTS.map((shift) => (
                    <SelectItem key={shift} value={shift}>
                      {shift}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="authorName">Author Name *</Label>
              <Input
                id="authorName"
                value={formData.authorName}
                onChange={(e) =>
                  setFormData({ ...formData, authorName: e.target.value })
                }
                required={!readOnly}
                disabled={readOnly}
                placeholder="Staff name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="authorTitle">Author Title</Label>
              <Input
                id="authorTitle"
                value={formData.authorTitle}
                onChange={(e) =>
                  setFormData({ ...formData, authorTitle: e.target.value })
                }
                disabled={readOnly}
                placeholder="e.g., BHT, RN"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Observations */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Observations</CardTitle>
          <CardDescription>
            Enter brief observations. AI will convert these into professional clinical documentation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="residentStatus">Resident Status</Label>
              <Textarea
                id="residentStatus"
                value={formData.residentStatus}
                onChange={(e) =>
                  setFormData({ ...formData, residentStatus: e.target.value })
                }
                disabled={readOnly}
                placeholder="General status/condition..."
                rows={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="observedBehaviors">Observed Behaviors</Label>
              <Textarea
                id="observedBehaviors"
                value={formData.observedBehaviors}
                onChange={(e) =>
                  setFormData({ ...formData, observedBehaviors: e.target.value })
                }
                disabled={readOnly}
                placeholder="Specific behaviors noted..."
                rows={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="moodAffect">Mood / Affect</Label>
              <Textarea
                id="moodAffect"
                value={formData.moodAffect}
                onChange={(e) =>
                  setFormData({ ...formData, moodAffect: e.target.value })
                }
                disabled={readOnly}
                placeholder="Emotional state observations..."
                rows={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="activityParticipation">Activity Participation</Label>
              <Textarea
                id="activityParticipation"
                value={formData.activityParticipation}
                onChange={(e) =>
                  setFormData({ ...formData, activityParticipation: e.target.value })
                }
                disabled={readOnly}
                placeholder="Engagement in activities..."
                rows={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="staffInteractions">Staff Interactions</Label>
              <Textarea
                id="staffInteractions"
                value={formData.staffInteractions}
                onChange={(e) =>
                  setFormData({ ...formData, staffInteractions: e.target.value })
                }
                disabled={readOnly}
                placeholder="How resident interacted with staff..."
                rows={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="peerInteractions">Peer Interactions</Label>
              <Textarea
                id="peerInteractions"
                value={formData.peerInteractions}
                onChange={(e) =>
                  setFormData({ ...formData, peerInteractions: e.target.value })
                }
                disabled={readOnly}
                placeholder="Interactions with other residents..."
                rows={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="medicationCompliance">Medication Compliance</Label>
              <Textarea
                id="medicationCompliance"
                value={formData.medicationCompliance}
                onChange={(e) =>
                  setFormData({ ...formData, medicationCompliance: e.target.value })
                }
                disabled={readOnly}
                placeholder="Med adherence observations..."
                rows={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="hygieneAdl">Hygiene / ADLs</Label>
              <Textarea
                id="hygieneAdl"
                value={formData.hygieneAdl}
                onChange={(e) =>
                  setFormData({ ...formData, hygieneAdl: e.target.value })
                }
                disabled={readOnly}
                placeholder="Activities of daily living..."
                rows={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="mealsAppetite">Meals / Appetite</Label>
              <Textarea
                id="mealsAppetite"
                value={formData.mealsAppetite}
                onChange={(e) =>
                  setFormData({ ...formData, mealsAppetite: e.target.value })
                }
                disabled={readOnly}
                placeholder="Eating habits..."
                rows={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sleepPattern">Sleep Pattern</Label>
              <Textarea
                id="sleepPattern"
                value={formData.sleepPattern}
                onChange={(e) =>
                  setFormData({ ...formData, sleepPattern: e.target.value })
                }
                disabled={readOnly}
                placeholder="Sleep quality/patterns..."
                rows={2}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interventions */}
      <Card>
        <CardHeader>
          <CardTitle>Interventions & Response</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="staffInterventions">Staff Interventions</Label>
              <Textarea
                id="staffInterventions"
                value={formData.staffInterventions}
                onChange={(e) =>
                  setFormData({ ...formData, staffInterventions: e.target.value })
                }
                disabled={readOnly}
                placeholder="Actions taken by staff..."
                rows={3}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="residentResponse">Resident Response</Label>
              <Textarea
                id="residentResponse"
                value={formData.residentResponse}
                onChange={(e) =>
                  setFormData({ ...formData, residentResponse: e.target.value })
                }
                disabled={readOnly}
                placeholder="How resident responded to interventions..."
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="notableEvents">Notable Events</Label>
            <Textarea
              id="notableEvents"
              value={formData.notableEvents}
              onChange={(e) =>
                setFormData({ ...formData, notableEvents: e.target.value })
              }
              disabled={readOnly}
              placeholder="Significant occurrences..."
              rows={3}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="additionalNotes">Additional Notes</Label>
            <Textarea
              id="additionalNotes"
              value={formData.additionalNotes}
              onChange={(e) =>
                setFormData({ ...formData, additionalNotes: e.target.value })
              }
              disabled={readOnly}
              placeholder="Any other observations..."
              rows={3}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Generated Note */}
      {(generatedNote || !readOnly) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  AI-Generated Clinical Note
                </CardTitle>
                <CardDescription>
                  Professional clinical documentation ready for audit
                </CardDescription>
              </div>
              {!readOnly && !initialData?.status?.includes("FINAL") && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={isGenerating || !formData.authorName}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      {generatedNote ? "Regenerate" : "Generate Note"}
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {generatedNote ? (
              <div className="bg-muted/50 p-4 rounded-lg whitespace-pre-wrap">
                {generatedNote}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Fill in the observation fields above, then click &quot;Generate Note&quot;</p>
                <p className="text-sm">AI will convert your observations into professional clinical documentation</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* BHT Signature Section */}
      <Card>
        <CardHeader>
          <CardTitle>BHT Signature</CardTitle>
          <CardDescription>
            {readOnly
              ? "Signature recorded by the Behavioral Health Technician"
              : "Required signature to finalize this progress note"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="bhtSignature">Signature (Full Name) *</Label>
              <Input
                id="bhtSignature"
                value={formData.bhtSignature}
                onChange={(e) =>
                  setFormData({ ...formData, bhtSignature: e.target.value })
                }
                disabled={readOnly}
                placeholder="Enter your full name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="bhtCredentials">Credentials</Label>
              <Input
                id="bhtCredentials"
                value={formData.bhtCredentials}
                onChange={(e) =>
                  setFormData({ ...formData, bhtCredentials: e.target.value })
                }
                disabled={readOnly}
                placeholder="e.g., BHT, CNA, RBT"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="bhtSignatureDate">Date *</Label>
              <Input
                id="bhtSignatureDate"
                type="date"
                value={formData.bhtSignatureDate}
                onChange={(e) =>
                  setFormData({ ...formData, bhtSignatureDate: e.target.value })
                }
                disabled={readOnly}
                className="mt-1"
              />
            </div>
          </div>
          {!readOnly && !formData.bhtSignature && (
            <p className="text-sm text-amber-600">
              Signature is required to finalize this progress note.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {!readOnly && (
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              router.push(`/facility/residents/${resident.id}/progress-notes`)
            }
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={isSavingDraft || isLoading || isGenerating}
            onClick={() => handleSave(true)}
          >
            {isSavingDraft ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </>
            )}
          </Button>
          {generatedNote && (
            <Button
              type="button"
              disabled={isLoading || isSavingDraft || isGenerating || !formData.bhtSignature || !formData.bhtSignatureDate}
              onClick={() => handleSave(false)}
              title={!formData.bhtSignature || !formData.bhtSignatureDate ? "Signature required to finalize" : ""}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Finalizing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finalize Note
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
