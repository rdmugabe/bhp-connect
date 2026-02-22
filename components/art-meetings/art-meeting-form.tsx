"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ART_MEETING_ATTENDEES } from "@/lib/validations";
import { formatDate } from "@/lib/utils";

interface ResidentInfo {
  id: string;
  residentName: string;
  dateOfBirth: Date | string;
  policyNumber?: string | null;
  ahcccsHealthPlan?: string | null;
}

interface ARTMeetingData {
  id?: string;
  meetingDate?: string | Date | null;
  dxCodes?: string | null;
  presentDuringMeeting?: string[];
  absentDuringMeeting?: string[];
  focusOfMeeting?: string | null;
  resolutions?: string | null;
  strengths?: string | null;
  barriers?: string | null;
  whatHasWorked?: string | null;
  whatHasNotWorked?: string | null;
  goals?: string | null;
  concreteSteps?: string | null;
  progressIndicators?: string | null;
  medicalIssues?: string | null;
  plan?: string | null;
  notesTakenBy?: string | null;
  meetingStartTime?: string | null;
  meetingEndTime?: string | null;
  meetingMonth?: number;
  meetingYear?: number;
  status?: string;
  isSkipped?: boolean;
}

interface ARTMeetingFormProps {
  resident: ResidentInfo;
  initialData?: ARTMeetingData;
  meetingMonth?: number;
  meetingYear?: number;
  mode?: "create" | "edit";
  readOnly?: boolean;
}

export function ARTMeetingForm({
  resident,
  initialData,
  meetingMonth,
  meetingYear,
  mode = "create",
  readOnly = false,
}: ARTMeetingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const currentMonth = meetingMonth || new Date().getMonth() + 1;
  const currentYear = meetingYear || new Date().getFullYear();

  const [formData, setFormData] = useState({
    meetingDate: initialData?.meetingDate
      ? new Date(initialData.meetingDate).toISOString().split("T")[0]
      : "",
    dxCodes: initialData?.dxCodes || "",
    presentDuringMeeting: initialData?.presentDuringMeeting || [],
    absentDuringMeeting: initialData?.absentDuringMeeting || [],
    focusOfMeeting: initialData?.focusOfMeeting || "",
    resolutions: initialData?.resolutions || "",
    strengths: initialData?.strengths || "",
    barriers: initialData?.barriers || "",
    whatHasWorked: initialData?.whatHasWorked || "",
    whatHasNotWorked: initialData?.whatHasNotWorked || "",
    goals: initialData?.goals || "",
    concreteSteps: initialData?.concreteSteps || "",
    progressIndicators: initialData?.progressIndicators || "",
    medicalIssues: initialData?.medicalIssues || "",
    plan: initialData?.plan || "",
    notesTakenBy: initialData?.notesTakenBy || "",
    meetingStartTime: initialData?.meetingStartTime || "",
    meetingEndTime: initialData?.meetingEndTime || "",
  });

  const toggleAttendee = (
    attendee: string,
    field: "presentDuringMeeting" | "absentDuringMeeting"
  ) => {
    const current = formData[field];
    const otherField =
      field === "presentDuringMeeting"
        ? "absentDuringMeeting"
        : "presentDuringMeeting";

    if (current.includes(attendee)) {
      setFormData({
        ...formData,
        [field]: current.filter((a) => a !== attendee),
      });
    } else {
      // Add to this list and remove from other
      setFormData({
        ...formData,
        [field]: [...current, attendee],
        [otherField]: formData[otherField].filter((a) => a !== attendee),
      });
    }
  };

  async function handleSubmit(e: React.FormEvent, isDraft: boolean = false) {
    e.preventDefault();

    if (isDraft) {
      setIsSavingDraft(true);
    } else {
      setIsLoading(true);
    }

    try {
      const url =
        mode === "edit" && initialData?.id
          ? `/api/art-meetings/${initialData.id}`
          : "/api/art-meetings";

      const method = mode === "edit" ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          intakeId: resident.id,
          meetingMonth: currentMonth,
          meetingYear: currentYear,
          isDraft,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save ART meeting");
      }

      toast({
        title: isDraft ? "Draft Saved" : "Success",
        description: isDraft
          ? "ART meeting draft saved successfully"
          : "ART meeting submitted successfully",
      });

      router.push(`/facility/residents/${resident.id}/art-meetings`);
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save ART meeting",
      });
    } finally {
      setIsLoading(false);
      setIsSavingDraft(false);
    }
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
      {/* Resident Information (Auto-populated) */}
      <Card>
        <CardHeader>
          <CardTitle>Resident Information</CardTitle>
          <CardDescription>
            {monthNames[currentMonth - 1]} {currentYear} ART Meeting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-muted-foreground">Resident Name</Label>
              <p className="font-medium">{resident.residentName}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Date of Birth</Label>
              <p className="font-medium">{formatDate(resident.dateOfBirth)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">AHCCCS ID</Label>
              <p className="font-medium">
                {resident.policyNumber || resident.ahcccsHealthPlan || "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meeting Details */}
      <Card>
        <CardHeader>
          <CardTitle>Meeting Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="meetingDate">Date of Meeting *</Label>
              <Input
                id="meetingDate"
                type="date"
                value={formData.meetingDate}
                onChange={(e) =>
                  setFormData({ ...formData, meetingDate: e.target.value })
                }
                required={!readOnly}
                disabled={readOnly}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="meetingStartTime">Start Time</Label>
              <Input
                id="meetingStartTime"
                type="time"
                value={formData.meetingStartTime}
                onChange={(e) =>
                  setFormData({ ...formData, meetingStartTime: e.target.value })
                }
                disabled={readOnly}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="meetingEndTime">End Time</Label>
              <Input
                id="meetingEndTime"
                type="time"
                value={formData.meetingEndTime}
                onChange={(e) =>
                  setFormData({ ...formData, meetingEndTime: e.target.value })
                }
                disabled={readOnly}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="dxCodes">DX Codes</Label>
            <Textarea
              id="dxCodes"
              value={formData.dxCodes}
              onChange={(e) =>
                setFormData({ ...formData, dxCodes: e.target.value })
              }
              disabled={readOnly}
              placeholder="Enter diagnosis codes..."
              rows={2}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="notesTakenBy">Notes Taken By</Label>
            <Input
              id="notesTakenBy"
              value={formData.notesTakenBy}
              onChange={(e) =>
                setFormData({ ...formData, notesTakenBy: e.target.value })
              }
              disabled={readOnly}
              placeholder="Name of person taking notes"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>Meeting Attendance</CardTitle>
          <CardDescription>
            Select who was present or absent during the meeting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Present During Meeting
              </Label>
              <div className="space-y-2">
                {ART_MEETING_ATTENDEES.map((attendee) => (
                  <div key={`present-${attendee}`} className="flex items-center">
                    <Checkbox
                      id={`present-${attendee}`}
                      checked={formData.presentDuringMeeting.includes(attendee)}
                      onCheckedChange={() =>
                        toggleAttendee(attendee, "presentDuringMeeting")
                      }
                      disabled={readOnly}
                    />
                    <Label
                      htmlFor={`present-${attendee}`}
                      className="ml-2 font-normal cursor-pointer"
                    >
                      {attendee}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold mb-3 block">
                Absent During Meeting
              </Label>
              <div className="space-y-2">
                {ART_MEETING_ATTENDEES.map((attendee) => (
                  <div key={`absent-${attendee}`} className="flex items-center">
                    <Checkbox
                      id={`absent-${attendee}`}
                      checked={formData.absentDuringMeeting.includes(attendee)}
                      onCheckedChange={() =>
                        toggleAttendee(attendee, "absentDuringMeeting")
                      }
                      disabled={readOnly}
                    />
                    <Label
                      htmlFor={`absent-${attendee}`}
                      className="ml-2 font-normal cursor-pointer"
                    >
                      {attendee}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meeting Content */}
      <Card>
        <CardHeader>
          <CardTitle>Meeting Discussion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="focusOfMeeting">Focus of Meeting</Label>
            <Textarea
              id="focusOfMeeting"
              value={formData.focusOfMeeting}
              onChange={(e) =>
                setFormData({ ...formData, focusOfMeeting: e.target.value })
              }
              disabled={readOnly}
              placeholder="What was the main focus of the meeting?"
              rows={3}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="resolutions">Resolutions of the Group</Label>
            <Textarea
              id="resolutions"
              value={formData.resolutions}
              onChange={(e) =>
                setFormData({ ...formData, resolutions: e.target.value })
              }
              disabled={readOnly}
              placeholder="What resolutions were reached?"
              rows={3}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Resident Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Resident Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="strengths">Resident&apos;s Strengths</Label>
            <Textarea
              id="strengths"
              value={formData.strengths}
              onChange={(e) =>
                setFormData({ ...formData, strengths: e.target.value })
              }
              disabled={readOnly}
              placeholder="List the resident's strengths..."
              rows={3}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="barriers">Resident&apos;s Barriers</Label>
            <Textarea
              id="barriers"
              value={formData.barriers}
              onChange={(e) =>
                setFormData({ ...formData, barriers: e.target.value })
              }
              disabled={readOnly}
              placeholder="List the resident's barriers..."
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="whatHasWorked">What Has Worked Before</Label>
              <Textarea
                id="whatHasWorked"
                value={formData.whatHasWorked}
                onChange={(e) =>
                  setFormData({ ...formData, whatHasWorked: e.target.value })
                }
                disabled={readOnly}
                placeholder="What strategies have worked for this resident?"
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="whatHasNotWorked">What Has Not Worked</Label>
              <Textarea
                id="whatHasNotWorked"
                value={formData.whatHasNotWorked}
                onChange={(e) =>
                  setFormData({ ...formData, whatHasNotWorked: e.target.value })
                }
                disabled={readOnly}
                placeholder="What strategies have not worked?"
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals and Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Goals & Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="goals">Goals</Label>
            <Textarea
              id="goals"
              value={formData.goals}
              onChange={(e) =>
                setFormData({ ...formData, goals: e.target.value })
              }
              disabled={readOnly}
              placeholder="What are the resident's goals?"
              rows={3}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="concreteSteps">Concrete Steps</Label>
            <Textarea
              id="concreteSteps"
              value={formData.concreteSteps}
              onChange={(e) =>
                setFormData({ ...formData, concreteSteps: e.target.value })
              }
              disabled={readOnly}
              placeholder="What concrete steps will be taken to achieve goals?"
              rows={3}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="progressIndicators">Ways to Identify Progress</Label>
            <Textarea
              id="progressIndicators"
              value={formData.progressIndicators}
              onChange={(e) =>
                setFormData({ ...formData, progressIndicators: e.target.value })
              }
              disabled={readOnly}
              placeholder="How will progress be measured?"
              rows={3}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Medical & Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Issues & Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="medicalIssues">Medical Issues</Label>
            <Textarea
              id="medicalIssues"
              value={formData.medicalIssues}
              onChange={(e) =>
                setFormData({ ...formData, medicalIssues: e.target.value })
              }
              disabled={readOnly}
              placeholder="Any medical issues to note?"
              rows={3}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="plan">Plan</Label>
            <Textarea
              id="plan"
              value={formData.plan}
              onChange={(e) =>
                setFormData({ ...formData, plan: e.target.value })
              }
              disabled={readOnly}
              placeholder="Overall plan for the resident..."
              rows={3}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {!readOnly && (
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              router.push(`/facility/residents/${resident.id}/art-meetings`)
            }
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={isSavingDraft || isLoading}
            onClick={(e) => handleSubmit(e, true)}
          >
            {isSavingDraft ? "Saving..." : "Save Draft"}
          </Button>
          <Button type="submit" disabled={isLoading || isSavingDraft}>
            {isLoading ? "Submitting..." : "Submit"}
          </Button>
        </div>
      )}
    </form>
  );
}
