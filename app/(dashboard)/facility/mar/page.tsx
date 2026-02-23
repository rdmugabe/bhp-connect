"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Download, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
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
import { useToast } from "@/components/ui/use-toast";
import { marHeaderSchema, MARHeaderInput } from "@/lib/validations";

interface Resident {
  id: string;
  residentName: string;
  dateOfBirth: string;
  admissionDate: string | null;
  policyNumber: string | null;
}

interface Facility {
  name: string;
}

export default function MARPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [facility, setFacility] = useState<Facility | null>(null);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);

  const currentMonth = format(new Date(), "MM/yyyy");

  const form = useForm<MARHeaderInput>({
    resolver: zodResolver(marHeaderSchema),
    defaultValues: {
      facilityName: "",
      monthYear: currentMonth,
      residentName: "",
      dateOfBirth: "",
      admitDate: "",
      allergies: "",
      ahcccsId: "",
      diagnosis: "",
      emergencyContact: "",
      prescriberName: "",
      prescriberPhone: "",
      pharmacyName: "",
      pharmacyPhone: "",
    },
  });

  // Fetch residents and facility info
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch residents
        const residentsResponse = await fetch("/api/intakes?status=APPROVED");
        if (residentsResponse.ok) {
          const data = await residentsResponse.json();
          setResidents(data.intakes || []);
        }

        // Fetch facility info
        const facilityResponse = await fetch("/api/facility");
        if (facilityResponse.ok) {
          const data = await facilityResponse.json();
          setFacility(data);
          form.setValue("facilityName", data.name);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    }
    fetchData();
  }, [form]);

  // Handle resident selection
  const handleResidentSelect = (residentId: string) => {
    if (residentId === "manual") {
      setSelectedResident(null);
      form.setValue("intakeId", undefined);
      form.setValue("residentName", "");
      form.setValue("dateOfBirth", "");
      form.setValue("admitDate", "");
      form.setValue("ahcccsId", "");
      return;
    }

    const resident = residents.find((r) => r.id === residentId);
    if (resident) {
      setSelectedResident(resident);
      form.setValue("intakeId", resident.id);
      form.setValue("residentName", resident.residentName);
      form.setValue("dateOfBirth", resident.dateOfBirth ? format(new Date(resident.dateOfBirth), "yyyy-MM-dd") : "");
      form.setValue("admitDate", resident.admissionDate ? format(new Date(resident.admissionDate), "yyyy-MM-dd") : "");
      form.setValue("ahcccsId", resident.policyNumber || "");
    }
  };

  const onSubmit = async (data: MARHeaderInput) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/mar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate MAR");
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `MAR-${data.residentName.replace(/\s+/g, "-")}-${data.monthYear.replace("/", "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "MAR PDF has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate MAR",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Medication Administration Record (MAR)</h1>
        <p className="text-muted-foreground">
          Generate a downloadable MAR form for a resident
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Resident Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Resident</CardTitle>
              <CardDescription>
                Select an existing resident to prefill information or enter manually
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedResident?.id || "manual"}
                onValueChange={handleResidentSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a resident" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Enter manually</SelectItem>
                  {residents.map((resident) => (
                    <SelectItem key={resident.id} value={resident.id}>
                      {resident.residentName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Facility & Month */}
          <Card>
            <CardHeader>
              <CardTitle>Facility Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="facilityName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facility Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="monthYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Month/Year *</FormLabel>
                    <FormControl>
                      <Input placeholder="MM/YYYY" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Resident Information */}
          <Card>
            <CardHeader>
              <CardTitle>Resident Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="residentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resident Name *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!!selectedResident} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={!!selectedResident} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="admitDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admit Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={!!selectedResident} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ahcccsId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>AHCCCS ID</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!!selectedResident} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="allergies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allergies</FormLabel>
                    <FormControl>
                      <Input placeholder="NKDA if none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="diagnosis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diagnosis (Dx)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emergencyContact"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Emergency Contact</FormLabel>
                    <FormControl>
                      <Input placeholder="Name and phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Prescriber Information */}
          <Card>
            <CardHeader>
              <CardTitle>Prescriber Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="prescriberName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prescriber Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="prescriberPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prescriber Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Pharmacy Information */}
          <Card>
            <CardHeader>
              <CardTitle>Pharmacy Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pharmacyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pharmacy Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pharmacyPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pharmacy Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading} size="lg">
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download MAR PDF
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
