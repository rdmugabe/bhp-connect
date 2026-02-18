"use client";

import { useState } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

export function Step4Medical() {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "medications",
  });

  const addMedication = () => {
    append({
      name: "",
      dosage: "",
      frequency: "",
      route: "",
      prescriber: "",
      purpose: "",
      startDate: "",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Medical Information</CardTitle>
        <CardDescription>
          Medical history, allergies, and current medications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={control}
          name="allergies"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Allergies</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="List all known allergies (medications, food, environmental)..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Medications Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Current Medications</h3>
            <Button type="button" variant="outline" size="sm" onClick={addMedication}>
              <Plus className="h-4 w-4 mr-2" />
              Add Medication
            </Button>
          </div>

          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              No medications added. Click &quot;Add Medication&quot; to add one.
            </p>
          )}

          {fields.map((field, index) => (
            <div key={field.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Medication {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={control}
                  name={`medications.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medication Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`medications.${index}.dosage`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dosage</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 10mg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`medications.${index}.frequency`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Twice daily" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`medications.${index}.route`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Route</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select route" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Oral">Oral</SelectItem>
                          <SelectItem value="Topical">Topical</SelectItem>
                          <SelectItem value="Injection">Injection</SelectItem>
                          <SelectItem value="Inhalation">Inhalation</SelectItem>
                          <SelectItem value="Sublingual">Sublingual</SelectItem>
                          <SelectItem value="Rectal">Rectal</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`medications.${index}.prescriber`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prescriber</FormLabel>
                      <FormControl>
                        <Input placeholder="Dr. Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`medications.${index}.purpose`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose</FormLabel>
                      <FormControl>
                        <Input placeholder="Reason for medication" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Risk Flags */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Risk Indicators</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="historyNonCompliance"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>History of Non-Compliance</FormLabel>
                    <FormDescription>
                      Previous issues with medication or treatment adherence
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="potentialViolence"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 border-red-200 bg-red-50">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-red-700">Potential for Violence</FormLabel>
                    <FormDescription className="text-red-600">
                      History or risk of violent behavior
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={control}
          name="medicalUrgency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Medical Urgency Level</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || undefined}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select urgency level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="None">None - Routine care</SelectItem>
                  <SelectItem value="Low">Low - Monitor closely</SelectItem>
                  <SelectItem value="Moderate">Moderate - Requires attention</SelectItem>
                  <SelectItem value="High">High - Urgent care needed</SelectItem>
                  <SelectItem value="Critical">Critical - Immediate intervention</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="personalMedicalHX"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Personal Medical History</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the resident's personal medical history..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="familyMedicalHX"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Family Medical History</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe relevant family medical history..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
