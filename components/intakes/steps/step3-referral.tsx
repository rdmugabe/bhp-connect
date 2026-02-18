"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

export function Step3Referral() {
  const { control } = useFormContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Referral & Needs</CardTitle>
        <CardDescription>
          Information about the referral and resident needs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control}
            name="referralSource"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Referral Source</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Hospital, Physician, Self" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="evaluatorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Evaluator Name</FormLabel>
                <FormControl>
                  <Input placeholder="Evaluator name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="evaluatorCredentials"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Evaluator Credentials</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., LCSW, PhD" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="reasonsForReferral"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reasons for Referral</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the reasons this resident is being referred..."
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
          name="residentNeeds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resident Needs</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the resident's care needs..."
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
            name="residentExpectedLOS"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resident Expected Length of Stay</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select expected LOS" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Less than 30 days">Less than 30 days</SelectItem>
                    <SelectItem value="30-90 days">30-90 days</SelectItem>
                    <SelectItem value="90-180 days">90-180 days</SelectItem>
                    <SelectItem value="180+ days">180+ days</SelectItem>
                    <SelectItem value="Long-term">Long-term</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="teamExpectedLOS"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team Expected Length of Stay</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select expected LOS" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Less than 30 days">Less than 30 days</SelectItem>
                    <SelectItem value="30-90 days">30-90 days</SelectItem>
                    <SelectItem value="90-180 days">90-180 days</SelectItem>
                    <SelectItem value="180+ days">180+ days</SelectItem>
                    <SelectItem value="Long-term">Long-term</SelectItem>
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
          name="strengthsAndLimitations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Strengths and Limitations</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the resident's strengths and limitations..."
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
          name="familyInvolved"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Family Involvement</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe family involvement and support..."
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
