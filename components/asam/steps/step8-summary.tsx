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
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LEVEL_OF_CARE_OPTIONS = [
  { value: "0.5", label: "0.5 - Early Intervention" },
  { value: "1", label: "1 - Outpatient Services" },
  { value: "2.1", label: "2.1 - Intensive Outpatient Services" },
  { value: "2.5", label: "2.5 - Partial Hospitalization Services" },
  { value: "3.1", label: "3.1 - Clinically Managed Low-Intensity Residential Services" },
  { value: "3.3", label: "3.3 - Clinically Managed Population-Specific High-Intensity Residential Services" },
  { value: "3.5", label: "3.5 - Clinically Managed High-Intensity Residential Services" },
  { value: "3.7", label: "3.7 - Medically Monitored Intensive Inpatient Services" },
  { value: "4", label: "4 - Medically Managed Intensive Inpatient Services" },
  { value: "1-WM", label: "1-WM - Ambulatory Withdrawal Management without Extended On-Site Monitoring" },
  { value: "2-WM", label: "2-WM - Ambulatory Withdrawal Management with Extended On-Site Monitoring" },
  { value: "3.2-WM", label: "3.2-WM - Clinically Managed Residential Withdrawal Management" },
  { value: "3.7-WM", label: "3.7-WM - Medically Monitored Inpatient Withdrawal Management" },
  { value: "4-WM", label: "4-WM - Medically Managed Intensive Inpatient Withdrawal Management" },
  { value: "OTP", label: "OTP - Opioid Treatment Program" },
];

const DISCREPANCY_REASONS = [
  { value: "Not Applicable", label: "Not Applicable" },
  { value: "Service Not Available", label: "Service Not Available" },
  { value: "Provider Judgment", label: "Provider Judgment" },
  { value: "Patient Preference", label: "Patient Preference" },
  { value: "Transportation", label: "Transportation" },
  { value: "Accessibility", label: "Accessibility" },
  { value: "Financial", label: "Financial" },
  { value: "Preferred to Wait", label: "Preferred to Wait" },
  { value: "Language/Cultural Considerations", label: "Language/Cultural Considerations" },
  { value: "Environment", label: "Environment" },
  { value: "Mental Health", label: "Mental Health" },
  { value: "Physical Health", label: "Physical Health" },
  { value: "Other", label: "Other" },
];

export function Step8Summary() {
  const { control, watch } = useFormContext();

  const dimension1Severity = watch("dimension1Severity");
  const dimension2Severity = watch("dimension2Severity");
  const dimension3Severity = watch("dimension3Severity");
  const dimension4Severity = watch("dimension4Severity");
  const dimension5Severity = watch("dimension5Severity");
  const dimension6Severity = watch("dimension6Severity");

  const getSeverityLabel = (severity: number | undefined) => {
    if (severity === undefined) return "Not Rated";
    const labels = ["None", "Mild", "Moderate", "Severe", "Very Severe"];
    return labels[severity] || "Not Rated";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Summary of Multidimensional Assessment</CardTitle>
          <CardDescription>
            Overview of severity ratings for all 6 dimensions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium">Dimension 1</h4>
                <p className="text-sm text-muted-foreground">Substance Use / Withdrawal</p>
                <p className="text-lg font-semibold mt-2">
                  {dimension1Severity !== undefined ? `${dimension1Severity} - ${getSeverityLabel(dimension1Severity)}` : "Not Rated"}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium">Dimension 2</h4>
                <p className="text-sm text-muted-foreground">Biomedical Conditions</p>
                <p className="text-lg font-semibold mt-2">
                  {dimension2Severity !== undefined ? `${dimension2Severity} - ${getSeverityLabel(dimension2Severity)}` : "Not Rated"}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium">Dimension 3</h4>
                <p className="text-sm text-muted-foreground">Emotional/Behavioral/Cognitive</p>
                <p className="text-lg font-semibold mt-2">
                  {dimension3Severity !== undefined ? `${dimension3Severity} - ${getSeverityLabel(dimension3Severity)}` : "Not Rated"}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium">Dimension 4</h4>
                <p className="text-sm text-muted-foreground">Readiness to Change</p>
                <p className="text-lg font-semibold mt-2">
                  {dimension4Severity !== undefined ? `${dimension4Severity} - ${getSeverityLabel(dimension4Severity)}` : "Not Rated"}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium">Dimension 5</h4>
                <p className="text-sm text-muted-foreground">Relapse Potential</p>
                <p className="text-lg font-semibold mt-2">
                  {dimension5Severity !== undefined ? `${dimension5Severity} - ${getSeverityLabel(dimension5Severity)}` : "Not Rated"}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium">Dimension 6</h4>
                <p className="text-sm text-muted-foreground">Recovery Environment</p>
                <p className="text-lg font-semibold mt-2">
                  {dimension6Severity !== undefined ? `${dimension6Severity} - ${getSeverityLabel(dimension6Severity)}` : "Not Rated"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>DSM-5 Substance Use Disorder Diagnoses</CardTitle>
          <CardDescription>
            Enter DSM-5 diagnosis information based on criteria evaluation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="dsm5Diagnoses"
            render={({ field }) => (
              <FormItem>
                <FormLabel>List of Substance Use Disorder(s) that Meet DSM-5 Criteria</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="List diagnoses with severity level (e.g., Alcohol Use Disorder, Severe; Opioid Use Disorder, Moderate)"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
                <p className="text-sm text-muted-foreground mt-2">
                  Severity: Mild (2-3 criteria), Moderate (4-5 criteria), Severe (6+ criteria)
                </p>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Level of Care Determination</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={control}
            name="matInterested"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 bg-blue-50 rounded-lg">
                <FormControl>
                  <Checkbox
                    checked={field.value === true}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Would the patient with alcohol or opioid use disorders benefit from and be interested in Medication-Assisted Treatment (MAT)?
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="matDetails"
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
          <CardTitle>Placement Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="recommendedLevelOfCare"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recommended Level of Care</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level of care" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LEVEL_OF_CARE_OPTIONS.map((option) => (
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
              name="levelOfCareProvided"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Level of Care Provided</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level of care" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LEVEL_OF_CARE_OPTIONS.map((option) => (
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
            name="discrepancyReason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason for Discrepancy (if different from recommended)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DISCREPANCY_REASONS.map((option) => (
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
            name="discrepancyExplanation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Briefly Explain Discrepancy</FormLabel>
                <FormControl>
                  <Textarea placeholder="Explain the discrepancy..." className="min-h-[60px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="designatedTreatmentLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Designated Treatment Location</FormLabel>
                <FormControl>
                  <Textarea placeholder="Treatment location and provider name..." className="min-h-[60px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="designatedProviderName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Designated Provider Name</FormLabel>
                <FormControl>
                  <Input placeholder="Provider name" {...field} />
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
            Electronic signatures for assessment completion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium">BHT/Administrator/Staff</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={control}
                name="counselorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name (Type Full Name)</FormLabel>
                    <FormControl>
                      <Input placeholder="Type full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="counselorSignatureDate"
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

          <div className="space-y-4">
            <h4 className="font-medium">BHP/LPHA (if different from above)</h4>
            <p className="text-sm text-muted-foreground">
              Complete this line if individual conducting this assessment is not an LPHA
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={control}
                name="bhpLphaName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name (Type Full Name)</FormLabel>
                    <FormControl>
                      <Input placeholder="Type full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="bhpLphaSignatureDate"
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
        </CardContent>
      </Card>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-800 mb-2">Review Before Submission</h4>
        <p className="text-sm text-yellow-700">
          Please review all sections of this ASAM assessment before submitting.
          Once submitted, the assessment will be sent to the BHP for review and cannot be modified.
        </p>
      </div>
    </div>
  );
}
