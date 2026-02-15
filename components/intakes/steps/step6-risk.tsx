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
import { AlertTriangle } from "lucide-react";

export function Step6Risk() {
  const { control, watch } = useFormContext();

  const currentSuicideIdeation = watch("currentSuicideIdeation");
  const historySelfHarm = watch("historySelfHarm");
  const historyHarmingOthers = watch("historyHarmingOthers");
  const homicidalIdeation = watch("homicidalIdeation");
  const dutyToWarnCompleted = watch("dutyToWarnCompleted");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Risk Assessment
        </CardTitle>
        <CardDescription>
          Comprehensive assessment of danger to self (DTS) and danger to others (DTO)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Danger to Self Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-red-700">Danger to Self (DTS)</h3>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={control}
                name="currentSuicideIdeation"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-red-300 p-4 bg-white">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-red-700 font-medium">Current Suicidal Ideation</FormLabel>
                      <FormDescription className="text-red-600">
                        Active thoughts of suicide
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="historySelfHarm"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-red-300 p-4 bg-white">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-red-700 font-medium">History of Self-Harm</FormLabel>
                      <FormDescription className="text-red-600">
                        Past self-injurious behaviors
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {currentSuicideIdeation && (
            <FormField
              control={control}
              name="suicideIdeationDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Suicidal Ideation Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe current suicidal thoughts, plan, intent, means..."
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
            name="suicideHistory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Suicide History</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe any history of suicide attempts..."
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
            name="suicideAttemptDetails"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Suicide Attempt Details</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="If applicable, describe previous attempts including method, lethality, outcome..."
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
            name="mostRecentSuicideIdeation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Most Recent Suicidal Ideation</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="When was the most recent episode of suicidal thinking? Describe..."
                    className="min-h-[60px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {historySelfHarm && (
            <FormField
              control={control}
              name="selfHarmDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Self-Harm Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe self-harm behaviors, methods, frequency..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* DTS Risk Factors */}
          <div className="space-y-3">
            <h4 className="font-medium">DTS Risk Factors</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <FormField
                control={control}
                name="dtsRiskFactors.accessToMeans"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">Access to means</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="dtsRiskFactors.recentLoss"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">Recent loss</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="dtsRiskFactors.socialIsolation"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">Social isolation</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="dtsRiskFactors.substanceUse"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">Substance use</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="dtsRiskFactors.previousAttempts"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">Previous attempts</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="dtsRiskFactors.mentalHealthDiagnosis"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">Mental health Dx</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="dtsRiskFactors.chronicPain"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">Chronic pain</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="dtsRiskFactors.hopelessness"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">Hopelessness</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* DTS Protective Factors */}
          <div className="space-y-3">
            <h4 className="font-medium text-green-700">DTS Protective Factors</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <FormField
                control={control}
                name="dtsProtectiveFactors.familySupport"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">Family support</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="dtsProtectiveFactors.socialConnections"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">Social connections</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="dtsProtectiveFactors.engagedInTreatment"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">Engaged in treatment</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="dtsProtectiveFactors.spirituality"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">Spirituality/faith</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="dtsProtectiveFactors.reasonsForLiving"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">Reasons for living</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="dtsProtectiveFactors.copingSkills"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">Coping skills</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Danger to Others Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-orange-700">Danger to Others (DTO)</h3>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={control}
                name="historyHarmingOthers"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-orange-300 p-4 bg-white">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-orange-700 font-medium">History of Harming Others</FormLabel>
                      <FormDescription className="text-orange-600">
                        Past violent or aggressive behaviors
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="homicidalIdeation"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-orange-300 p-4 bg-white">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-orange-700 font-medium">Homicidal Ideation</FormLabel>
                      <FormDescription className="text-orange-600">
                        Current thoughts of harming others
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {historyHarmingOthers && (
            <FormField
              control={control}
              name="harmingOthersDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>History of Harming Others - Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe incidents of violence or aggression toward others..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {homicidalIdeation && (
            <FormField
              control={control}
              name="homicidalIdeationDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Homicidal Ideation Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe current thoughts of harming others, identified targets, plan..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* DTO Risk Factors */}
          <div className="space-y-3">
            <h4 className="font-medium">DTO Risk Factors</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <FormField
                control={control}
                name="dtoRiskFactors.accessToWeapons"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">Access to weapons</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="dtoRiskFactors.historyOfViolence"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">History of violence</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="dtoRiskFactors.paranoia"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">Paranoia</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="dtoRiskFactors.substanceUse"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">Substance use</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="dtoRiskFactors.identifiedTarget"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">Identified target</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="dtoRiskFactors.stressors"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">Significant stressors</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Duty to Warn */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
            <FormField
              control={control}
              name="dutyToWarnCompleted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-medium">Duty to Warn Completed</FormLabel>
                    <FormDescription>
                      If applicable, has duty to warn been fulfilled?
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            {dutyToWarnCompleted && (
              <FormField
                control={control}
                name="dutyToWarnDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duty to Warn Details</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Document who was warned, when, and by whom..."
                        className="min-h-[60px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        {/* Hospitalization History */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Hospitalization History</h3>

          <FormField
            control={control}
            name="previousHospitalizations"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Previous Psychiatric Hospitalizations</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="List previous psychiatric hospitalizations including dates, facilities, and reasons..."
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
            name="hospitalizationDetails"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Hospitalization Details</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Provide additional details about hospitalizations, treatments received, and outcomes..."
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
