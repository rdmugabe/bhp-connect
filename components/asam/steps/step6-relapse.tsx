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
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FREQUENCY_OPTIONS = [
  { value: "None", label: "None" },
  { value: "Occasionally", label: "Occasionally" },
  { value: "Frequently", label: "Frequently" },
  { value: "Constantly", label: "Constantly" },
];

const TRIGGERS = [
  { key: "strongCravings", label: "Strong Cravings" },
  { key: "workPressure", label: "Work Pressure" },
  { key: "mentalHealth", label: "Mental Health" },
  { key: "relationshipProblems", label: "Relationship Problems" },
  { key: "difficultyDealingWithFeelings", label: "Difficulty Dealing with Feelings" },
  { key: "financialStressors", label: "Financial Stressors" },
  { key: "physicalHealth", label: "Physical Health" },
  { key: "schoolPressure", label: "School Pressure" },
  { key: "environment", label: "Environment" },
  { key: "unemployment", label: "Unemployment" },
  { key: "chronicPain", label: "Chronic Pain" },
  { key: "peerPressure", label: "Peer Pressure" },
];

const SEVERITY_OPTIONS = [
  { value: "0", label: "0 - None" },
  { value: "1", label: "1 - Mild" },
  { value: "2", label: "2 - Moderate" },
  { value: "3", label: "3 - Severe" },
  { value: "4", label: "4 - Very Severe" },
];

export function Step6Relapse() {
  const { control } = useFormContext();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dimension 5: Relapse, Continued Use, or Continued Problem Potential</CardTitle>
          <CardDescription>
            Assessment of relapse risk and continued use potential
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="cravingsFrequencyAlcohol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    In the last 30 days, how often have you experienced cravings, withdrawal symptoms, or disturbing effects from alcohol?
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map((option) => (
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
              name="cravingsFrequencyDrugs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    In the last 30 days, how often have you experienced cravings, withdrawal symptoms, or disturbing effects from drugs?
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map((option) => (
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
            name="cravingsDetails"
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
            name="timeSearchingForSubstances"
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
                    Do you find yourself spending time searching for alcohol and/or drugs, or trying to recover from its effects?
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="timeSearchingDetails"
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
            name="relapseWithoutTreatment"
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
                    Do you feel that you will either relapse or continue to use without treatment or additional support?
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="relapseDetails"
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
          <CardTitle>Triggers</CardTitle>
          <CardDescription>
            Are you aware of your triggers to use alcohol and/or drugs?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="awareOfTriggers"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Yes, I am aware of my triggers</FormLabel>
                </div>
              </FormItem>
            )}
          />

          <div>
            <h4 className="font-medium mb-3">Please check off any triggers that may apply:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {TRIGGERS.map((trigger) => (
                <FormField
                  key={trigger.key}
                  control={control}
                  name={`triggersList.${trigger.key}`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal text-sm">
                        {trigger.label}
                      </FormLabel>
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <FormField
              control={control}
              name="triggersList.other"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>Other</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Specify other triggers" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={control}
            name="copingWithTriggers"
            render={({ field }) => (
              <FormItem>
                <FormLabel>What do you do if you are triggered?</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe coping strategies..."
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
          <CardTitle>Recovery History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="attemptsToControl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Can you please describe any attempts you have made to either control or cut down on your alcohol and/or drug use?
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe previous attempts..."
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
            name="longestSobriety"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  What is the longest period of time that you have gone without using alcohol and/or drugs?
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., 6 months, 2 years..."
                    className="min-h-[60px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="whatHelped"
            render={({ field }) => (
              <FormItem>
                <FormLabel>What helped?</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe what helped maintain sobriety..."
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
            name="whatDidntHelp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>What didn&apos;t help?</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe what didn't help..."
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
          <CardTitle>Dimension 5 Severity Rating</CardTitle>
          <CardDescription>
            Rate the severity of Relapse, Continued Use, or Continued Problem Potential
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="dimension5Severity"
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
            name="dimension5Comments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Comments</FormLabel>
                <FormControl>
                  <Textarea placeholder="Additional comments for Dimension 5..." className="min-h-[80px]" {...field} />
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
