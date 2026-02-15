"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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

const ADL_LEVELS = [
  { value: "Independent", label: "Independent" },
  { value: "Supervision", label: "Supervision Only" },
  { value: "Limited Assist", label: "Limited Assistance" },
  { value: "Extensive Assist", label: "Extensive Assistance" },
  { value: "Total Dependence", label: "Total Dependence" },
  { value: "Not Assessed", label: "Not Assessed" },
];

const SUPPORT_LEVELS = [
  { value: "Minimal", label: "Minimal Support" },
  { value: "Moderate", label: "Moderate Support" },
  { value: "Extensive", label: "Extensive Support" },
  { value: "Full", label: "Full Support" },
];

export function Step11ADLs() {
  const { control } = useFormContext();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Living Situation</CardTitle>
          <CardDescription>
            Information about the patient current living arrangements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="livingArrangements"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Living Arrangements</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe current living situation (housing type, who they live with, stability, safety concerns)..."
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
            name="sourceOfFinances"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source of Finances</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe sources of income (employment, disability, SSI, family support, etc.)..."
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
            name="transportationMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transportation</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select transportation method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Own vehicle">Own vehicle</SelectItem>
                    <SelectItem value="Family/Friends">Family/Friends</SelectItem>
                    <SelectItem value="Public transit">Public transit</SelectItem>
                    <SelectItem value="Medical transport">Medical transport</SelectItem>
                    <SelectItem value="Rideshare">Rideshare (Uber/Lyft)</SelectItem>
                    <SelectItem value="Walking/Bicycle">Walking/Bicycle</SelectItem>
                    <SelectItem value="None">No transportation</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activities of Daily Living (ADLs)</CardTitle>
          <CardDescription>
            Assessment of functional abilities for daily activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField
              control={control}
              name="adlChecklist.eating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Eating</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ADL_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="adlChecklist.bathing"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bathing</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ADL_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="adlChecklist.dressing"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dressing</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ADL_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="adlChecklist.toileting"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Toileting</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ADL_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="adlChecklist.transferring"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transferring</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ADL_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="adlChecklist.continence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Continence</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ADL_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activities & Support</CardTitle>
          <CardDescription>
            Preferred activities, routines, and support needs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="supportLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Overall Support Level Needed</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select support level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SUPPORT_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
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
            name="typicalDay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Describe a Typical Day</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the patient's typical daily routine, schedule, and activities..."
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
            name="preferredActivities"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Activities</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="List the patient's preferred activities, hobbies, and interests..."
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
            name="strengthsAbilitiesInterests"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Strengths, Abilities & Interests</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the patient's strengths, abilities, skills, and interests that can support recovery..."
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
            name="significantOthers"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Significant Others</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="List significant others including family members, friends, and important relationships..."
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
    </div>
  );
}
