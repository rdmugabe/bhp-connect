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

export function Step2Insurance() {
  const { control } = useFormContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Insurance & Directives</CardTitle>
        <CardDescription>
          Insurance information and advance directives
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Insurance Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={control}
              name="insuranceProvider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Insurance Provider</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter provider name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="policyNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Policy Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Policy #" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="groupNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Group #" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="ahcccsHealthPlan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AHCCCS Health Plan</FormLabel>
                  <FormControl>
                    <Input placeholder="Health plan name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Advance Directives</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={control}
              name="hasDNR"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>DNR on File</FormLabel>
                    <FormDescription>
                      Do Not Resuscitate order
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="hasAdvancedDirective"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Advanced Directive</FormLabel>
                    <FormDescription>
                      Living will or healthcare directive
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="hasWill"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Will on File</FormLabel>
                    <FormDescription>
                      Last will and testament
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={control}
          name="poaLegalGuardian"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Power of Attorney / Legal Guardian</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter POA or legal guardian information including name, relationship, and contact information..."
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
