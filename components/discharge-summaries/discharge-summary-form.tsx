"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  DISCHARGE_TYPES,
  ENROLLED_PROGRAMS,
  RECOMMENDED_LEVELS_OF_CARE,
  COMPLETED_SERVICES,
} from "@/lib/validations";
import { formatDate } from "@/lib/utils";
import { Plus, Trash2, Sparkles, Loader2 } from "lucide-react";

interface ResidentInfo {
  id: string;
  residentName: string;
  dateOfBirth: Date | string;
  policyNumber?: string | null;
  ahcccsHealthPlan?: string | null;
  admissionDate?: Date | string | null;
  // Clinical data for prefilling from Intake
  diagnosis?: string | null;
  allergies?: string | null;
  treatmentObjectives?: string | null;
  presentingProblem?: string | null;
  // ASAM data for prefilling
  asamLevelOfCare?: string | null;
  asamReasonForTreatment?: string | null;
  asamCurrentSymptoms?: string | null;
}

interface ObjectiveAttained {
  objective: string;
  attained: "Fully Attained" | "Partially Attained" | "Not Attained" | "N/A";
}

interface Medication {
  medication: string;
  dosage: string;
  frequency: string;
  prescriber: string;
}

interface ServiceReferral {
  service: string;
  provider: string;
  phone: string;
  address: string;
  appointmentDate: string;
}

interface MeetingParticipants {
  bhp: boolean;
  caseManager: boolean;
  bhtAdmin: boolean;
  resident: boolean;
  nurse: boolean;
}

interface DischargeSummaryData {
  id?: string;
  dischargeDate?: string | Date | null;
  dischargeStartTime?: string | null;
  dischargeEndTime?: string | null;
  enrolledProgram?: string | null;
  dischargeType?: string | null;
  recommendedLevelOfCare?: string | null;
  contactPhoneAfterDischarge?: string | null;
  contactAddressAfterDischarge?: string | null;
  // Clinical content - prefilled
  diagnoses?: string | null;
  allergies?: string | null;
  asamLevelOfCare?: string | null;
  // Clinical content - editable
  presentingIssuesAtAdmission?: string | null;
  treatmentSummary?: string | null;
  objectivesAttained?: ObjectiveAttained[];
  objectiveNarratives?: {
    fullyAttained?: string;
    partiallyAttained?: string;
    notAttained?: string;
  };
  completedServices?: string[];
  actualDischargeDate?: string | Date | null;
  dischargeSummaryNarrative?: string | null;
  dischargingTo?: string | null;
  personalItemsReceived?: boolean;
  personalItemsStoredDays?: number | null;
  itemsRemainAtFacility?: boolean;
  dischargeMedications?: Medication[];
  serviceReferrals?: ServiceReferral[];
  clinicalRecommendations?: string | null;
  // Relapse prevention & crisis
  relapsePreventionPlan?: string | null;
  crisisResources?: string | null;
  // Patient education
  patientEducationProvided?: string | null;
  specialInstructions?: string | null;
  culturalPreferencesConsidered?: boolean;
  suicidePreventionEducation?: string | null;
  meetingInvitees?: MeetingParticipants;
  meetingAttendees?: MeetingParticipants;
  clientSignature?: string | null;
  clientSignatureDate?: string | Date | null;
  staffSignature?: string | null;
  staffCredentials?: string | null;
  staffSignatureDate?: string | Date | null;
  reviewerSignature?: string | null;
  reviewerCredentials?: string | null;
  reviewerSignatureDate?: string | Date | null;
  status?: string;
}

interface DischargeSummaryFormProps {
  resident: ResidentInfo;
  initialData?: DischargeSummaryData;
  mode?: "create" | "edit";
  readOnly?: boolean;
  prefillMedications?: Medication[];
}

function formatDateInput(date?: string | Date | null): string {
  if (!date) return "";
  try {
    return new Date(date).toISOString().split("T")[0];
  } catch {
    return "";
  }
}

// Transform objectives to ensure attained is a valid string enum value
function transformObjectives(objectives: unknown): ObjectiveAttained[] {
  if (!objectives || !Array.isArray(objectives)) return [];
  return objectives.map((obj: { objective?: string; attained?: unknown }) => {
    let attained: ObjectiveAttained["attained"] = "N/A";
    if (typeof obj.attained === "boolean") {
      attained = obj.attained ? "Fully Attained" : "Not Attained";
    } else if (typeof obj.attained === "string") {
      const validValues = ["Fully Attained", "Partially Attained", "Not Attained", "N/A"];
      attained = validValues.includes(obj.attained) ? obj.attained as ObjectiveAttained["attained"] : "N/A";
    }
    return {
      objective: obj.objective || "",
      attained,
    };
  });
}

// Transform medications to ensure field names match validation schema
function transformMedications(meds: unknown): Medication[] {
  if (!meds || !Array.isArray(meds)) return [];
  return meds.map((med: Record<string, string>) => ({
    medication: med.medication || med.name || "",
    dosage: med.dosage || med.dose || "",
    frequency: med.frequency || "",
    prescriber: med.prescriber || "",
  }));
}

// Transform referrals to ensure field names match validation schema
function transformReferrals(refs: unknown): ServiceReferral[] {
  if (!refs || !Array.isArray(refs)) return [];
  return refs.map((ref: Record<string, string>) => ({
    service: ref.service || "",
    provider: ref.provider || "",
    phone: ref.phone || "",
    address: ref.address || "",
    appointmentDate: ref.appointmentDate || "",
  }));
}

// Transform objectiveNarratives to ensure correct schema structure
function transformNarratives(narratives: unknown): { fullyAttained: string; partiallyAttained: string; notAttained: string } {
  const defaultNarratives = { fullyAttained: "", partiallyAttained: "", notAttained: "" };
  if (!narratives || typeof narratives !== "object") return defaultNarratives;
  const n = narratives as Record<string, string>;
  // If it has the expected keys, use them
  if ("fullyAttained" in n || "partiallyAttained" in n || "notAttained" in n) {
    return {
      fullyAttained: n.fullyAttained || "",
      partiallyAttained: n.partiallyAttained || "",
      notAttained: n.notAttained || "",
    };
  }
  // Otherwise, it might have objective1, objective2, etc - combine into notAttained
  const values = Object.values(n).filter(v => typeof v === "string" && v.trim());
  return {
    fullyAttained: "",
    partiallyAttained: "",
    notAttained: values.join("\n\n"),
  };
}

export function DischargeSummaryForm({
  resident,
  initialData,
  mode = "create",
  readOnly = false,
  prefillMedications = [],
}: DischargeSummaryFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const [formData, setFormData] = useState({
    dischargeDate: formatDateInput(initialData?.dischargeDate),
    dischargeStartTime: initialData?.dischargeStartTime || "",
    dischargeEndTime: initialData?.dischargeEndTime || "",
    enrolledProgram: initialData?.enrolledProgram || "",
    dischargeType: initialData?.dischargeType || "",
    recommendedLevelOfCare: initialData?.recommendedLevelOfCare || "",
    contactPhoneAfterDischarge: initialData?.contactPhoneAfterDischarge || "",
    contactAddressAfterDischarge: initialData?.contactAddressAfterDischarge || "",
    // Clinical content - prefilled from intake/ASAM (always fallback to resident data if not set)
    diagnoses: initialData?.diagnoses || resident.diagnosis || "",
    allergies: initialData?.allergies || resident.allergies || "",
    asamLevelOfCare: initialData?.asamLevelOfCare || resident.asamLevelOfCare || "",
    // Clinical content - editable (prefilled from intake and ASAM data)
    presentingIssuesAtAdmission: initialData?.presentingIssuesAtAdmission ||
      (mode === "create" ? [
        resident.presentingProblem,
        resident.asamReasonForTreatment,
        resident.asamCurrentSymptoms,
      ].filter(Boolean).join("\n\n") || "" : ""),
    treatmentSummary: initialData?.treatmentSummary || "",
    objectivesAttained: transformObjectives(initialData?.objectivesAttained),
    objectiveNarratives: transformNarratives(initialData?.objectiveNarratives),
    completedServices: initialData?.completedServices || [] as string[],
    actualDischargeDate: formatDateInput(initialData?.actualDischargeDate),
    dischargeSummaryNarrative: initialData?.dischargeSummaryNarrative || "",
    dischargingTo: initialData?.dischargingTo || "",
    personalItemsReceived: initialData?.personalItemsReceived || false,
    personalItemsStoredDays: initialData?.personalItemsStoredDays || 0,
    itemsRemainAtFacility: initialData?.itemsRemainAtFacility || false,
    dischargeMedications: initialData?.dischargeMedications
      ? transformMedications(initialData.dischargeMedications)
      : (mode === "create" ? prefillMedications : []),
    serviceReferrals: transformReferrals(initialData?.serviceReferrals),
    clinicalRecommendations: initialData?.clinicalRecommendations || "",
    // Relapse prevention & crisis
    relapsePreventionPlan: initialData?.relapsePreventionPlan || "",
    crisisResources: initialData?.crisisResources || "",
    // Patient education
    patientEducationProvided: initialData?.patientEducationProvided || "",
    specialInstructions: initialData?.specialInstructions || "",
    culturalPreferencesConsidered: initialData?.culturalPreferencesConsidered || false,
    suicidePreventionEducation: initialData?.suicidePreventionEducation || "",
    meetingInvitees: initialData?.meetingInvitees || {
      bhp: false,
      caseManager: false,
      bhtAdmin: false,
      resident: false,
      nurse: false,
    },
    meetingAttendees: initialData?.meetingAttendees || {
      bhp: false,
      caseManager: false,
      bhtAdmin: false,
      resident: false,
      nurse: false,
    },
    clientSignature: initialData?.clientSignature || "",
    clientSignatureDate: formatDateInput(initialData?.clientSignatureDate),
    staffSignature: initialData?.staffSignature || "",
    staffCredentials: initialData?.staffCredentials || "",
    staffSignatureDate: formatDateInput(initialData?.staffSignatureDate),
    reviewerSignature: initialData?.reviewerSignature || "",
    reviewerCredentials: initialData?.reviewerCredentials || "",
    reviewerSignatureDate: formatDateInput(initialData?.reviewerSignatureDate),
  });

  const toggleService = (service: string) => {
    if (formData.completedServices.includes(service)) {
      setFormData({
        ...formData,
        completedServices: formData.completedServices.filter((s) => s !== service),
      });
    } else {
      setFormData({
        ...formData,
        completedServices: [...formData.completedServices, service],
      });
    }
  };

  const addObjective = () => {
    setFormData({
      ...formData,
      objectivesAttained: [
        ...formData.objectivesAttained,
        { objective: "", attained: "N/A" as const },
      ],
    });
  };

  const updateObjective = (index: number, field: keyof ObjectiveAttained, value: string) => {
    const updated = [...formData.objectivesAttained];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, objectivesAttained: updated });
  };

  const removeObjective = (index: number) => {
    setFormData({
      ...formData,
      objectivesAttained: formData.objectivesAttained.filter((_, i) => i !== index),
    });
  };

  const addMedication = () => {
    setFormData({
      ...formData,
      dischargeMedications: [
        ...formData.dischargeMedications,
        { medication: "", dosage: "", frequency: "", prescriber: "" },
      ],
    });
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = [...formData.dischargeMedications];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, dischargeMedications: updated });
  };

  const removeMedication = (index: number) => {
    setFormData({
      ...formData,
      dischargeMedications: formData.dischargeMedications.filter((_, i) => i !== index),
    });
  };

  const addReferral = () => {
    setFormData({
      ...formData,
      serviceReferrals: [
        ...formData.serviceReferrals,
        { service: "", provider: "", phone: "", address: "", appointmentDate: "" },
      ],
    });
  };

  const updateReferral = (index: number, field: keyof ServiceReferral, value: string) => {
    const updated = [...formData.serviceReferrals];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, serviceReferrals: updated });
  };

  const removeReferral = (index: number) => {
    setFormData({
      ...formData,
      serviceReferrals: formData.serviceReferrals.filter((_, i) => i !== index),
    });
  };

  async function handleGenerateWithAI() {
    if (!formData.dischargeDate) {
      toast({
        variant: "destructive",
        title: "Discharge Date Required",
        description: "Please enter a discharge date before generating with AI.",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/discharge-summaries/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intakeId: resident.id,
          dischargeDate: formData.dischargeDate,
          dischargeType: formData.dischargeType,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate discharge summary");
      }

      const data = await response.json();
      const { generated, prefill } = data;

      // Update form with generated content
      setFormData((prev) => ({
        ...prev,
        presentingIssuesAtAdmission: generated.presentingIssuesAtAdmission || prev.presentingIssuesAtAdmission,
        treatmentSummary: generated.treatmentSummary || prev.treatmentSummary,
        dischargeSummaryNarrative: generated.dischargeSummaryNarrative || prev.dischargeSummaryNarrative,
        clinicalRecommendations: generated.clinicalRecommendations || prev.clinicalRecommendations,
        objectivesAttained: generated.objectivesAttained?.length > 0
          ? generated.objectivesAttained
          : prev.objectivesAttained,
        objectiveNarratives: {
          fullyAttained: generated.objectiveNarratives?.fullyAttained || prev.objectiveNarratives.fullyAttained,
          partiallyAttained: generated.objectiveNarratives?.partiallyAttained || prev.objectiveNarratives.partiallyAttained,
          notAttained: generated.objectiveNarratives?.notAttained || prev.objectiveNarratives.notAttained,
        },
        relapsePreventionPlan: generated.relapsePreventionPlan || prev.relapsePreventionPlan,
        crisisResources: generated.crisisResources || prev.crisisResources,
        patientEducationProvided: generated.patientEducationProvided || prev.patientEducationProvided,
        specialInstructions: generated.specialInstructions || prev.specialInstructions,
        suicidePreventionEducation: generated.suicidePreventionEducation || prev.suicidePreventionEducation,
        // Also update medications if we got prefill data and current is empty
        dischargeMedications: prev.dischargeMedications.length === 0 && prefill?.dischargeMedications?.length > 0
          ? prefill.dischargeMedications
          : prev.dischargeMedications,
      }));

      setHasGenerated(true);

      toast({
        title: "Content Generated",
        description: "AI has generated the discharge summary content. Please review and edit as needed.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate content",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent, isDraft: boolean = false) {
    e.preventDefault();

    if (isDraft) {
      setIsSavingDraft(true);
    } else {
      setIsLoading(true);
    }

    try {
      const url =
        mode === "edit" && initialData?.id
          ? `/api/discharge-summaries/${initialData.id}`
          : "/api/discharge-summaries";

      const method = mode === "edit" ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          intakeId: resident.id,
          isDraft,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save discharge summary");
      }

      toast({
        title: isDraft ? "Draft Saved" : "Success",
        description: isDraft
          ? "Discharge summary draft saved successfully"
          : "Discharge summary submitted successfully",
      });

      router.push(`/facility/residents/${resident.id}`);
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save discharge summary",
      });
    } finally {
      setIsLoading(false);
      setIsSavingDraft(false);
    }
  }

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
      {/* Resident Information (Auto-populated) */}
      <Card>
        <CardHeader>
          <CardTitle>Resident Information</CardTitle>
          <CardDescription>Auto-populated from intake records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-muted-foreground">Resident Name</Label>
              <p className="font-medium">{resident.residentName}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Date of Birth</Label>
              <p className="font-medium">{formatDate(resident.dateOfBirth)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">AHCCCS ID</Label>
              <p className="font-medium">
                {resident.policyNumber || resident.ahcccsHealthPlan || "N/A"}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Admission Date</Label>
              <p className="font-medium">{formatDate(resident.admissionDate)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discharge Information */}
      <Card>
        <CardHeader>
          <CardTitle>Discharge Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="dischargeDate">Discharge Date *</Label>
              <Input
                id="dischargeDate"
                type="date"
                value={formData.dischargeDate}
                onChange={(e) =>
                  setFormData({ ...formData, dischargeDate: e.target.value })
                }
                required={!readOnly}
                disabled={readOnly}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="dischargeStartTime">Start Time</Label>
              <Input
                id="dischargeStartTime"
                type="time"
                value={formData.dischargeStartTime}
                onChange={(e) =>
                  setFormData({ ...formData, dischargeStartTime: e.target.value })
                }
                disabled={readOnly}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="dischargeEndTime">End Time</Label>
              <Input
                id="dischargeEndTime"
                type="time"
                value={formData.dischargeEndTime}
                onChange={(e) =>
                  setFormData({ ...formData, dischargeEndTime: e.target.value })
                }
                disabled={readOnly}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="enrolledProgram">Enrolled Program</Label>
              <Select
                value={formData.enrolledProgram}
                onValueChange={(value) =>
                  setFormData({ ...formData, enrolledProgram: value })
                }
                disabled={readOnly}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {ENROLLED_PROGRAMS.map((program) => (
                    <SelectItem key={program} value={program}>
                      {program}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dischargeType">Discharge Type *</Label>
              <Select
                value={formData.dischargeType}
                onValueChange={(value) =>
                  setFormData({ ...formData, dischargeType: value })
                }
                disabled={readOnly}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {DISCHARGE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="recommendedLevelOfCare">Recommended Level of Care</Label>
              <Select
                value={formData.recommendedLevelOfCare}
                onValueChange={(value) =>
                  setFormData({ ...formData, recommendedLevelOfCare: value })
                }
                disabled={readOnly}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {RECOMMENDED_LEVELS_OF_CARE.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discharge Meeting Participants */}
      <Card>
        <CardHeader>
          <CardTitle>Discharge Meeting Participants</CardTitle>
          <CardDescription>
            Track who was invited to and attended the discharge meeting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Invitees */}
            <div>
              <h4 className="font-medium mb-4">Invited to Meeting</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="invitee-bhp"
                    checked={formData.meetingInvitees.bhp}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        meetingInvitees: { ...formData.meetingInvitees, bhp: !!checked },
                      })
                    }
                    disabled={readOnly}
                  />
                  <Label htmlFor="invitee-bhp" className="font-normal cursor-pointer">
                    BHP (Behavioral Health Professional)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="invitee-caseManager"
                    checked={formData.meetingInvitees.caseManager}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        meetingInvitees: { ...formData.meetingInvitees, caseManager: !!checked },
                      })
                    }
                    disabled={readOnly}
                  />
                  <Label htmlFor="invitee-caseManager" className="font-normal cursor-pointer">
                    Case Manager
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="invitee-bhtAdmin"
                    checked={formData.meetingInvitees.bhtAdmin}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        meetingInvitees: { ...formData.meetingInvitees, bhtAdmin: !!checked },
                      })
                    }
                    disabled={readOnly}
                  />
                  <Label htmlFor="invitee-bhtAdmin" className="font-normal cursor-pointer">
                    BHT / Administrator
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="invitee-resident"
                    checked={formData.meetingInvitees.resident}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        meetingInvitees: { ...formData.meetingInvitees, resident: !!checked },
                      })
                    }
                    disabled={readOnly}
                  />
                  <Label htmlFor="invitee-resident" className="font-normal cursor-pointer">
                    Resident
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="invitee-nurse"
                    checked={formData.meetingInvitees.nurse}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        meetingInvitees: { ...formData.meetingInvitees, nurse: !!checked },
                      })
                    }
                    disabled={readOnly}
                  />
                  <Label htmlFor="invitee-nurse" className="font-normal cursor-pointer">
                    Nurse
                  </Label>
                </div>
              </div>
            </div>

            {/* Attendees */}
            <div>
              <h4 className="font-medium mb-4">Present at Meeting</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="attendee-bhp"
                    checked={formData.meetingAttendees.bhp}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        meetingAttendees: { ...formData.meetingAttendees, bhp: !!checked },
                      })
                    }
                    disabled={readOnly}
                  />
                  <Label htmlFor="attendee-bhp" className="font-normal cursor-pointer">
                    BHP (Behavioral Health Professional)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="attendee-caseManager"
                    checked={formData.meetingAttendees.caseManager}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        meetingAttendees: { ...formData.meetingAttendees, caseManager: !!checked },
                      })
                    }
                    disabled={readOnly}
                  />
                  <Label htmlFor="attendee-caseManager" className="font-normal cursor-pointer">
                    Case Manager
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="attendee-bhtAdmin"
                    checked={formData.meetingAttendees.bhtAdmin}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        meetingAttendees: { ...formData.meetingAttendees, bhtAdmin: !!checked },
                      })
                    }
                    disabled={readOnly}
                  />
                  <Label htmlFor="attendee-bhtAdmin" className="font-normal cursor-pointer">
                    BHT / Administrator
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="attendee-resident"
                    checked={formData.meetingAttendees.resident}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        meetingAttendees: { ...formData.meetingAttendees, resident: !!checked },
                      })
                    }
                    disabled={readOnly}
                  />
                  <Label htmlFor="attendee-resident" className="font-normal cursor-pointer">
                    Resident
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="attendee-nurse"
                    checked={formData.meetingAttendees.nurse}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        meetingAttendees: { ...formData.meetingAttendees, nurse: !!checked },
                      })
                    }
                    disabled={readOnly}
                  />
                  <Label htmlFor="attendee-nurse" className="font-normal cursor-pointer">
                    Nurse
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information After Discharge */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information After Discharge</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contactPhoneAfterDischarge">Phone</Label>
              <Input
                id="contactPhoneAfterDischarge"
                value={formData.contactPhoneAfterDischarge}
                onChange={(e) =>
                  setFormData({ ...formData, contactPhoneAfterDischarge: e.target.value })
                }
                disabled={readOnly}
                placeholder="Phone number after discharge"
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="contactAddressAfterDischarge">Address</Label>
            <Textarea
              id="contactAddressAfterDischarge"
              value={formData.contactAddressAfterDischarge}
              onChange={(e) =>
                setFormData({ ...formData, contactAddressAfterDischarge: e.target.value })
              }
              disabled={readOnly}
              placeholder="Address after discharge"
              rows={2}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="dischargingTo">Discharging To</Label>
            <Textarea
              id="dischargingTo"
              value={formData.dischargingTo}
              onChange={(e) =>
                setFormData({ ...formData, dischargingTo: e.target.value })
              }
              disabled={readOnly}
              placeholder="Where is the resident going after discharge?"
              rows={2}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clinical Information (Prefilled from Intake/ASAM) */}
      <Card>
        <CardHeader>
          <CardTitle>Clinical Information</CardTitle>
          <CardDescription>
            Prefilled from intake assessment and ASAM evaluation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="diagnoses">Diagnoses</Label>
              <Textarea
                id="diagnoses"
                value={formData.diagnoses}
                onChange={(e) =>
                  setFormData({ ...formData, diagnoses: e.target.value })
                }
                disabled={readOnly}
                placeholder="Primary and secondary diagnoses"
                rows={3}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="allergies">Allergies</Label>
              <Textarea
                id="allergies"
                value={formData.allergies}
                onChange={(e) =>
                  setFormData({ ...formData, allergies: e.target.value })
                }
                disabled={readOnly}
                placeholder="Known allergies"
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="asamLevelOfCare">ASAM Level of Care</Label>
            <Input
              id="asamLevelOfCare"
              value={formData.asamLevelOfCare}
              onChange={(e) =>
                setFormData({ ...formData, asamLevelOfCare: e.target.value })
              }
              disabled={readOnly}
              placeholder="Recommended level of care from ASAM assessment"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clinical Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Treatment Summary</CardTitle>
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateWithAI}
                disabled={isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {hasGenerated ? "Regenerate with AI" : "Generate with AI"}
                  </>
                )}
              </Button>
            )}
          </div>
          {!readOnly && (
            <CardDescription>
              Click &quot;Generate with AI&quot; to auto-fill narrative fields based on intake data, progress notes, and treatment history.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="presentingIssuesAtAdmission">Presenting Problems at Admission</Label>
            <Textarea
              id="presentingIssuesAtAdmission"
              value={formData.presentingIssuesAtAdmission}
              onChange={(e) =>
                setFormData({ ...formData, presentingIssuesAtAdmission: e.target.value })
              }
              disabled={readOnly}
              placeholder="Describe the issues at the time of admission"
              rows={3}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="treatmentSummary">Treatment Goals Addressed</Label>
            <Textarea
              id="treatmentSummary"
              value={formData.treatmentSummary}
              onChange={(e) =>
                setFormData({ ...formData, treatmentSummary: e.target.value })
              }
              disabled={readOnly}
              placeholder="Summary of treatment goals and how they were addressed during stay"
              rows={4}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="dischargeSummaryNarrative">Discharge Summary Narrative</Label>
            <Textarea
              id="dischargeSummaryNarrative"
              value={formData.dischargeSummaryNarrative}
              onChange={(e) =>
                setFormData({ ...formData, dischargeSummaryNarrative: e.target.value })
              }
              disabled={readOnly}
              placeholder="Provide a narrative summary of the resident's stay and progress"
              rows={5}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="clinicalRecommendations">Clinical Recommendations</Label>
            <Textarea
              id="clinicalRecommendations"
              value={formData.clinicalRecommendations}
              onChange={(e) =>
                setFormData({ ...formData, clinicalRecommendations: e.target.value })
              }
              disabled={readOnly}
              placeholder="Clinical recommendations for ongoing care"
              rows={3}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Relapse Prevention & Crisis Planning */}
      <Card>
        <CardHeader>
          <CardTitle>Relapse Prevention & Crisis Planning</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="relapsePreventionPlan">Relapse Prevention Plan</Label>
            <Textarea
              id="relapsePreventionPlan"
              value={formData.relapsePreventionPlan}
              onChange={(e) =>
                setFormData({ ...formData, relapsePreventionPlan: e.target.value })
              }
              disabled={readOnly}
              placeholder="Describe the relapse prevention strategies and plan"
              rows={4}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="crisisResources">Crisis Resources</Label>
            <Textarea
              id="crisisResources"
              value={formData.crisisResources}
              onChange={(e) =>
                setFormData({ ...formData, crisisResources: e.target.value })
              }
              disabled={readOnly}
              placeholder="Crisis hotlines, emergency contacts, and resources provided to resident"
              rows={3}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patient Education */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Education</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="patientEducationProvided">Patient Education Provided</Label>
            <Textarea
              id="patientEducationProvided"
              value={formData.patientEducationProvided}
              onChange={(e) =>
                setFormData({ ...formData, patientEducationProvided: e.target.value })
              }
              disabled={readOnly}
              placeholder="Education provided to resident regarding their condition and care"
              rows={3}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="specialInstructions">Special Instructions</Label>
            <Textarea
              id="specialInstructions"
              value={formData.specialInstructions}
              onChange={(e) =>
                setFormData({ ...formData, specialInstructions: e.target.value })
              }
              disabled={readOnly}
              placeholder="Any special instructions for the resident upon discharge"
              rows={3}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Objectives Attained */}
      <Card>
        <CardHeader>
          <CardTitle>Objectives Attained</CardTitle>
          <CardDescription>Track treatment objectives and their attainment status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.objectivesAttained.map((obj, index) => (
            <div key={index} className="flex gap-4 items-start">
              <div className="flex-1">
                <Input
                  value={obj.objective}
                  onChange={(e) => updateObjective(index, "objective", e.target.value)}
                  disabled={readOnly}
                  placeholder="Enter objective"
                />
              </div>
              <div className="w-48">
                <Select
                  value={obj.attained}
                  onValueChange={(value) => updateObjective(index, "attained", value)}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fully Attained">Fully Attained</SelectItem>
                    <SelectItem value="Partially Attained">Partially Attained</SelectItem>
                    <SelectItem value="Not Attained">Not Attained</SelectItem>
                    <SelectItem value="N/A">N/A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!readOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeObjective(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {!readOnly && (
            <Button type="button" variant="outline" onClick={addObjective}>
              <Plus className="h-4 w-4 mr-2" /> Add Objective
            </Button>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <Label>Fully Attained Narrative</Label>
              <Textarea
                value={formData.objectiveNarratives.fullyAttained || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    objectiveNarratives: {
                      ...formData.objectiveNarratives,
                      fullyAttained: e.target.value,
                    },
                  })
                }
                disabled={readOnly}
                placeholder="Describe fully attained objectives"
                rows={3}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Partially Attained Narrative</Label>
              <Textarea
                value={formData.objectiveNarratives.partiallyAttained || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    objectiveNarratives: {
                      ...formData.objectiveNarratives,
                      partiallyAttained: e.target.value,
                    },
                  })
                }
                disabled={readOnly}
                placeholder="Describe partially attained objectives"
                rows={3}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Not Attained Narrative</Label>
              <Textarea
                value={formData.objectiveNarratives.notAttained || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    objectiveNarratives: {
                      ...formData.objectiveNarratives,
                      notAttained: e.target.value,
                    },
                  })
                }
                disabled={readOnly}
                placeholder="Describe not attained objectives"
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completed Services */}
      <Card>
        <CardHeader>
          <CardTitle>Completed Services</CardTitle>
          <CardDescription>Select all services that were provided</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {COMPLETED_SERVICES.map((service) => (
              <div key={service} className="flex items-center">
                <Checkbox
                  id={`service-${service}`}
                  checked={formData.completedServices.includes(service)}
                  onCheckedChange={() => toggleService(service)}
                  disabled={readOnly}
                />
                <Label
                  htmlFor={`service-${service}`}
                  className="ml-2 font-normal cursor-pointer"
                >
                  {service}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Personal Items */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="personalItemsReceived"
              checked={formData.personalItemsReceived}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, personalItemsReceived: !!checked })
              }
              disabled={readOnly}
            />
            <Label htmlFor="personalItemsReceived">Personal items received by client</Label>
          </div>

          {!formData.personalItemsReceived && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="personalItemsStoredDays">Days Items Stored</Label>
                  <Input
                    id="personalItemsStoredDays"
                    type="number"
                    min="0"
                    value={formData.personalItemsStoredDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personalItemsStoredDays: parseInt(e.target.value) || 0,
                      })
                    }
                    disabled={readOnly}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="itemsRemainAtFacility"
                  checked={formData.itemsRemainAtFacility}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, itemsRemainAtFacility: !!checked })
                  }
                  disabled={readOnly}
                />
                <Label htmlFor="itemsRemainAtFacility">Items remain at facility</Label>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Discharge Medications */}
      <Card>
        <CardHeader>
          <CardTitle>Discharge Medications</CardTitle>
          <CardDescription>List medications prescribed at discharge</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.dischargeMedications.map((med, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <Label>Medication</Label>
                <Input
                  value={med.medication}
                  onChange={(e) => updateMedication(index, "medication", e.target.value)}
                  disabled={readOnly}
                  placeholder="Medication name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Dosage</Label>
                <Input
                  value={med.dosage}
                  onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                  disabled={readOnly}
                  placeholder="Dosage"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Frequency</Label>
                <Input
                  value={med.frequency}
                  onChange={(e) => updateMedication(index, "frequency", e.target.value)}
                  disabled={readOnly}
                  placeholder="Frequency"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Prescriber</Label>
                <Input
                  value={med.prescriber}
                  onChange={(e) => updateMedication(index, "prescriber", e.target.value)}
                  disabled={readOnly}
                  placeholder="Prescriber"
                  className="mt-1"
                />
              </div>
              {!readOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMedication(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {!readOnly && (
            <Button type="button" variant="outline" onClick={addMedication}>
              <Plus className="h-4 w-4 mr-2" /> Add Medication
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Service Referrals */}
      <Card>
        <CardHeader>
          <CardTitle>Service Referrals</CardTitle>
          <CardDescription>List referrals for follow-up services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.serviceReferrals.map((referral, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Service</Label>
                  <Input
                    value={referral.service}
                    onChange={(e) => updateReferral(index, "service", e.target.value)}
                    disabled={readOnly}
                    placeholder="Service type"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Provider</Label>
                  <Input
                    value={referral.provider}
                    onChange={(e) => updateReferral(index, "provider", e.target.value)}
                    disabled={readOnly}
                    placeholder="Provider name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={referral.phone}
                    onChange={(e) => updateReferral(index, "phone", e.target.value)}
                    disabled={readOnly}
                    placeholder="Phone number"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Appointment Date</Label>
                  <Input
                    type="date"
                    value={referral.appointmentDate}
                    onChange={(e) => updateReferral(index, "appointmentDate", e.target.value)}
                    disabled={readOnly}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <Textarea
                  value={referral.address}
                  onChange={(e) => updateReferral(index, "address", e.target.value)}
                  disabled={readOnly}
                  placeholder="Provider address"
                  rows={2}
                  className="mt-1"
                />
              </div>
              {!readOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeReferral(index)}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Remove Referral
                </Button>
              )}
            </div>
          ))}
          {!readOnly && (
            <Button type="button" variant="outline" onClick={addReferral}>
              <Plus className="h-4 w-4 mr-2" /> Add Referral
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="culturalPreferencesConsidered"
              checked={formData.culturalPreferencesConsidered}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, culturalPreferencesConsidered: !!checked })
              }
              disabled={readOnly}
            />
            <Label htmlFor="culturalPreferencesConsidered">
              Cultural preferences considered in discharge planning
            </Label>
          </div>

          <div>
            <Label htmlFor="suicidePreventionEducation">Suicide Prevention Education</Label>
            <Textarea
              id="suicidePreventionEducation"
              value={formData.suicidePreventionEducation}
              onChange={(e) =>
                setFormData({ ...formData, suicidePreventionEducation: e.target.value })
              }
              disabled={readOnly}
              placeholder="Document suicide prevention education provided"
              rows={3}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Signatures */}
      <Card>
        <CardHeader>
          <CardTitle>Signatures</CardTitle>
          <CardDescription>Electronic signatures for discharge completion</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium">Client Signature</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientSignature">Client/Guardian Signature (Type Name)</Label>
                <Input
                  id="clientSignature"
                  value={formData.clientSignature}
                  onChange={(e) =>
                    setFormData({ ...formData, clientSignature: e.target.value })
                  }
                  disabled={readOnly}
                  placeholder="Type client or guardian full name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="clientSignatureDate">Date</Label>
                <Input
                  id="clientSignatureDate"
                  type="date"
                  value={formData.clientSignatureDate}
                  onChange={(e) =>
                    setFormData({ ...formData, clientSignatureDate: e.target.value })
                  }
                  disabled={readOnly}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Staff Signature</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="staffSignature">Staff Signature (Type Name)</Label>
                <Input
                  id="staffSignature"
                  value={formData.staffSignature}
                  onChange={(e) =>
                    setFormData({ ...formData, staffSignature: e.target.value })
                  }
                  disabled={readOnly}
                  placeholder="Type staff full name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="staffCredentials">Credentials</Label>
                <Input
                  id="staffCredentials"
                  value={formData.staffCredentials}
                  onChange={(e) =>
                    setFormData({ ...formData, staffCredentials: e.target.value })
                  }
                  disabled={readOnly}
                  placeholder="e.g., RN, LPC"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="staffSignatureDate">Date</Label>
                <Input
                  id="staffSignatureDate"
                  type="date"
                  value={formData.staffSignatureDate}
                  onChange={(e) =>
                    setFormData({ ...formData, staffSignatureDate: e.target.value })
                  }
                  disabled={readOnly}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Clinical Oversight / BHP Reviewer</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="reviewerSignature">Reviewer Signature (Type Name)</Label>
                <Input
                  id="reviewerSignature"
                  value={formData.reviewerSignature}
                  onChange={(e) =>
                    setFormData({ ...formData, reviewerSignature: e.target.value })
                  }
                  disabled={readOnly}
                  placeholder="To be completed by BHP reviewer"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="reviewerCredentials">Credentials</Label>
                <Input
                  id="reviewerCredentials"
                  value={formData.reviewerCredentials}
                  onChange={(e) =>
                    setFormData({ ...formData, reviewerCredentials: e.target.value })
                  }
                  disabled={readOnly}
                  placeholder="e.g., LCSW, PhD"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="reviewerSignatureDate">Date</Label>
                <Input
                  id="reviewerSignatureDate"
                  type="date"
                  value={formData.reviewerSignatureDate}
                  onChange={(e) =>
                    setFormData({ ...formData, reviewerSignatureDate: e.target.value })
                  }
                  disabled={readOnly}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {!readOnly && (
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/facility/residents/${resident.id}`)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={isSavingDraft || isLoading}
            onClick={(e) => handleSubmit(e, true)}
          >
            {isSavingDraft ? "Saving..." : "Save Draft"}
          </Button>
          <Button type="submit" disabled={isLoading || isSavingDraft}>
            {isLoading ? "Submitting..." : "Submit"}
          </Button>
        </div>
      )}
    </form>
  );
}
