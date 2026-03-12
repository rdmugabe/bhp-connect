"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { medicationOrderSchema, type MedicationOrderInput } from "@/lib/validations";
import { ROUTE_LABELS, DOSAGE_FORMS, CONTROLLED_SCHEDULES, getFrequencyLabel } from "@/lib/emar";
import { AlertTriangle, Plus, X } from "lucide-react";

interface MedicationOrderFormProps {
  intakeId: string;
  patientName: string;
  patientAllergies?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const FREQUENCIES = [
  { value: "ONCE", label: "Once" },
  { value: "DAILY", label: "Once daily" },
  { value: "BID", label: "Twice daily (BID)" },
  { value: "TID", label: "Three times daily (TID)" },
  { value: "QID", label: "Four times daily (QID)" },
  { value: "Q4H", label: "Every 4 hours" },
  { value: "Q6H", label: "Every 6 hours" },
  { value: "Q8H", label: "Every 8 hours" },
  { value: "Q12H", label: "Every 12 hours" },
  { value: "QHS", label: "At bedtime" },
  { value: "QAM", label: "In the morning" },
  { value: "PRN", label: "As needed (PRN)" },
  { value: "WEEKLY", label: "Once weekly" },
  { value: "CUSTOM", label: "Custom schedule" },
];

const ROUTES = Object.entries(ROUTE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function MedicationOrderForm({
  intakeId,
  patientName,
  patientAllergies,
  onSuccess,
  onCancel,
}: MedicationOrderFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [allergyWarning, setAllergyWarning] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [customTimes, setCustomTimes] = useState<string[]>([]);

  const form = useForm<MedicationOrderInput>({
    resolver: zodResolver(medicationOrderSchema) as any,
    defaultValues: {
      intakeId,
      medicationName: "",
      genericName: "",
      strength: "",
      dosageForm: "",
      dose: "",
      route: "PO",
      frequency: "DAILY",
      customFrequency: "",
      scheduleTimes: [],
      isPRN: false,
      prnReason: "",
      prnMinIntervalHours: undefined,
      prnMaxDailyDoses: undefined,
      prescriberName: "",
      prescriberNPI: "",
      prescriberPhone: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      instructions: "",
      administrationNotes: "",
      pharmacyName: "",
      pharmacyPhone: "",
      rxNumber: "",
      isControlled: false,
      controlSchedule: "",
    },
  });

  const watchFrequency = form.watch("frequency");
  const watchIsPRN = form.watch("isPRN");
  const watchIsControlled = form.watch("isControlled");

  const addCustomTime = () => {
    setCustomTimes([...customTimes, "09:00"]);
    form.setValue("scheduleTimes", [...customTimes, "09:00"]);
  };

  const removeCustomTime = (index: number) => {
    const newTimes = customTimes.filter((_, i) => i !== index);
    setCustomTimes(newTimes);
    form.setValue("scheduleTimes", newTimes);
  };

  const updateCustomTime = (index: number, value: string) => {
    const newTimes = [...customTimes];
    newTimes[index] = value;
    setCustomTimes(newTimes);
    form.setValue("scheduleTimes", newTimes);
  };

  const onSubmit = async (data: MedicationOrderInput) => {
    setLoading(true);
    setAllergyWarning(null);
    setDuplicateWarning(null);

    try {
      const response = await fetch("/api/emar/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          scheduleTimes: watchFrequency === "CUSTOM" ? customTimes : undefined,
        }),
      });

      const result = await response.json();

      if (response.status === 409) {
        // Warning response (allergy or duplicate)
        if (result.warning) {
          if (result.error === "Allergy warning") {
            setAllergyWarning(result.warning);
          } else if (result.error === "Duplicate medication warning") {
            setDuplicateWarning(result.warning);
          }
        }
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(result.error || "Failed to create medication order");
      }

      toast({
        title: "Medication Order Created",
        description: `${data.medicationName} has been added for ${patientName}`,
      });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/facility/emar/patients/${intakeId}`);
      }
    } catch (error) {
      console.error("Error creating medication order:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create medication order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Patient Info Banner */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Patient</p>
                <p className="font-semibold text-blue-900">{patientName}</p>
              </div>
              {patientAllergies && (
                <div className="flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">Allergies: {patientAllergies}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Warnings */}
        {allergyWarning && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Allergy Warning:</strong> {allergyWarning}
            </AlertDescription>
          </Alert>
        )}

        {duplicateWarning && (
          <Alert className="bg-yellow-50 border-yellow-400">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Duplicate Warning:</strong> {duplicateWarning}
            </AlertDescription>
          </Alert>
        )}

        {/* Medication Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Medication Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="medicationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medication Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Lisinopril" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="genericName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Generic Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Lisinopril" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="strength"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Strength *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 10mg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dosageForm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dosage Form</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select form" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DOSAGE_FORMS.map((form) => (
                          <SelectItem key={form} value={form}>
                            {form}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Dosing Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dosing Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="dose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dose *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 1 tablet, 10mg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="route"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Route *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select route" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROUTES.map((route) => (
                          <SelectItem key={route.value} value={route.value}>
                            {route.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value === "PRN") {
                          form.setValue("isPRN", true);
                        } else {
                          form.setValue("isPRN", false);
                        }
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FREQUENCIES.map((freq) => (
                          <SelectItem key={freq.value} value={freq.value}>
                            {freq.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Custom Schedule Times */}
            {watchFrequency === "CUSTOM" && (
              <div className="space-y-3">
                <Label>Schedule Times</Label>
                {customTimes.map((time, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => updateCustomTime(index, e.target.value)}
                      className="w-32"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomTime(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addCustomTime}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Time
                </Button>
              </div>
            )}

            {/* PRN Options */}
            {watchIsPRN && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium">PRN Settings</h4>
                <FormField
                  control={form.control}
                  name="prnReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PRN Indication *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., For pain, For nausea" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="prnMinIntervalHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Hours Between Doses</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="e.g., 4"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="prnMaxDailyDoses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Daily Doses</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="e.g., 4"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prescriber Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prescriber Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="prescriberName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prescriber Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Dr. John Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prescriberNPI"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NPI</FormLabel>
                    <FormControl>
                      <Input placeholder="10 digit NPI" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prescriberPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 555-5555" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Dates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>Leave blank for ongoing order</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Take with food, Take 30 minutes before meals"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="administrationNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Administration Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notes for staff administering the medication"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Controlled Substance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Controlled Substance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="isControlled"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">This is a controlled substance</FormLabel>
                </FormItem>
              )}
            />

            {watchIsControlled && (
              <FormField
                control={form.control}
                name="controlSchedule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Control Schedule *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select schedule" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONTROLLED_SCHEDULES.map((schedule) => (
                          <SelectItem key={schedule.value} value={schedule.value}>
                            {schedule.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Controlled substances require witness verification during administration
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Pharmacy Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pharmacy Information (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="pharmacyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pharmacy Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Pharmacy name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pharmacyPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pharmacy Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 555-5555" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rxNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rx Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Prescription number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Medication Order"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
