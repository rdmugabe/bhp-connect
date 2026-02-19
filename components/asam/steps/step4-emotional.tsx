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

const MOOD_SYMPTOMS = [
  { key: "depression", label: "Depression/Sadness" },
  { key: "lossOfPleasure", label: "Loss of Pleasure/Interest" },
  { key: "hopelessness", label: "Hopelessness" },
  { key: "irritability", label: "Irritability/Anger" },
  { key: "impulsivity", label: "Impulsivity" },
  { key: "pressuredSpeech", label: "Pressured Speech" },
  { key: "grandiosity", label: "Grandiosity" },
  { key: "racingThoughts", label: "Racing Thoughts" },
];

const ANXIETY_SYMPTOMS = [
  { key: "anxiety", label: "Anxiety/Excessive Worry" },
  { key: "obsessiveThoughts", label: "Obsessive Thoughts" },
  { key: "compulsiveBehaviors", label: "Compulsive Behaviors" },
  { key: "flashbacks", label: "Flashbacks" },
];

const OTHER_SYMPTOMS = [
  { key: "sleepProblems", label: "Sleep Problems" },
  { key: "memoryConcentration", label: "Memory/Concentration" },
  { key: "gambling", label: "Gambling" },
  { key: "riskySexBehaviors", label: "Risky Sex Behaviors" },
];

const SEVERITY_OPTIONS = [
  { value: "0", label: "0 - None" },
  { value: "1", label: "1 - Mild" },
  { value: "2", label: "2 - Moderate" },
  { value: "3", label: "3 - Severe" },
  { value: "4", label: "4 - Very Severe" },
];

export function Step4Emotional() {
  const { control } = useFormContext();
  const { fields: medications, append: appendMedication, remove: removeMedication } = useFieldArray({
    control,
    name: "psychiatricMedications",
  });
  const { fields: providers, append: appendProvider, remove: removeProvider } = useFieldArray({
    control,
    name: "mentalHealthProviders",
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dimension 3: Emotional, Behavioral, or Cognitive Conditions</CardTitle>
          <CardDescription>
            Emotional, Behavioral, or Cognitive Conditions and Complications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium mb-3">Mood Symptoms</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {MOOD_SYMPTOMS.map((symptom) => (
                <FormField
                  key={symptom.key}
                  control={control}
                  name={`moodSymptoms.${symptom.key}`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value === true}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                        />
                      </FormControl>
                      <FormLabel className="font-normal text-sm">
                        {symptom.label}
                      </FormLabel>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Anxiety Symptoms</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {ANXIETY_SYMPTOMS.map((symptom) => (
                <FormField
                  key={symptom.key}
                  control={control}
                  name={`anxietySymptoms.${symptom.key}`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value === true}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                        />
                      </FormControl>
                      <FormLabel className="font-normal text-sm">
                        {symptom.label}
                      </FormLabel>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Psychosis</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={control}
                name="psychosisSymptoms.paranoia"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value === true}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                    </FormControl>
                    <FormLabel className="font-normal text-sm">Paranoia</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="psychosisSymptoms.delusions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delusions</FormLabel>
                    <FormControl>
                      <Input placeholder="Describe if present" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="psychosisSymptoms.hallucinations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hallucinations</FormLabel>
                    <FormControl>
                      <Input placeholder="Describe if present" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Other Symptoms</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {OTHER_SYMPTOMS.map((symptom) => (
                <FormField
                  key={symptom.key}
                  control={control}
                  name={`otherSymptoms.${symptom.key}`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value === true}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                        />
                      </FormControl>
                      <FormLabel className="font-normal text-sm">
                        {symptom.label}
                      </FormLabel>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Risk Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-red-50 rounded-lg space-y-4">
            <FormField
              control={control}
              name="suicidalThoughts"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value === true}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-red-700">Suicidal Thoughts</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="suicidalThoughtsDetails"
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
              name="thoughtsOfHarmingOthers"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value === true}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-red-700">Thoughts of Harming Others</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="harmingOthersDetails"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea placeholder="Please describe..." className="min-h-[60px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={control}
            name="abuseHistory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>History of Abuse (physical, emotional, sexual)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe history of abuse..." className="min-h-[80px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="traumaticEvents"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Traumatic Event(s)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe traumatic events..." className="min-h-[80px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mental Health History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="mentalIllnessDiagnosed"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value === true}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Have you ever been diagnosed with a mental illness?</FormLabel>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="mentalIllnessDetails"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea placeholder="Describe diagnosis, medications..." className="min-h-[60px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="previousPsychTreatment"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value === true}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Are you currently or have you previously received treatment for psychiatric or emotional problems?</FormLabel>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="psychTreatmentDetails"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea placeholder="Describe treatment setting, hospitalizations, duration..." className="min-h-[60px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="hallucinationsPresent"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value === true}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Do you ever see or hear things that other people say they do not see or hear?</FormLabel>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="hallucinationsDetails"
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
            name="furtherMHAssessmentNeeded"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 bg-yellow-50 rounded-lg">
                <FormControl>
                  <Checkbox
                    checked={field.value === true}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Based on previous questions, is further assessment of mental health needed?</FormLabel>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="furtherMHAssessmentDetails"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea placeholder="Please describe..." className="min-h-[60px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Psychiatric Medications</CardTitle>
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
                name={`psychiatricMedications.${index}.medication`}
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
                name={`psychiatricMedications.${index}.dose`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dose</FormLabel>
                    <FormControl>
                      <Input placeholder="Dose" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`psychiatricMedications.${index}.reason`}
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
                name={`psychiatricMedications.${index}.effectiveness`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effectiveness</FormLabel>
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
          <CardTitle>Mental Health Providers</CardTitle>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendProvider({
                  name: "",
                  contact: "",
                })
              }
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Provider
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {providers.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
              <FormField
                control={control}
                name={`mentalHealthProviders.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Name" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`mentalHealthProviders.${index}.contact`}
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dimension 3 Severity Rating</CardTitle>
          <CardDescription>
            Rate the severity of Emotional, Behavioral, or Cognitive Conditions and Complications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="dimension3Severity"
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
            name="dimension3Comments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Comments</FormLabel>
                <FormControl>
                  <Textarea placeholder="Additional comments for Dimension 3..." className="min-h-[80px]" {...field} />
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
