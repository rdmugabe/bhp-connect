"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Building2,
  MapPin,
  Phone,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

const decisionSchema = z
  .object({
    status: z.enum(["APPROVED", "REJECTED"]),
    reason: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.status === "REJECTED") {
        return data.reason && data.reason.length >= 10;
      }
      return true;
    },
    {
      message: "Please provide a reason (at least 10 characters) for rejection",
      path: ["reason"],
    }
  );

type DecisionInput = z.infer<typeof decisionSchema>;

interface FacilityApplication {
  id: string;
  facilityName: string;
  facilityAddress: string;
  facilityPhone: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  decisionReason: string | null;
  decidedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    approvalStatus: string;
  };
}

export default function FacilityApplicationReviewPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [application, setApplication] = useState<FacilityApplication | null>(
    null
  );

  const form = useForm<DecisionInput>({
    resolver: zodResolver(decisionSchema),
    defaultValues: {
      status: "APPROVED",
      reason: "",
    },
  });

  useEffect(() => {
    async function fetchApplication() {
      try {
        const response = await fetch(
          `/api/bhp/facility-applications/${params.id}`
        );
        if (!response.ok) throw new Error("Failed to fetch application");
        const data = await response.json();
        setApplication(data.application);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load application details",
        });
      }
    }
    fetchApplication();
  }, [params.id, toast]);

  async function onSubmit(data: DecisionInput) {
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/bhp/facility-applications/${params.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to submit decision");
      }

      toast({
        title:
          data.status === "APPROVED"
            ? "Application Approved"
            : "Application Rejected",
        description:
          data.status === "APPROVED"
            ? "The facility has been created and the user can now access the system."
            : "The application has been rejected.",
      });

      router.push("/bhp/applications");
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to submit decision",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (!application) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/bhp/applications">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Application Review
          </h1>
          <p className="text-muted-foreground">
            Facility Registration Request
          </p>
        </div>
        <Badge
          variant={
            application.status === "APPROVED"
              ? "success"
              : application.status === "REJECTED"
              ? "danger"
              : "warning"
          }
        >
          {application.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Applicant Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Applicant Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{application.user.name}</h3>
                <p className="text-sm text-muted-foreground">
                  BHRF Applicant
                </p>
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{application.user.email}</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Applied On</p>
                <p className="font-medium">
                  {formatDate(application.createdAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Facility Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Proposed Facility
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Facility Name</p>
              <p className="font-medium text-lg">{application.facilityName}</p>
            </div>
            <Separator />
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span>{application.facilityAddress}</span>
            </div>
            {application.facilityPhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{application.facilityPhone}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Decision Section */}
      {application.status === "PENDING" ? (
        <Card>
          <CardHeader>
            <CardTitle>Make Decision</CardTitle>
            <CardDescription>
              Review the application details above and approve or reject this
              facility registration request.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Reason for Decision{" "}
                        <span className="text-muted-foreground font-normal">
                          (optional for approval, required for rejection)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a reason for your decision..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    onClick={() => form.setValue("status", "APPROVED")}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Application
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    onClick={() => form.setValue("status", "REJECTED")}
                    disabled={isLoading}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Application
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Decision</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    application.status === "APPROVED" ? "success" : "danger"
                  }
                >
                  {application.status}
                </Badge>
                {application.decidedAt && (
                  <span className="text-sm text-muted-foreground">
                    on {formatDate(application.decidedAt)}
                  </span>
                )}
              </div>
              {application.decisionReason && (
                <p className="text-sm mt-2">{application.decisionReason}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
