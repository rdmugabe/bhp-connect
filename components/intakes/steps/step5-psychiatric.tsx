"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { AlertTriangle } from "lucide-react";

export function Step5Psychiatric() {
  const { control } = useFormContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Psychiatric Presentation</CardTitle>
        <CardDescription>
          Psychiatric history and current presentation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={control}
          name="isCOT"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 border-orange-200 bg-orange-50">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  Court Ordered Treatment (COT)
                </FormLabel>
                <FormDescription className="text-orange-700">
                  The resident is under court-ordered treatment
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="personalPsychHX"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Personal Psychiatric History</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the resident's psychiatric history including diagnoses, hospitalizations, and treatment history..."
                  className="min-h-[150px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="familyPsychHX"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Family Psychiatric History</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe relevant family psychiatric history..."
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
