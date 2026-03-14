"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Upload,
  FileText,
  Loader2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  User,
  Brain,
  AlertCircle,
} from "lucide-react";
import type {
  ExtractedIntakeData,
  ExtractedASAMData,
  ExtractionConfidence,
  ExtractionWarning,
} from "@/lib/ai/psych-eval-extraction";

type DialogStep = "upload" | "processing" | "review" | "confirm";

interface PsychEvalUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ExtractionResult {
  intake: ExtractedIntakeData;
  asam: ExtractedASAMData;
  confidence: ExtractionConfidence;
  warnings: ExtractionWarning[];
}

export function PsychEvalUploadDialog({
  open,
  onOpenChange,
}: PsychEvalUploadDialogProps) {
  const { toast } = useToast();
  const router = useRouter();

  // State
  const [step, setStep] = useState<DialogStep>("upload");
  const [residentName, setResidentName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Extracted data
  const [extractedData, setExtractedData] = useState<ExtractionResult | null>(null);
  const [fileKey, setFileKey] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");

  // Editable data (for review step)
  const [editedIntake, setEditedIntake] = useState<ExtractedIntakeData>({});
  const [editedAsam, setEditedAsam] = useState<ExtractedASAMData>({});

  // Section expand state
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["demographics", "psychiatric", "risk", "dimension1", "dimension3"])
  );

  const resetDialog = useCallback(() => {
    setStep("upload");
    setResidentName("");
    setSelectedFile(null);
    setExtractedData(null);
    setFileKey("");
    setFileName("");
    setEditedIntake({});
    setEditedAsam({});
    setIsProcessing(false);
    setIsCreating(false);
  }, []);

  const handleClose = useCallback(() => {
    resetDialog();
    onOpenChange(false);
  }, [resetDialog, onOpenChange]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const handleUpload = async () => {
    if (!selectedFile || !residentName.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter a resident name and select a PDF file.",
      });
      return;
    }

    setStep("processing");
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("residentName", residentName.trim());

      const response = await fetch("/api/psych-eval/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process psych evaluation");
      }

      const data = await response.json();

      setExtractedData(data.extractedData);
      setFileKey(data.fileKey);
      setFileName(data.fileName);

      // Initialize editable data with extracted values
      setEditedIntake({ ...data.extractedData.intake, residentName: residentName.trim() });
      setEditedAsam({ ...data.extractedData.asam, patientName: residentName.trim() });

      setStep("review");
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Processing Failed",
        description:
          error instanceof Error ? error.message : "Failed to process psych evaluation",
      });
      setStep("upload");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreate = async () => {
    setIsCreating(true);

    try {
      const response = await fetch("/api/psych-eval/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileKey,
          fileName,
          residentName: editedIntake.residentName || residentName,
          intakeData: editedIntake,
          asamData: editedAsam,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create records");
      }

      const data = await response.json();

      toast({
        title: "Records Created",
        description: `Draft intake and ASAM assessment created for ${editedIntake.residentName || residentName}`,
      });

      handleClose();

      // Navigate to intake edit page
      router.push(`/facility/intakes/${data.intake.id}/edit`);
    } catch (error) {
      console.error("Create error:", error);
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description:
          error instanceof Error ? error.message : "Failed to create records",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">High Confidence</Badge>;
    } else if (confidence >= 0.5) {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium Confidence</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Low Confidence</Badge>;
    }
  };

  const updateIntakeField = (field: keyof ExtractedIntakeData, value: unknown) => {
    setEditedIntake((prev) => ({ ...prev, [field]: value }));
  };

  const updateAsamField = (field: keyof ExtractedASAMData, value: unknown) => {
    setEditedAsam((prev) => ({ ...prev, [field]: value }));
  };

  const renderTextField = (
    label: string,
    value: string | undefined,
    onChange: (value: string) => void,
    multiline = false
  ) => (
    <div className="space-y-1">
      <Label className="text-sm font-medium">{label}</Label>
      {multiline ? (
        <Textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[80px]"
        />
      ) : (
        <Input value={value || ""} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );

  const renderCollapsibleSection = (
    id: string,
    title: string,
    icon: React.ReactNode,
    children: React.ReactNode
  ) => {
    const isExpanded = expandedSections.has(id);
    return (
      <div className="border rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection(id)}
          className="flex items-center justify-between w-full p-3 bg-muted/50 hover:bg-muted transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium">{title}</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        {isExpanded && (
          <div className="p-3 border-t">
            <div className="space-y-4">{children}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            {step === "upload" && "Upload Psych Evaluation"}
            {step === "processing" && "Processing Document"}
            {step === "review" && "Review Extracted Data"}
            {step === "confirm" && "Create Records"}
          </DialogTitle>
          <DialogDescription>
            {step === "upload" &&
              "Upload a psychiatric evaluation PDF to auto-create a new resident intake and ASAM assessment"}
            {step === "processing" &&
              "Extracting data from the document using AI..."}
            {step === "review" &&
              "Review and edit the extracted information before creating records"}
            {step === "confirm" && "Confirm the data and create draft records"}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="residentName">Resident Name *</Label>
              <Input
                id="residentName"
                value={residentName}
                onChange={(e) => setResidentName(e.target.value)}
                placeholder="Enter the resident's full name"
              />
              <p className="text-xs text-muted-foreground">
                This name will be used for the new intake record
              </p>
            </div>

            <div className="space-y-2">
              <Label>Psych Evaluation PDF *</Label>
              <div
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center transition-colors
                  ${selectedFile ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
                `}
              >
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-10 w-10 text-primary" />
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <p className="font-medium">Click to upload or drag and drop</p>
                    <p className="text-sm text-muted-foreground">
                      PDF files only, up to 10MB
                    </p>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,application/pdf"
                      onChange={(e) =>
                        setSelectedFile(e.target.files?.[0] || null)
                      }
                    />
                  </label>
                )}
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>How it works</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Upload a psychiatric evaluation PDF document</li>
                  <li>AI will extract relevant clinical data</li>
                  <li>Review and edit the extracted information</li>
                  <li>Create a DRAFT intake and DRAFT ASAM assessment</li>
                  <li>Complete the forms with any missing information</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || !residentName.trim()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Extract Data
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Processing */}
        {step === "processing" && (
          <div className="py-12 flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-medium">Extracting data from document...</p>
              <p className="text-sm text-muted-foreground mt-1">
                This may take a moment
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === "review" && extractedData && (
          <div className="space-y-6 py-4">
            {/* Confidence and Warnings */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getConfidenceBadge(extractedData.confidence.overall)}
                <span className="text-sm text-muted-foreground">
                  Overall extraction confidence
                </span>
              </div>
            </div>

            {extractedData.warnings.length > 0 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-800">Extraction Warnings</AlertTitle>
                <AlertDescription className="text-yellow-700">
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {extractedData.warnings.map((warning, i) => (
                      <li key={i} className="text-sm">
                        <span className="font-medium">{warning.field}:</span>{" "}
                        {warning.message}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Intake Data Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Intake Data</h3>
                  {getConfidenceBadge(extractedData.confidence.intake)}
                </div>

                {renderCollapsibleSection(
                  "demographics",
                  "Demographics",
                  <User className="h-4 w-4" />,
                  <>
                    {renderTextField(
                      "Resident Name",
                      editedIntake.residentName,
                      (v) => updateIntakeField("residentName", v)
                    )}
                    {renderTextField("Date of Birth", editedIntake.dateOfBirth, (v) =>
                      updateIntakeField("dateOfBirth", v)
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {renderTextField("Sex", editedIntake.sex, (v) =>
                        updateIntakeField("sex", v)
                      )}
                      {renderTextField("Ethnicity", editedIntake.ethnicity, (v) =>
                        updateIntakeField("ethnicity", v)
                      )}
                    </div>
                    {renderTextField(
                      "Phone",
                      editedIntake.patientPhone,
                      (v) => updateIntakeField("patientPhone", v)
                    )}
                    {renderTextField(
                      "Address",
                      editedIntake.patientAddress,
                      (v) => updateIntakeField("patientAddress", v),
                      true
                    )}
                  </>
                )}

                {renderCollapsibleSection(
                  "psychiatric",
                  "Psychiatric History",
                  <Brain className="h-4 w-4" />,
                  <>
                    {renderTextField(
                      "Diagnosis",
                      editedIntake.diagnosis,
                      (v) => updateIntakeField("diagnosis", v),
                      true
                    )}
                    {renderTextField(
                      "Personal Psychiatric History",
                      editedIntake.personalPsychHX,
                      (v) => updateIntakeField("personalPsychHX", v),
                      true
                    )}
                    {renderTextField(
                      "Family Psychiatric History",
                      editedIntake.familyPsychHX,
                      (v) => updateIntakeField("familyPsychHX", v),
                      true
                    )}
                    {renderTextField(
                      "Current Behavioral Symptoms",
                      editedIntake.currentBehavioralSymptoms,
                      (v) => updateIntakeField("currentBehavioralSymptoms", v),
                      true
                    )}
                  </>
                )}

                {renderCollapsibleSection(
                  "risk",
                  "Risk Assessment",
                  <AlertTriangle className="h-4 w-4" />,
                  <>
                    {renderTextField(
                      "Suicide History",
                      editedIntake.suicideHistory,
                      (v) => updateIntakeField("suicideHistory", v),
                      true
                    )}
                    {renderTextField(
                      "Previous Hospitalizations",
                      editedIntake.previousHospitalizations,
                      (v) => updateIntakeField("previousHospitalizations", v),
                      true
                    )}
                  </>
                )}

                {renderCollapsibleSection(
                  "substance",
                  "Substance Use",
                  <AlertCircle className="h-4 w-4" />,
                  <>
                    {renderTextField(
                      "Substance History",
                      editedIntake.substanceHistory,
                      (v) => updateIntakeField("substanceHistory", v),
                      true
                    )}
                    {renderTextField(
                      "Drug of Choice",
                      editedIntake.drugOfChoice,
                      (v) => updateIntakeField("drugOfChoice", v)
                    )}
                    {renderTextField(
                      "Longest Sobriety",
                      editedIntake.longestSobriety,
                      (v) => updateIntakeField("longestSobriety", v)
                    )}
                  </>
                )}
              </div>

              {/* ASAM Data Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">ASAM Data</h3>
                  {getConfidenceBadge(extractedData.confidence.asam)}
                </div>

                {renderCollapsibleSection(
                  "dimension1",
                  "Dimension 1: Substance Use/Withdrawal",
                  <span className="text-xs font-bold">D1</span>,
                  <>
                    {renderTextField(
                      "Withdrawal Symptoms Details",
                      editedAsam.withdrawalSymptomsDetails,
                      (v) => updateAsamField("withdrawalSymptomsDetails", v),
                      true
                    )}
                    {renderTextField(
                      "Tolerance Details",
                      editedAsam.toleranceDetails,
                      (v) => updateAsamField("toleranceDetails", v),
                      true
                    )}
                    {renderTextField(
                      "Family Substance History",
                      editedAsam.familySubstanceHistory,
                      (v) => updateAsamField("familySubstanceHistory", v),
                      true
                    )}
                  </>
                )}

                {renderCollapsibleSection(
                  "dimension2",
                  "Dimension 2: Biomedical",
                  <span className="text-xs font-bold">D2</span>,
                  <>
                    {renderTextField(
                      "Prior Hospitalizations",
                      editedAsam.priorHospitalizations,
                      (v) => updateAsamField("priorHospitalizations", v),
                      true
                    )}
                  </>
                )}

                {renderCollapsibleSection(
                  "dimension3",
                  "Dimension 3: Emotional/Behavioral",
                  <span className="text-xs font-bold">D3</span>,
                  <>
                    {renderTextField(
                      "Abuse History",
                      editedAsam.abuseHistory,
                      (v) => updateAsamField("abuseHistory", v),
                      true
                    )}
                    {renderTextField(
                      "Traumatic Events",
                      editedAsam.traumaticEvents,
                      (v) => updateAsamField("traumaticEvents", v),
                      true
                    )}
                    {renderTextField(
                      "Mental Illness Details",
                      editedAsam.mentalIllnessDetails,
                      (v) => updateAsamField("mentalIllnessDetails", v),
                      true
                    )}
                  </>
                )}

                {renderCollapsibleSection(
                  "dimension4",
                  "Dimension 4: Readiness to Change",
                  <span className="text-xs font-bold">D4</span>,
                  <>
                    {renderTextField(
                      "Recovery Support",
                      editedAsam.recoverySupport,
                      (v) => updateAsamField("recoverySupport", v),
                      true
                    )}
                    {renderTextField(
                      "Recovery Barriers",
                      editedAsam.recoveryBarriers,
                      (v) => updateAsamField("recoveryBarriers", v),
                      true
                    )}
                  </>
                )}

                {renderCollapsibleSection(
                  "dimension5",
                  "Dimension 5: Relapse Potential",
                  <span className="text-xs font-bold">D5</span>,
                  <>
                    {renderTextField(
                      "Coping with Triggers",
                      editedAsam.copingWithTriggers,
                      (v) => updateAsamField("copingWithTriggers", v),
                      true
                    )}
                    {renderTextField(
                      "What Helped",
                      editedAsam.whatHelped,
                      (v) => updateAsamField("whatHelped", v),
                      true
                    )}
                  </>
                )}

                {renderCollapsibleSection(
                  "dimension6",
                  "Dimension 6: Recovery Environment",
                  <span className="text-xs font-bold">D6</span>,
                  <>
                    {renderTextField(
                      "Current Living Situation",
                      editedAsam.currentLivingSituation,
                      (v) => updateAsamField("currentLivingSituation", v),
                      true
                    )}
                    {renderTextField(
                      "Supportive Relationships",
                      editedAsam.supportiveRelationships,
                      (v) => updateAsamField("supportiveRelationships", v),
                      true
                    )}
                  </>
                )}

                {renderCollapsibleSection(
                  "levelOfCare",
                  "Level of Care",
                  <CheckCircle2 className="h-4 w-4" />,
                  <>
                    {renderTextField(
                      "DSM-5 Diagnoses",
                      editedAsam.dsm5Diagnoses,
                      (v) => updateAsamField("dsm5Diagnoses", v),
                      true
                    )}
                    {renderTextField(
                      "Recommended Level of Care",
                      editedAsam.recommendedLevelOfCare,
                      (v) => updateAsamField("recommendedLevelOfCare", v)
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isCreating}>
                  {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Draft Records
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
