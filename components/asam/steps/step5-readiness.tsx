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

const AREAS_AFFECTED = [
  { key: "work", label: "Work" },
  { key: "mentalHealth", label: "Mental Health" },
  { key: "physicalHealth", label: "Physical Health" },
  { key: "finances", label: "Finances" },
  { key: "school", label: "School" },
  { key: "relationships", label: "Relationships" },
  { key: "sexualActivity", label: "Sexual Activity" },
  { key: "legalMatters", label: "Legal Matters" },
  { key: "everydayTasks", label: "Handling Everyday Tasks" },
  { key: "selfEsteem", label: "Self-esteem" },
  { key: "hygiene", label: "Hygiene" },
  { key: "recreationalActivities", label: "Recreational Activities" },
];

const IMPORTANCE_OPTIONS = [
  { value: "Not at all", label: "Not at all" },
  { value: "Slightly", label: "Slightly" },
  { value: "Moderately", label: "Moderately" },
  { value: "Considerably", label: "Considerably" },
  { value: "Extremely", label: "Extremely" },
];

const SEVERITY_OPTIONS = [
  { value: "0", label: "0 - None" },
  { value: "1", label: "1 - Mild" },
  { value: "2", label: "2 - Moderate" },
  { value: "3", label: "3 - Severe" },
  { value: "4", label: "4 - Very Severe" },
];

export function Step5Readiness() {
  const { control } = useFormContext();
  const { fields: providers, append: appendProvider, remove: removeProvider } = useFieldArray({
    control,
    name: "treatmentProviders",
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dimension 4: Readiness to Change</CardTitle>
          <CardDescription>
            Assessment of patient readiness and motivation for treatment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-3">Is your alcohol and/or drug use affecting any of the following?</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {AREAS_AFFECTED.map((area) => (
                <FormField
                  key={area.key}
                  control={control}
                  name={`areasAffectedByUse.${area.key}`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal text-sm">
                        {area.label}
                      </FormLabel>
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <FormField
              control={control}
              name="areasAffectedByUse.other"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>Other</FormLabel>
                  <FormControl>
                    <Input placeholder="Specify other areas affected" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={control}
            name="continueUseDespiteEffects"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Do you continue to use alcohol or drugs despite having it affect the areas listed above?
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="continueUseDetails"
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
            name="previousTreatmentHelp"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Have you received help for alcohol and/or drug problems in the past?
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Treatment Providers</CardTitle>
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
                name={`treatmentProviders.${index}.name`}
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
                name={`treatmentProviders.${index}.contact`}
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
          <CardTitle>Recovery Support & Barriers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="recoverySupport"
            render={({ field }) => (
              <FormItem>
                <FormLabel>What would help to support your recovery?</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe what support would be helpful..."
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
            name="recoveryBarriers"
            render={({ field }) => (
              <FormItem>
                <FormLabel>What are potential barriers to your recovery?</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., financial, transportation, relationships, etc."
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Treatment Importance</CardTitle>
          <CardDescription>How important is it for you to receive treatment?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="treatmentImportanceAlcohol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alcohol Problems</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select importance" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {IMPORTANCE_OPTIONS.map((option) => (
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
              name="treatmentImportanceDrugs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Drug Problems</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select importance" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {IMPORTANCE_OPTIONS.map((option) => (
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
          </div>
          <FormField
            control={control}
            name="treatmentImportanceDetails"
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
          <CardTitle>Dimension 4 Severity Rating</CardTitle>
          <CardDescription>
            Rate the severity of Readiness to Change
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="dimension4Severity"
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
            name="dimension4Comments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Comments</FormLabel>
                <FormControl>
                  <Textarea placeholder="Additional comments for Dimension 4..." className="min-h-[80px]" {...field} />
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
