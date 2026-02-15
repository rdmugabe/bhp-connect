"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  FormControl,
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
import { Plus, Trash2 } from "lucide-react";

const MEDICAL_CONDITIONS = [
  { key: "heartProblems", label: "Heart Problems" },
  { key: "seizureNeurological", label: "Seizure/Neurological" },
  { key: "muscleJointProblems", label: "Muscle/Joint Problems" },
  { key: "diabetes", label: "Diabetes" },
  { key: "highBloodPressure", label: "High Blood Pressure" },
  { key: "thyroidProblems", label: "Thyroid Problems" },
  { key: "visionProblems", label: "Vision Problems" },
  { key: "sleepProblems", label: "Sleep Problems" },
  { key: "highCholesterol", label: "High Cholesterol" },
  { key: "kidneyProblems", label: "Kidney Problems" },
  { key: "hearingProblems", label: "Hearing Problems" },
  { key: "chronicPain", label: "Chronic Pain" },
  { key: "bloodDisorder", label: "Blood Disorder" },
  { key: "liverProblems", label: "Liver Problems" },
  { key: "dentalProblems", label: "Dental Problems" },
  { key: "pregnant", label: "Pregnant" },
  { key: "stomachIntestinalProblems", label: "Stomach/Intestinal Problems" },
  { key: "asthmaLungProblems", label: "Asthma/Lung Problems" },
];

const SEVERITY_OPTIONS = [
  { value: "0", label: "0 - None" },
  { value: "1", label: "1 - Mild" },
  { value: "2", label: "2 - Moderate" },
  { value: "3", label: "3 - Severe" },
  { value: "4", label: "4 - Very Severe" },
];

export function Step3Biomedical() {
  const { control } = useFormContext();
  const { fields: providers, append: appendProvider, remove: removeProvider } = useFieldArray({
    control,
    name: "medicalProviders",
  });
  const { fields: medications, append: appendMedication, remove: removeMedication } = useFieldArray({
    control,
    name: "medicalMedications",
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dimension 2: Biomedical Conditions</CardTitle>
          <CardDescription>
            Biomedical Conditions and Complications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Medical Providers</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendProvider({
                    name: "",
                    specialty: "",
                    contact: "",
                  })
                }
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Provider
              </Button>
            </div>

            {providers.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                <FormField
                  control={control}
                  name={`medicalProviders.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Physician Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Name" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`medicalProviders.${index}.specialty`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialty</FormLabel>
                      <FormControl>
                        <Input placeholder="Specialty" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`medicalProviders.${index}.contact`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Information</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone/Email" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeProvider(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Medical Conditions</CardTitle>
          <CardDescription>Check any conditions that apply</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {MEDICAL_CONDITIONS.map((condition) => (
              <FormField
                key={condition.key}
                control={control}
                name={`medicalConditions.${condition.key}`}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal text-sm">
                      {condition.label}
                    </FormLabel>
                  </FormItem>
                )}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <FormField
              control={control}
              name="medicalConditions.std"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sexually Transmitted Disease(s)</FormLabel>
                  <FormControl>
                    <Input placeholder="Specify if any" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="medicalConditions.cancer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cancer (specify type)</FormLabel>
                  <FormControl>
                    <Input placeholder="Specify if any" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="medicalConditions.infections"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Infections</FormLabel>
                  <FormControl>
                    <Input placeholder="Specify if any" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="medicalConditions.allergies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allergies</FormLabel>
                  <FormControl>
                    <Input placeholder="List allergies" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={control}
            name="conditionsInterfere"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Do any of these conditions significantly interfere with your life?
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="conditionsInterfereDetails"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea placeholder="Please describe..." className="min-h-[60px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="priorHospitalizations"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prior Hospitalizations</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Provide additional comments on medical conditions, prior hospitalizations (include dates and reasons)..."
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="lifeThreatening"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 bg-red-50 rounded-lg">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-red-700">
                    Does the patient report medical symptoms that would be considered life-threatening or require immediate medical attention?
                  </FormLabel>
                  <p className="text-sm text-red-600">
                    * If yes, consider immediate referral to emergency room or call 911
                  </p>
                </div>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Medical Medications</CardTitle>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendMedication({
                  medication: "",
                  dose: "",
                  reason: "",
                  effectiveness: "",
                })
              }
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Medication
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {medications.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
              <FormField
                control={control}
                name={`medicalMedications.${index}.medication`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medication</FormLabel>
                    <FormControl>
                      <Input placeholder="Name" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`medicalMedications.${index}.dose`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dose/Frequency</FormLabel>
                    <FormControl>
                      <Input placeholder="Dose" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`medicalMedications.${index}.reason`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Input placeholder="Reason" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`medicalMedications.${index}.effectiveness`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effectiveness/Side Effects</FormLabel>
                    <FormControl>
                      <Input placeholder="Effectiveness" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMedication(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dimension 2 Severity Rating</CardTitle>
          <CardDescription>
            Rate the severity of Biomedical Conditions and Complications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="dimension2Severity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Severity Rating</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity rating" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SEVERITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="dimension2Comments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Comments</FormLabel>
                <FormControl>
                  <Textarea placeholder="Additional comments for Dimension 2..." className="min-h-[80px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
