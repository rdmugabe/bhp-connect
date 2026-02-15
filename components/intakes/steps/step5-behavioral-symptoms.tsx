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

export function Step5BehavioralSymptoms() {
  const { control } = useFormContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Behavioral Health Symptoms</CardTitle>
        <CardDescription>
          Current behavioral health presentation and symptoms
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={control}
          name="reasonForServices"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason for Services</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Why is the patient seeking services at this time? What prompted the referral?"
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
          name="currentBehavioralSymptoms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Behavioral Health Symptoms</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe current symptoms including depression, anxiety, mood changes, sleep issues, etc."
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
          name="copingWithSymptoms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>How Patient Copes with Symptoms</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe current coping strategies and their effectiveness..."
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
          name="symptomsLimitations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Impact of Symptoms on Functioning</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="How do symptoms impact daily life, work, relationships, self-care, etc.?"
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
          name="immediateUrgentNeeds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Immediate/Urgent Needs</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any immediate safety concerns or urgent needs that need to be addressed?"
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
          name="signsOfImprovement"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Signs of Improvement to Look For</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What would indicate improvement for this patient?"
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
          name="assistanceExpectations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Patient Expectations from Treatment</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What does the patient hope to achieve through treatment?"
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
          name="involvedInTreatment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Others Involved in Treatment</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Who else is involved in the patient's treatment? (family, other providers, agencies)"
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
  );
}
