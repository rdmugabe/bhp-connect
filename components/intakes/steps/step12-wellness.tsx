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
import { SignaturePad } from "@/components/ui/signature-pad";

export function Step12Wellness() {
  const { control } = useFormContext();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Wellness Needs</CardTitle>
          <CardDescription>
            Health, nutritional, spiritual, and cultural needs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="healthNeeds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Health Needs</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe health needs..."
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
              name="nutritionalNeeds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nutritional Needs</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe dietary requirements and restrictions..."
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
              name="spiritualNeeds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spiritual Needs</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe spiritual or religious needs..."
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
              name="culturalNeeds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cultural Needs</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe cultural considerations..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="educationHistory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Education History</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe educational background..."
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
              name="vocationalHistory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vocational History</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe work/employment history..."
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

      <Card>
        <CardHeader>
          <CardTitle>Crisis Intervention & Discharge</CardTitle>
          <CardDescription>
            Crisis intervention plan and discharge planning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="crisisInterventionPlan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Crisis Intervention Plan</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the crisis intervention plan including triggers, warning signs, and intervention strategies..."
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
            name="feedbackFrequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Feedback Frequency</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="As needed">As needed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="dischargePlanning"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discharge Planning Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe discharge planning considerations and goals..."
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

      <Card>
        <CardHeader>
          <CardTitle>Diagnosis & Treatment Recommendation</CardTitle>
          <CardDescription>
            Clinical diagnosis and recommended treatment approach
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="diagnosis"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Diagnosis</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter clinical diagnosis (DSM-5 codes and descriptions)..."
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
            name="treatmentRecommendation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Treatment Recommendation</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe recommended treatment approach, level of care, and services..."
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

      <Card>
        <CardHeader>
          <CardTitle>Signatures</CardTitle>
          <CardDescription>
            Digital signatures for intake completion. Sign directly in the boxes below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Client/Guardian Signature */}
          <div className="space-y-4 pb-6 border-b">
            <h4 className="font-medium">Client/Guardian Signature</h4>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <FormField
                  control={control}
                  name="signatures.clientSignature"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <SignaturePad
                          label="Sign Here"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-4">
                <FormField
                  control={control}
                  name="signatures.clientPrintedName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Printed Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="signatures.clientSignatureDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Assessor Signature */}
          <div className="space-y-4 pb-6 border-b">
            <h4 className="font-medium">Assessment Completed By</h4>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <FormField
                  control={control}
                  name="signatures.assessorSignature"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <SignaturePad
                          label="Assessor Signature"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-4">
                <FormField
                  control={control}
                  name="signatures.assessorPrintedName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Printed Name / Credentials</FormLabel>
                      <FormControl>
                        <Input placeholder="Name and credentials" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="signatures.assessorSignatureDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Clinical Oversight / BHP Reviewer Signature */}
          <div className="space-y-4">
            <h4 className="font-medium">Clinical Oversight / BHP Reviewer</h4>
            <p className="text-sm text-muted-foreground">
              This signature will be completed by the BHP reviewer after approval.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <FormField
                  control={control}
                  name="signatures.clinicalOversightSignature"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <SignaturePad
                          label="BHP Reviewer Signature"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-4">
                <FormField
                  control={control}
                  name="signatures.clinicalOversightPrintedName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Printed Name / Credentials</FormLabel>
                      <FormControl>
                        <Input placeholder="Name and credentials" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="signatures.clinicalOversightSignatureDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-800 mb-2">Review Before Submission</h4>
        <p className="text-sm text-yellow-700">
          Please review all sections of this intake assessment before submitting.
          Once submitted, the intake will be sent to the BHP for review and cannot be modified.
        </p>
      </div>
    </div>
  );
}
