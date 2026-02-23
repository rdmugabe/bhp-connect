"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Download, FileText, Loader2, Users, UserPlus, ClipboardSignature } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function OnboardingPage() {
  // Resident state
  const [residentName, setResidentName] = useState("");
  const [isGeneratingResident, setIsGeneratingResident] = useState(false);

  // Employee state
  const [employeeName, setEmployeeName] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [isGeneratingEmployee, setIsGeneratingEmployee] = useState(false);

  // Release of Information state
  const [roiName, setRoiName] = useState("");
  const [roiDob, setRoiDob] = useState("");
  const [roiPhone, setRoiPhone] = useState("");
  const [discloseFromName, setDiscloseFromName] = useState("");
  const [discloseFromAddress, setDiscloseFromAddress] = useState("");
  const [isGeneratingRoi, setIsGeneratingRoi] = useState(false);

  const { toast } = useToast();

  const handleGenerateResidentPDF = async () => {
    if (!residentName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a resident name",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingResident(true);
    try {
      const response = await fetch("/api/onboarding/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ residentName: residentName.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${residentName.trim().replace(/\s+/g, "_")}_Onboarding_Packet.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Resident onboarding packet generated successfully!",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate onboarding packet",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingResident(false);
    }
  };

  const handleGenerateEmployeePDF = async () => {
    if (!employeeName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an employee name",
        variant: "destructive",
      });
      return;
    }

    if (!hireDate) {
      toast({
        title: "Error",
        description: "Please enter a hire date",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingEmployee(true);
    try {
      const response = await fetch("/api/onboarding/employee/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeName: employeeName.trim(),
          hireDate: hireDate,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${employeeName.trim().replace(/\s+/g, "_")}_Employee_Packet.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Employee onboarding packet generated successfully!",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate employee onboarding packet",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingEmployee(false);
    }
  };

  const handleGenerateRoiPDF = async () => {
    if (!roiName.trim()) {
      toast({
        title: "Error",
        description: "Please enter the full name",
        variant: "destructive",
      });
      return;
    }

    if (!roiDob) {
      toast({
        title: "Error",
        description: "Please enter the date of birth",
        variant: "destructive",
      });
      return;
    }

    if (!roiPhone.trim()) {
      toast({
        title: "Error",
        description: "Please enter a phone number",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingRoi(true);
    try {
      const response = await fetch("/api/onboarding/roi/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientName: roiName.trim(),
          dateOfBirth: roiDob,
          phone: roiPhone.trim(),
          discloseFromName: discloseFromName.trim(),
          discloseFromContact: discloseFromAddress.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Release_of_Information_${roiName.trim().replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Release of Information form generated successfully!",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate Release of Information form",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingRoi(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Onboarding</h1>
        <p className="text-muted-foreground">
          Generate onboarding documents for new residents and employees
        </p>
      </div>

      <Tabs defaultValue="resident" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="resident" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Residents
          </TabsTrigger>
          <TabsTrigger value="employee" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Employees
          </TabsTrigger>
          <TabsTrigger value="roi" className="flex items-center gap-2">
            <ClipboardSignature className="h-4 w-4" />
            Release of Info
          </TabsTrigger>
        </TabsList>

        {/* Resident Onboarding Tab */}
        <TabsContent value="resident" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Generate Resident Packet
                </CardTitle>
                <CardDescription>
                  Enter the resident&apos;s name to generate a complete onboarding
                  document packet with their information pre-filled.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="residentName">Resident Full Name</Label>
                  <Input
                    id="residentName"
                    placeholder="Enter resident's full name"
                    value={residentName}
                    onChange={(e) => setResidentName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleGenerateResidentPDF();
                      }
                    }}
                  />
                </div>
                <Button
                  onClick={handleGenerateResidentPDF}
                  disabled={isGeneratingResident || !residentName.trim()}
                  className="w-full"
                >
                  {isGeneratingResident ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Generate & Download PDF
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Included Documents</CardTitle>
                <CardDescription>
                  The resident onboarding packet includes:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Resident File Index Contents
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Resident Information Cover Sheet
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Consent for Treatment
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Resident Rights
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    House Rules
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Contraband Policy
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Orientation to Agency
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Property Disclaimer
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Confidentiality of Resident Records
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Internal Resident Disclosure List
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Photograph & Video Release Form
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Verification of Participation Request
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Behavioral Contract
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Advanced Directives
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Service Plan Rights Acknowledgment
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Employee Onboarding Tab */}
        <TabsContent value="employee" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Generate Employee Packet
                </CardTitle>
                <CardDescription>
                  Enter the employee&apos;s name and hire date to generate a complete
                  onboarding document packet with their information pre-filled.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeName">Employee Full Name</Label>
                  <Input
                    id="employeeName"
                    placeholder="Enter employee's full name"
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hireDate">Hire Date</Label>
                  <Input
                    id="hireDate"
                    type="date"
                    value={hireDate}
                    onChange={(e) => setHireDate(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleGenerateEmployeePDF();
                      }
                    }}
                  />
                </div>
                <Button
                  onClick={handleGenerateEmployeePDF}
                  disabled={isGeneratingEmployee || !employeeName.trim() || !hireDate}
                  className="w-full"
                >
                  {isGeneratingEmployee ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Generate & Download PDF
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Included Documents</CardTitle>
                <CardDescription>
                  The employee onboarding packet includes:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Employee File Index
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Employee Application
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Employment Contract
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Job Description and Qualifications (BHT)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Reference Check Form
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Confidentiality Agreement
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Verification of Skills
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    New Employee Orientation
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Medication Administration Training
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Onboarding Checklist Training
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Employee Packet Acknowledgment
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Release of Information Tab */}
        <TabsContent value="roi" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardSignature className="h-5 w-5 text-primary" />
                  Generate Release of Information
                </CardTitle>
                <CardDescription>
                  Enter the patient&apos;s information to generate a HIPAA-compliant
                  Release of Information authorization form.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roiName">Full Name</Label>
                  <Input
                    id="roiName"
                    placeholder="Enter patient's full name"
                    value={roiName}
                    onChange={(e) => setRoiName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roiDob">Date of Birth</Label>
                  <Input
                    id="roiDob"
                    type="date"
                    value={roiDob}
                    onChange={(e) => setRoiDob(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roiPhone">Phone Number</Label>
                  <Input
                    id="roiPhone"
                    placeholder="Enter phone number"
                    value={roiPhone}
                    onChange={(e) => setRoiPhone(e.target.value)}
                  />
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium mb-3">Disclose From (Sending Facility)</p>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="discloseFromName">Facility Name</Label>
                      <Input
                        id="discloseFromName"
                        placeholder="Enter sending facility name"
                        value={discloseFromName}
                        onChange={(e) => setDiscloseFromName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discloseFromAddress">Address/Phone/Fax</Label>
                      <Input
                        id="discloseFromAddress"
                        placeholder="Enter address, phone, or fax"
                        value={discloseFromAddress}
                        onChange={(e) => setDiscloseFromAddress(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleGenerateRoiPDF();
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleGenerateRoiPDF}
                  disabled={isGeneratingRoi || !roiName.trim() || !roiDob || !roiPhone.trim()}
                  className="w-full"
                >
                  {isGeneratingRoi ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Generate & Download PDF
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>About This Form</CardTitle>
                <CardDescription>
                  The Release of Information form includes:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Patient Information (pre-filled)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Disclosure Authorization (From/To)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Information Types Selection
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Sensitive Information Authorization
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Date Range and Purpose
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Expiration Options
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Patient Rights Acknowledgment
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Signature Lines
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground">
                    This form complies with HIPAA (45 CFR 164.508) and 42 CFR Part 2
                    requirements for protected health information disclosure.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
