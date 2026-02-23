"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  incidentReportDraftSchema,
  IncidentReportDraftInput,
  INCIDENT_TYPES,
  INTERVENTION_TYPES,
  NOTIFICATION_ENTITIES,
  SUPERVISION_LEVELS,
  FOLLOW_UP_TYPES,
} from "@/lib/validations";

interface Resident {
  id: string;
  residentName: string;
  dateOfBirth: string;
  admissionDate: string | null;
  policyNumber: string | null;
}

interface IncidentReportFormProps {
  reportId?: string;
  initialData?: IncidentReportDraftInput & { id?: string; intakeId?: string | null };
}

export function IncidentReportForm({ reportId, initialData }: IncidentReportFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);

  const form = useForm<IncidentReportDraftInput>({
    resolver: zodResolver(incidentReportDraftSchema),
    defaultValues: {
      intakeId: initialData?.intakeId || undefined,
      incidentDate: initialData?.incidentDate || format(new Date(), "yyyy-MM-dd"),
      incidentTime: initialData?.incidentTime || "",
      incidentLocation: initialData?.incidentLocation || "",
      reportCompletedBy: initialData?.reportCompletedBy || "",
      reporterTitle: initialData?.reporterTitle || "",
      residentName: initialData?.residentName || "",
      residentDOB: initialData?.residentDOB || "",
      residentAdmissionDate: initialData?.residentAdmissionDate || "",
      residentAhcccsId: initialData?.residentAhcccsId || "",
      incidentTypes: initialData?.incidentTypes || [],
      otherIncidentType: initialData?.otherIncidentType || "",
      incidentDescription: initialData?.incidentDescription || "",
      residentsInvolved: initialData?.residentsInvolved || [],
      staffInvolved: initialData?.staffInvolved || [],
      witnesses: initialData?.witnesses || [],
      anyInjuries: initialData?.anyInjuries || false,
      injuryDescription: initialData?.injuryDescription || "",
      medicalAttentionRequired: initialData?.medicalAttentionRequired || false,
      treatmentProvided: initialData?.treatmentProvided || "",
      was911Called: initialData?.was911Called || false,
      wasTransportedToHospital: initialData?.wasTransportedToHospital || false,
      hospitalName: initialData?.hospitalName || "",
      interventionsUsed: initialData?.interventionsUsed || [],
      otherIntervention: initialData?.otherIntervention || "",
      actionsDescription: initialData?.actionsDescription || "",
      notifications: initialData?.notifications || [],
      residentCurrentCondition: initialData?.residentCurrentCondition || "",
      residentStatement: initialData?.residentStatement || "",
      currentSupervisionLevel: initialData?.currentSupervisionLevel || "",
      otherSupervisionLevel: initialData?.otherSupervisionLevel || "",
      followUpRequired: initialData?.followUpRequired || [],
      otherFollowUp: initialData?.otherFollowUp || "",
      followUpActionsTimeline: initialData?.followUpActionsTimeline || "",
      // Signatures
      staffSignatureName: initialData?.staffSignatureName || "",
      staffSignatureDate: initialData?.staffSignatureDate || "",
      adminSignatureName: initialData?.adminSignatureName || "",
      adminSignatureDate: initialData?.adminSignatureDate || "",
      bhpSignatureName: initialData?.bhpSignatureName || "",
      bhpSignatureDate: initialData?.bhpSignatureDate || "",
    },
  });

  // Fetch residents for the resident selector
  useEffect(() => {
    async function fetchResidents() {
      try {
        const response = await fetch("/api/intakes?status=APPROVED");
        if (response.ok) {
          const data = await response.json();
          const intakesList = data.intakes || [];
          setResidents(intakesList);

          // If we have initial data with intakeId, find and set the selected resident
          if (initialData?.intakeId) {
            const resident = intakesList.find((r: Resident) => r.id === initialData.intakeId);
            if (resident) {
              setSelectedResident(resident);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch residents:", error);
      }
    }
    fetchResidents();
  }, [initialData?.intakeId]);

  // When a resident is selected, prefill resident info
  const handleResidentSelect = (residentId: string) => {
    if (residentId === "none") {
      setSelectedResident(null);
      form.setValue("intakeId", undefined);
      form.setValue("residentName", "");
      form.setValue("residentDOB", "");
      form.setValue("residentAdmissionDate", "");
      form.setValue("residentAhcccsId", "");
      return;
    }

    const resident = residents.find((r) => r.id === residentId);
    if (resident) {
      setSelectedResident(resident);
      form.setValue("intakeId", resident.id);
      form.setValue("residentName", resident.residentName);
      form.setValue("residentDOB", resident.dateOfBirth ? format(new Date(resident.dateOfBirth), "yyyy-MM-dd") : "");
      form.setValue("residentAdmissionDate", resident.admissionDate ? format(new Date(resident.admissionDate), "yyyy-MM-dd") : "");
      form.setValue("residentAhcccsId", resident.policyNumber || "");
    }
  };

  const onSubmit = async (data: IncidentReportDraftInput, isDraft: boolean) => {
    setIsLoading(true);
    try {
      const url = reportId
        ? `/api/incident-reports/${reportId}`
        : "/api/incident-reports";
      const method = reportId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, status: isDraft ? "DRAFT" : "PENDING" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save report");
      }

      toast({
        title: isDraft ? "Draft saved" : "Report submitted",
        description: isDraft
          ? "Your incident report draft has been saved."
          : "Your incident report has been submitted for review.",
      });

      router.push("/facility/incident-reports");
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save report",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add/remove handlers for dynamic arrays
  const addResidentInvolved = () => {
    const current = form.getValues("residentsInvolved") || [];
    form.setValue("residentsInvolved", [...current, { name: "", dob: "", roleInIncident: "" }]);
  };

  const removeResidentInvolved = (index: number) => {
    const current = form.getValues("residentsInvolved") || [];
    form.setValue("residentsInvolved", current.filter((_, i) => i !== index));
  };

  const addStaffInvolved = () => {
    const current = form.getValues("staffInvolved") || [];
    form.setValue("staffInvolved", [...current, { name: "", title: "", roleInIncident: "" }]);
  };

  const removeStaffInvolved = (index: number) => {
    const current = form.getValues("staffInvolved") || [];
    form.setValue("staffInvolved", current.filter((_, i) => i !== index));
  };

  const addWitness = () => {
    const current = form.getValues("witnesses") || [];
    form.setValue("witnesses", [...current, { name: "", titleOrRelationship: "", contactInfo: "" }]);
  };

  const removeWitness = (index: number) => {
    const current = form.getValues("witnesses") || [];
    form.setValue("witnesses", current.filter((_, i) => i !== index));
  };

  const addNotification = () => {
    const current = form.getValues("notifications") || [];
    form.setValue("notifications", [...current, { personEntity: "", name: "", dateTime: "", method: "", notifiedBy: "" }]);
  };

  const removeNotification = (index: number) => {
    const current = form.getValues("notifications") || [];
    form.setValue("notifications", current.filter((_, i) => i !== index));
  };

  const watchIncidentTypes = form.watch("incidentTypes") || [];
  const watchInterventions = form.watch("interventionsUsed") || [];
  const watchFollowUps = form.watch("followUpRequired") || [];
  const watchAnyInjuries = form.watch("anyInjuries");
  const watchMedicalAttention = form.watch("medicalAttentionRequired");
  const watchTransported = form.watch("wasTransportedToHospital");
  const watchSupervision = form.watch("currentSupervisionLevel");

  return (
    <Form {...form}>
      <form className="space-y-6">
        {/* Resident Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Resident Information</CardTitle>
            <CardDescription>
              Select an existing resident or enter information manually
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Resident (Optional)</label>
              <Select
                value={selectedResident?.id || "none"}
                onValueChange={handleResidentSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a resident or enter manually" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Enter manually</SelectItem>
                  {residents.map((resident) => (
                    <SelectItem key={resident.id} value={resident.id}>
                      {resident.residentName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="residentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resident Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        disabled={!!selectedResident}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="residentDOB"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ""}
                        disabled={!!selectedResident}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="residentAdmissionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admission Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ""}
                        disabled={!!selectedResident}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="residentAhcccsId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>AHCCCS ID</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        disabled={!!selectedResident}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Incident Information */}
        <Card>
          <CardHeader>
            <CardTitle>Incident Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="incidentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Incident *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="incidentTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time of Incident *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="incidentLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location of Incident *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Common area, Bedroom" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reportCompletedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Completed By *</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reporterTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title/Position</FormLabel>
                    <FormControl>
                      <Input placeholder="Your title" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Incident Type */}
        <Card>
          <CardHeader>
            <CardTitle>Incident Type</CardTitle>
            <CardDescription>Check all that apply</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {INCIDENT_TYPES.map((type) => (
                <div key={type.code} className="flex items-center space-x-2">
                  <Checkbox
                    id={`incident-${type.code}`}
                    checked={watchIncidentTypes.includes(type.code)}
                    onCheckedChange={(checked) => {
                      const current = form.getValues("incidentTypes") || [];
                      if (checked) {
                        form.setValue("incidentTypes", [...current, type.code]);
                      } else {
                        form.setValue(
                          "incidentTypes",
                          current.filter((t) => t !== type.code)
                        );
                      }
                    }}
                  />
                  <label
                    htmlFor={`incident-${type.code}`}
                    className="text-sm leading-none cursor-pointer"
                  >
                    {type.label}
                  </label>
                </div>
              ))}
            </div>

            {watchIncidentTypes.includes("OTHER") && (
              <FormField
                control={form.control}
                name="otherIncidentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Other Incident Type</FormLabel>
                    <FormControl>
                      <Input placeholder="Describe the incident type" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Incident Description */}
        <Card>
          <CardHeader>
            <CardTitle>Incident Description</CardTitle>
            <CardDescription>
              Describe what happened (include events leading up to incident, what occurred, and immediate aftermath)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="incidentDescription"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Provide a detailed description of the incident..."
                      className="min-h-[150px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Persons Involved */}
        <Card>
          <CardHeader>
            <CardTitle>Persons Involved</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Residents Involved */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Residents Involved</h4>
                <Button type="button" variant="outline" size="sm" onClick={addResidentInvolved}>
                  <Plus className="h-4 w-4 mr-1" /> Add Resident
                </Button>
              </div>
              {(form.watch("residentsInvolved") || []).map((_, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end border p-3 rounded">
                  <FormField
                    control={form.control}
                    name={`residentsInvolved.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`residentsInvolved.${index}.dob`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>DOB</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`residentsInvolved.${index}.roleInIncident`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role in Incident</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeResidentInvolved(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Staff Involved */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Staff Involved</h4>
                <Button type="button" variant="outline" size="sm" onClick={addStaffInvolved}>
                  <Plus className="h-4 w-4 mr-1" /> Add Staff
                </Button>
              </div>
              {(form.watch("staffInvolved") || []).map((_, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end border p-3 rounded">
                  <FormField
                    control={form.control}
                    name={`staffInvolved.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`staffInvolved.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`staffInvolved.${index}.roleInIncident`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role in Incident</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStaffInvolved(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Witnesses */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Witnesses</h4>
                <Button type="button" variant="outline" size="sm" onClick={addWitness}>
                  <Plus className="h-4 w-4 mr-1" /> Add Witness
                </Button>
              </div>
              {(form.watch("witnesses") || []).map((_, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end border p-3 rounded">
                  <FormField
                    control={form.control}
                    name={`witnesses.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`witnesses.${index}.titleOrRelationship`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title/Relationship</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`witnesses.${index}.contactInfo`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Info</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeWitness(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Injuries */}
        <Card>
          <CardHeader>
            <CardTitle>Injuries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="anyInjuries"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Were there any injuries?</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="medicalAttentionRequired"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Medical attention required?</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="was911Called"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Was 911 called?</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="wasTransportedToHospital"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Was resident transported to hospital?</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {watchAnyInjuries && (
              <FormField
                control={form.control}
                name="injuryDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Describe injuries and persons injured</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {watchMedicalAttention && (
              <FormField
                control={form.control}
                name="treatmentProvided"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Describe treatment provided</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {watchTransported && (
              <FormField
                control={form.control}
                name="hospitalName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hospital Name</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Interventions */}
        <Card>
          <CardHeader>
            <CardTitle>Interventions and Actions Taken</CardTitle>
            <CardDescription>Check all immediate interventions used</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {INTERVENTION_TYPES.map((type) => (
                <div key={type.code} className="flex items-center space-x-2">
                  <Checkbox
                    id={`intervention-${type.code}`}
                    checked={watchInterventions.includes(type.code)}
                    onCheckedChange={(checked) => {
                      const current = form.getValues("interventionsUsed") || [];
                      if (checked) {
                        form.setValue("interventionsUsed", [...current, type.code]);
                      } else {
                        form.setValue(
                          "interventionsUsed",
                          current.filter((t) => t !== type.code)
                        );
                      }
                    }}
                  />
                  <label
                    htmlFor={`intervention-${type.code}`}
                    className="text-sm leading-none cursor-pointer"
                  >
                    {type.label}
                  </label>
                </div>
              ))}
            </div>

            {watchInterventions.includes("OTHER") && (
              <FormField
                control={form.control}
                name="otherIntervention"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Other Intervention</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="actionsDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Describe actions taken to address the incident</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Record who was notified about this incident</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button type="button" variant="outline" size="sm" onClick={addNotification}>
              <Plus className="h-4 w-4 mr-1" /> Add Notification
            </Button>
            {(form.watch("notifications") || []).map((_, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end border p-3 rounded">
                <FormField
                  control={form.control}
                  name={`notifications.${index}.personEntity`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Person/Entity</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {NOTIFICATION_ENTITIES.map((entity) => (
                            <SelectItem key={entity} value={entity}>
                              {entity}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`notifications.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`notifications.${index}.dateTime`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date/Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} value={field.value || ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`notifications.${index}.method`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Method</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone, Email, etc." {...field} value={field.value || ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`notifications.${index}.notifiedBy`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notified By</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeNotification(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Resident Status Post-Incident */}
        <Card>
          <CardHeader>
            <CardTitle>Resident Status Post-Incident</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="residentCurrentCondition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resident&apos;s current condition</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="residentStatement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resident&apos;s statement regarding incident (if applicable)</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currentSupervisionLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Supervision Level</FormLabel>
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select supervision level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SUPERVISION_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchSupervision === "Other" && (
              <FormField
                control={form.control}
                name="otherSupervisionLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Other Supervision Level</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Follow-Up Required */}
        <Card>
          <CardHeader>
            <CardTitle>Follow-Up Required</CardTitle>
            <CardDescription>Check all that apply</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FOLLOW_UP_TYPES.map((type) => (
                <div key={type.code} className="flex items-center space-x-2">
                  <Checkbox
                    id={`followup-${type.code}`}
                    checked={watchFollowUps.includes(type.code)}
                    onCheckedChange={(checked) => {
                      const current = form.getValues("followUpRequired") || [];
                      if (checked) {
                        form.setValue("followUpRequired", [...current, type.code]);
                      } else {
                        form.setValue(
                          "followUpRequired",
                          current.filter((t) => t !== type.code)
                        );
                      }
                    }}
                  />
                  <label
                    htmlFor={`followup-${type.code}`}
                    className="text-sm leading-none cursor-pointer"
                  >
                    {type.label}
                  </label>
                </div>
              ))}
            </div>

            {watchFollowUps.includes("OTHER") && (
              <FormField
                control={form.control}
                name="otherFollowUp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Other Follow-Up</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="followUpActionsTimeline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Follow-up actions and timeline</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Signatures */}
        <Card>
          <CardHeader>
            <CardTitle>Signatures</CardTitle>
            <CardDescription>
              Enter the names and dates for each signatory. Signatures will be collected on the printed form.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Staff Signature */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Staff/Report Completed By</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="staffSignatureName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Printed Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Staff member name" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="staffSignatureDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Administrator Signature */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Administrator/Director Review</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="adminSignatureName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Printed Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Administrator name" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="adminSignatureDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* BHP Signature */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">BHP</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bhpSignatureName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Printed Name</FormLabel>
                      <FormControl>
                        <Input placeholder="BHP name" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bhpSignatureDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={form.handleSubmit((data) => onSubmit(data, true))}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Draft
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit((data) => onSubmit(data, false))}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Report
          </Button>
        </div>
      </form>
    </Form>
  );
}
