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
import { ArrowLeft, CheckCircle, XCircle, User, Mail, Phone, MapPin } from "lucide-react";
import { formatDate } from "@/lib/utils";

const approvalDecisionSchema = z
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

type ApprovalDecisionInput = z.infer<typeof approvalDecisionSchema>;

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  createdAt: string;
  bhpProfile: {
    id: string;
    phone: string | null;
    address: string | null;
    bio: string | null;
  } | null;
}

export default function UserReviewPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  const form = useForm<ApprovalDecisionInput>({
    resolver: zodResolver(approvalDecisionSchema),
    defaultValues: {
      status: "APPROVED",
      reason: "",
    },
  });

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch(`/api/admin/users/${params.id}`);
        if (!response.ok) throw new Error("Failed to fetch user");
        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load user details",
        });
      }
    }
    fetchUser();
  }, [params.id, toast]);

  async function onSubmit(data: ApprovalDecisionInput) {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${params.id}/approval`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to submit decision");
      }

      toast({
        title: data.status === "APPROVED" ? "User Approved" : "User Rejected",
        description: `The user has been ${data.status.toLowerCase()}.`,
      });

      router.push("/admin/users/pending");
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/users/pending">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">User Review</h1>
          <p className="text-muted-foreground">BHP Registration Request</p>
        </div>
        <Badge
          variant={
            user.approvalStatus === "APPROVED"
              ? "success"
              : user.approvalStatus === "REJECTED"
              ? "danger"
              : "warning"
          }
        >
          {user.approvalStatus}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{user.name}</h3>
                <p className="text-muted-foreground">
                  <Badge variant="outline">{user.role}</Badge>
                </p>
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
              {user.bhpProfile?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{user.bhpProfile.phone}</span>
                </div>
              )}
              {user.bhpProfile?.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{user.bhpProfile.address}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Registration Details */}
        <Card>
          <CardHeader>
            <CardTitle>Registration Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Registered On</p>
              <p className="font-medium">{formatDate(user.createdAt)}</p>
            </div>
            {user.bhpProfile?.bio && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Bio</p>
                  <p className="text-sm">{user.bhpProfile.bio}</p>
                </div>
              </>
            )}
            {user.approvalStatus !== "PENDING" && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Decision Date
                  </p>
                  <p className="font-medium">
                    {user.approvedAt ? formatDate(user.approvedAt) : "-"}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Decision Section */}
      {user.approvalStatus === "PENDING" ? (
        <Card>
          <CardHeader>
            <CardTitle>Make Decision</CardTitle>
            <CardDescription>
              Review the user information above and approve or reject this BHP registration.
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
                    Approve User
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    onClick={() => form.setValue("status", "REJECTED")}
                    disabled={isLoading}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject User
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
                    user.approvalStatus === "APPROVED" ? "success" : "danger"
                  }
                >
                  {user.approvalStatus}
                </Badge>
                {user.approvedAt && (
                  <span className="text-sm text-muted-foreground">
                    on {formatDate(user.approvedAt)}
                  </span>
                )}
              </div>
              {user.rejectionReason && (
                <p className="text-sm mt-2">{user.rejectionReason}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
