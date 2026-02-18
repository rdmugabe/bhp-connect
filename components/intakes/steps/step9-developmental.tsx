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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Step9Developmental() {
  const { control, watch } = useFormContext();

  const inUteroExposure = watch("inUteroExposure");
  const speechDifficulties = watch("speechDifficulties");
  const visualImpairment = watch("visualImpairment");
  const hearingImpairment = watch("hearingImpairment");
  const motorSkillsImpairment = watch("motorSkillsImpairment");
  const cognitiveImpairment = watch("cognitiveImpairment");
  const socialSkillsDeficits = watch("socialSkillsDeficits");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Developmental History</CardTitle>
        <CardDescription>
          Developmental milestones and any developmental concerns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={control}
            name="inUteroExposure"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>In Utero Exposure</FormLabel>
                  <FormDescription>
                    Was there exposure to drugs, alcohol, or other substances during pregnancy?
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
          {inUteroExposure && (
            <FormField
              control={control}
              name="inUteroExposureDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>In Utero Exposure Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the exposure and any known effects..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="developmentalMilestones"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Developmental Milestones</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Met">Met on time</SelectItem>
                    <SelectItem value="Delayed">Delayed</SelectItem>
                    <SelectItem value="Not Met">Not met</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="immunizationStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Immunization Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Current">Current</SelectItem>
                    <SelectItem value="Not Current">Not Current</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="developmentalDetails"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Developmental Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional notes about developmental history..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Developmental Impairments</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <FormField
                control={control}
                name="speechDifficulties"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Speech/Language Difficulties</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              {speechDifficulties && (
                <FormField
                  control={control}
                  name="speechDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea placeholder="Describe speech difficulties..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="space-y-4">
              <FormField
                control={control}
                name="visualImpairment"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Visual Impairment</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              {visualImpairment && (
                <FormField
                  control={control}
                  name="visualDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea placeholder="Describe visual impairment..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="space-y-4">
              <FormField
                control={control}
                name="hearingImpairment"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Hearing Impairment</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              {hearingImpairment && (
                <FormField
                  control={control}
                  name="hearingDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea placeholder="Describe hearing impairment..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="space-y-4">
              <FormField
                control={control}
                name="motorSkillsImpairment"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Motor Skills Impairment</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              {motorSkillsImpairment && (
                <FormField
                  control={control}
                  name="motorSkillsDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea placeholder="Describe motor skills impairment..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="space-y-4">
              <FormField
                control={control}
                name="cognitiveImpairment"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Cognitive Impairment</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              {cognitiveImpairment && (
                <FormField
                  control={control}
                  name="cognitiveDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea placeholder="Describe cognitive impairment..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="space-y-4">
              <FormField
                control={control}
                name="socialSkillsDeficits"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Social Skills Deficits</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              {socialSkillsDeficits && (
                <FormField
                  control={control}
                  name="socialSkillsDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea placeholder="Describe social skills deficits..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
