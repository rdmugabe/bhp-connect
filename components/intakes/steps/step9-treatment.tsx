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

export function Step9Treatment() {
  const { control } = useFormContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Treatment Planning</CardTitle>
        <CardDescription>
          Treatment objectives, discharge planning, and support systems
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="treatmentObjectives"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Treatment Objectives</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the treatment objectives and goals for this resident..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="dischargePlanObjectives"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Discharge Plan Objectives</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the objectives and criteria for discharge..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="supportSystem"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Support System</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the resident's support system including family, friends, and community connections..."
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
          name="communityResources"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Community Resources</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="List available community resources and services..."
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
