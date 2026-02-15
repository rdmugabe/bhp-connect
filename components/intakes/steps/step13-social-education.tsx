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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Step13SocialEducation() {
  const { control, watch } = useFormContext();

  const specialEducation = watch("specialEducation");
  const currentlyEmployed = watch("currentlyEmployed");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social & Education History</CardTitle>
        <CardDescription>
          Social background, relationships, education, and employment history
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Social History</h3>

          <FormField
            control={control}
            name="childhoodDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Describe Childhood</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the patient's childhood and upbringing..."
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
            name="abuseHistory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>History of Abuse/Trauma</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Document any history of physical, emotional, sexual abuse or trauma..."
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
            name="familyMentalHealthHistory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Family Mental Health History</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Document family history of mental health conditions..."
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
          <h3 className="text-lg font-medium">Relationships</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="relationshipStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Married">Married</SelectItem>
                      <SelectItem value="Divorced">Divorced</SelectItem>
                      <SelectItem value="Separated">Separated</SelectItem>
                      <SelectItem value="Widowed">Widowed</SelectItem>
                      <SelectItem value="Partnered">Partnered</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={control}
            name="relationshipSatisfaction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Relationship Satisfaction</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe current relationship satisfaction and quality..."
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
            name="friendsDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Social Connections/Friends</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe friendships and social support network..."
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
          <h3 className="text-lg font-medium">Education History</h3>

          <FormField
            control={control}
            name="highestEducation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Highest Level of Education</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="No formal education">No formal education</SelectItem>
                    <SelectItem value="Some elementary">Some elementary</SelectItem>
                    <SelectItem value="Elementary completed">Elementary completed</SelectItem>
                    <SelectItem value="Some high school">Some high school</SelectItem>
                    <SelectItem value="High school diploma/GED">High school diploma/GED</SelectItem>
                    <SelectItem value="Some college">Some college</SelectItem>
                    <SelectItem value="Associate degree">Associate degree</SelectItem>
                    <SelectItem value="Bachelor degree">Bachelor degree</SelectItem>
                    <SelectItem value="Graduate degree">Graduate degree</SelectItem>
                    <SelectItem value="Vocational/Technical">Vocational/Technical</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={control}
              name="specialEducation"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Special Education</FormLabel>
                    <FormDescription>Received special ed services</FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="plan504"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>504 Plan</FormLabel>
                    <FormDescription>Had a 504 accommodation plan</FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="iep"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>IEP</FormLabel>
                    <FormDescription>Individualized Education Program</FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>

          {specialEducation && (
            <FormField
              control={control}
              name="specialEducationDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Education Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe special education services received..."
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
            name="educationDetails"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Education Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any additional information about education history..."
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
          <h3 className="text-lg font-medium">Employment History</h3>

          <FormField
            control={control}
            name="currentlyEmployed"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Currently Employed</FormLabel>
                  <FormDescription>Is the patient currently working?</FormDescription>
                </div>
              </FormItem>
            )}
          />

          {currentlyEmployed && (
            <FormField
              control={control}
              name="employmentDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Employment Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe current job, employer, schedule..."
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
            name="workVolunteerHistory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work/Volunteer History</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe past work experience and volunteer history..."
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
            name="employmentBarriers"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Barriers to Employment</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="What barriers does the patient face in obtaining or maintaining employment?"
                    className="min-h-[80px]"
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
