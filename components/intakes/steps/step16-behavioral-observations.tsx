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

export function Step16BehavioralObservations() {
  const { control } = useFormContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Behavioral Observations</CardTitle>
        <CardDescription>
          Clinical observations during the assessment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Appearance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={control}
              name="appearanceAge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Appears Age</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Younger than stated">Younger than stated</SelectItem>
                      <SelectItem value="Consistent with stated">Consistent with stated</SelectItem>
                      <SelectItem value="Older than stated">Older than stated</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="appearanceHeight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Height</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 5'10 in" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="appearanceWeight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 180 lbs" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="appearanceAttire"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attire</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Appropriate">Appropriate</SelectItem>
                      <SelectItem value="Disheveled">Disheveled</SelectItem>
                      <SelectItem value="Unkempt">Unkempt</SelectItem>
                      <SelectItem value="Bizarre">Bizarre</SelectItem>
                      <SelectItem value="Inappropriate">Inappropriate for weather/setting</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="appearanceGrooming"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grooming/Hygiene</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Well-groomed">Well-groomed</SelectItem>
                      <SelectItem value="Adequately groomed">Adequately groomed</SelectItem>
                      <SelectItem value="Poor hygiene">Poor hygiene</SelectItem>
                      <SelectItem value="Unkempt">Unkempt</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={control}
            name="appearanceDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Appearance Notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Additional observations about appearance..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Demeanor</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="demeanorMood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mood (self-reported)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Euthymic">Euthymic</SelectItem>
                      <SelectItem value="Happy">Happy</SelectItem>
                      <SelectItem value="Sad">Sad</SelectItem>
                      <SelectItem value="Anxious">Anxious</SelectItem>
                      <SelectItem value="Angry">Angry</SelectItem>
                      <SelectItem value="Irritable">Irritable</SelectItem>
                      <SelectItem value="Depressed">Depressed</SelectItem>
                      <SelectItem value="Elevated">Elevated</SelectItem>
                      <SelectItem value="Labile">Labile</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="demeanorAffect"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Affect (observed)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Full range">Full range</SelectItem>
                      <SelectItem value="Constricted">Constricted</SelectItem>
                      <SelectItem value="Flat">Flat</SelectItem>
                      <SelectItem value="Blunted">Blunted</SelectItem>
                      <SelectItem value="Labile">Labile</SelectItem>
                      <SelectItem value="Incongruent">Incongruent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="demeanorEyeContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Eye Contact</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Fair">Fair</SelectItem>
                      <SelectItem value="Poor">Poor</SelectItem>
                      <SelectItem value="Avoidant">Avoidant</SelectItem>
                      <SelectItem value="Intense/Staring">Intense/Staring</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="demeanorCooperation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cooperation</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Cooperative">Cooperative</SelectItem>
                      <SelectItem value="Guarded">Guarded</SelectItem>
                      <SelectItem value="Hostile">Hostile</SelectItem>
                      <SelectItem value="Resistant">Resistant</SelectItem>
                      <SelectItem value="Uncooperative">Uncooperative</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={control}
            name="demeanorDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Demeanor Notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Additional observations about demeanor..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Speech</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="speechArticulation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Articulation</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Clear">Clear</SelectItem>
                      <SelectItem value="Slurred">Slurred</SelectItem>
                      <SelectItem value="Mumbled">Mumbled</SelectItem>
                      <SelectItem value="Stammering">Stammering</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="speechTone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tone</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Loud">Loud</SelectItem>
                      <SelectItem value="Soft">Soft</SelectItem>
                      <SelectItem value="Monotone">Monotone</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="speechRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Rapid">Rapid</SelectItem>
                      <SelectItem value="Slow">Slow</SelectItem>
                      <SelectItem value="Pressured">Pressured</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="speechLatency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Latency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Delayed">Delayed</SelectItem>
                      <SelectItem value="Rapid response">Rapid response</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={control}
            name="speechDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Speech Notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Additional observations about speech..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Motor Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="motorGait"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gait</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Unsteady">Unsteady</SelectItem>
                      <SelectItem value="Shuffling">Shuffling</SelectItem>
                      <SelectItem value="Limping">Limping</SelectItem>
                      <SelectItem value="Wheelchair">Wheelchair</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="motorPosture"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Posture</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Stooped">Stooped</SelectItem>
                      <SelectItem value="Rigid">Rigid</SelectItem>
                      <SelectItem value="Slouched">Slouched</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="motorActivity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity Level</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Restless">Restless</SelectItem>
                      <SelectItem value="Agitated">Agitated</SelectItem>
                      <SelectItem value="Slowed">Slowed</SelectItem>
                      <SelectItem value="Hyperactive">Hyperactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="motorMannerisms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mannerisms</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="None noted">None noted</SelectItem>
                      <SelectItem value="Tics">Tics</SelectItem>
                      <SelectItem value="Tremors">Tremors</SelectItem>
                      <SelectItem value="Repetitive movements">Repetitive movements</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={control}
            name="motorDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motor Activity Notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Additional observations about motor activity..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Cognition</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="cognitionThoughtContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thought Content</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Preoccupied">Preoccupied</SelectItem>
                      <SelectItem value="Obsessive">Obsessive</SelectItem>
                      <SelectItem value="Paranoid">Paranoid</SelectItem>
                      <SelectItem value="Grandiose">Grandiose</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="cognitionThoughtProcess"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thought Process</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Logical">Logical</SelectItem>
                      <SelectItem value="Tangential">Tangential</SelectItem>
                      <SelectItem value="Circumstantial">Circumstantial</SelectItem>
                      <SelectItem value="Loose associations">Loose associations</SelectItem>
                      <SelectItem value="Flight of ideas">Flight of ideas</SelectItem>
                      <SelectItem value="Thought blocking">Thought blocking</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="cognitionDelusions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delusions</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="None">None</SelectItem>
                      <SelectItem value="Paranoid">Paranoid</SelectItem>
                      <SelectItem value="Grandiose">Grandiose</SelectItem>
                      <SelectItem value="Somatic">Somatic</SelectItem>
                      <SelectItem value="Religious">Religious</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="cognitionPerception"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Perceptions</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Auditory hallucinations">Auditory hallucinations</SelectItem>
                      <SelectItem value="Visual hallucinations">Visual hallucinations</SelectItem>
                      <SelectItem value="Tactile hallucinations">Tactile hallucinations</SelectItem>
                      <SelectItem value="Illusions">Illusions</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="cognitionJudgment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judgment</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Fair">Fair</SelectItem>
                      <SelectItem value="Poor">Poor</SelectItem>
                      <SelectItem value="Impaired">Impaired</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="cognitionImpulseControl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Impulse Control</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Fair">Fair</SelectItem>
                      <SelectItem value="Poor">Poor</SelectItem>
                      <SelectItem value="Impaired">Impaired</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="cognitionInsight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Insight</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Fair">Fair</SelectItem>
                      <SelectItem value="Limited">Limited</SelectItem>
                      <SelectItem value="Poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="estimatedIntelligence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Intelligence</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Above average">Above average</SelectItem>
                      <SelectItem value="Average">Average</SelectItem>
                      <SelectItem value="Below average">Below average</SelectItem>
                      <SelectItem value="Borderline">Borderline</SelectItem>
                      <SelectItem value="Intellectually disabled">Intellectually disabled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={control}
            name="cognitionDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cognition Notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Additional observations about cognition..." {...field} />
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
