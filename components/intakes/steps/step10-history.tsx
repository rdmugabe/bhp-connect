"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

export function Step10History() {
  const { control, watch } = useFormContext();

  const courtOrderedTreatment = watch("courtOrderedTreatment");
  const nicotineUse = watch("nicotineUse");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Legal & Substance History</CardTitle>
        <CardDescription>
          Criminal/legal history and substance use patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Legal History</h3>

          <FormField
            control={control}
            name="criminalLegalHistory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Criminal/Legal History</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe any criminal or legal history including arrests, convictions, probation, parole..."
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
            name="courtOrderedTreatment"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Court-Ordered Treatment</FormLabel>
                  <FormDescription>
                    Is the patient under court-ordered treatment?
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {courtOrderedTreatment && (
            <FormField
              control={control}
              name="courtOrderedDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Court Order Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the court order, conditions, and requirements..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={control}
            name="otherLegalIssues"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Other Legal Issues</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any other pending legal issues, custody matters, protective orders, etc."
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Substance Use History</h3>

          <FormField
            control={control}
            name="substanceHistory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>General Substance Use History</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe overall substance use history..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="drugOfChoice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Drug of Choice</FormLabel>
                  <FormControl>
                    <Input placeholder="Primary substance(s)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="longestSobriety"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Longest Period of Sobriety</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 6 months, 2 years" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={control}
            name="substanceTreatmentHistory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Previous Substance Abuse Treatment</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe previous treatment programs, detox, rehab, 12-step programs..."
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
            name="substanceImpact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Impact of Substance Use</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="How has substance use impacted relationships, work, health, legal status, etc.?"
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
            name="nicotineUse"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Nicotine/Tobacco Use</FormLabel>
                  <FormDescription>
                    Resident currently uses nicotine or tobacco products
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {nicotineUse && (
            <FormField
              control={control}
              name="nicotineDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nicotine Use Details</FormLabel>
                  <FormControl>
                    <Input placeholder="Type, frequency, amount..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={control}
            name="historyOfAbuse"
            render={({ field }) => (
              <FormItem>
                <FormLabel>History of Abuse (as victim)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Document any history of physical, emotional, or sexual abuse experienced..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
