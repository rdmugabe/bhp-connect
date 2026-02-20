"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Upload, X, Plus, FileText, Users } from "lucide-react";
import { formatBiWeekLabel, getBiWeekNumber } from "@/lib/utils";

interface StaffParticipant {
  name: string;
  position: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
}

interface OversightTrainingFormProps {
  employees?: Employee[];
}

export function OversightTrainingForm({ employees = [] }: OversightTrainingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    trainingDate: "",
    conductedBy: "",
    staffParticipants: [] as StaffParticipant[],
    notes: "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const biWeekInfo = formData.trainingDate
    ? (() => {
        const date = new Date(formData.trainingDate);
        const biWeek = getBiWeekNumber(date);
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const year = d.getUTCFullYear();
        return { biWeek, year };
      })()
    : null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Only PDF and image files are allowed.",
      });
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "File size must be less than 10MB.",
      });
      return;
    }

    setFile(selectedFile);
  };

  const addStaffParticipant = () => {
    setFormData({
      ...formData,
      staffParticipants: [
        ...formData.staffParticipants,
        { name: "", position: "" },
      ],
    });
  };

  const removeStaffParticipant = (index: number) => {
    const updated = formData.staffParticipants.filter((_, i) => i !== index);
    setFormData({ ...formData, staffParticipants: updated });
  };

  const updateStaffParticipant = (
    index: number,
    field: keyof StaffParticipant,
    value: string
  ) => {
    const updated = [...formData.staffParticipants];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, staffParticipants: updated });
  };

  const addAllEmployees = () => {
    const existingNames = new Set(formData.staffParticipants.map(p => p.name.toLowerCase()));
    const newParticipants = employees
      .filter(emp => !existingNames.has(`${emp.firstName} ${emp.lastName}`.toLowerCase()))
      .map(emp => ({
        name: `${emp.firstName} ${emp.lastName}`,
        position: emp.position,
      }));

    if (newParticipants.length === 0) {
      toast({
        title: "No new employees to add",
        description: "All employees are already in the participants list.",
      });
      return;
    }

    setFormData({
      ...formData,
      staffParticipants: [...formData.staffParticipants, ...newParticipants],
    });

    toast({
      title: "Employees added",
      description: `Added ${newParticipants.length} employee(s) to participants.`,
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!file) {
        throw new Error("Please upload a signed training document");
      }

      if (formData.staffParticipants.filter(p => p.name.trim()).length === 0) {
        throw new Error("At least one staff participant is required");
      }

      const submitFormData = new FormData();
      submitFormData.append("file", file);
      submitFormData.append(
        "data",
        JSON.stringify({
          ...formData,
          staffParticipants: formData.staffParticipants.filter(p => p.name.trim()),
        })
      );

      const response = await fetch("/api/oversight-training-reports", {
        method: "POST",
        body: submitFormData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit report");
      }

      toast({
        title: "Success",
        description: "Oversight training report submitted successfully",
      });

      router.push("/facility/admin-tasks/oversight-training");
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to submit report",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Training Information */}
      <Card>
        <CardHeader>
          <CardTitle>Training Information</CardTitle>
          <CardDescription>
            Enter the details about the oversight training session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="trainingDate">Training Date *</Label>
              <Input
                id="trainingDate"
                type="date"
                value={formData.trainingDate}
                onChange={(e) =>
                  setFormData({ ...formData, trainingDate: e.target.value })
                }
                required
                className="mt-1"
              />
              {biWeekInfo && (
                <p className="text-sm text-muted-foreground mt-1">
                  Bi-Week {biWeekInfo.biWeek}: {formatBiWeekLabel(biWeekInfo.biWeek, biWeekInfo.year)}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="conductedBy">Conducted By *</Label>
              <Input
                id="conductedBy"
                value={formData.conductedBy}
                onChange={(e) =>
                  setFormData({ ...formData, conductedBy: e.target.value })
                }
                required
                className="mt-1"
                placeholder="Name of trainer/facilitator"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Participants */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Staff Participants
              </CardTitle>
              <CardDescription>
                List all staff members who participated in the training
              </CardDescription>
            </div>
            {employees.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAllEmployees}
              >
                Add All Employees
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.staffParticipants.map((participant, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  value={participant.name}
                  onChange={(e) =>
                    updateStaffParticipant(index, "name", e.target.value)
                  }
                  placeholder="Staff name *"
                />
              </div>
              <div className="flex-1">
                <Input
                  value={participant.position}
                  onChange={(e) =>
                    updateStaffParticipant(index, "position", e.target.value)
                  }
                  placeholder="Position (optional)"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeStaffParticipant(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addStaffParticipant}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Staff Participant
          </Button>
          {formData.staffParticipants.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No staff participants added yet. Add at least one participant.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Document Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Signed Training Document *
          </CardTitle>
          <CardDescription>
            Upload the completed and signed oversight training document (PDF or image)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : file
                ? "border-green-500 bg-green-50"
                : "border-muted-foreground/25"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-2">
                <FileText className="h-12 w-12 mx-auto text-green-600" />
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="font-medium">
                  Drag and drop your document here, or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  PDF, PNG, JPG, or GIF up to 10MB
                </p>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.gif"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button type="button" variant="outline" asChild>
                    <span>Select File</span>
                  </Button>
                </label>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
          <CardDescription>
            Add any additional notes or observations (optional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Enter any additional notes about the training session..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-4 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/facility/admin-tasks/oversight-training")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Submitting..." : "Submit Report"}
        </Button>
      </div>
    </form>
  );
}
