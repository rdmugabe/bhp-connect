"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface AvailableBHP {
  id: string;
  name: string;
  address: string | null;
}

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [availableBHPs, setAvailableBHPs] = useState<AvailableBHP[]>([]);
  const [loadingBHPs, setLoadingBHPs] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      role: "BHP",
      phone: "",
      address: "",
      bio: "",
      selectedBhpId: "",
      facilityName: "",
      facilityAddress: "",
      facilityPhone: "",
    },
  });

  const watchRole = form.watch("role");

  // Fetch available BHPs when BHRF role is selected
  useEffect(() => {
    if (watchRole === "BHRF") {
      setLoadingBHPs(true);
      fetch("/api/bhps/available")
        .then((res) => res.json())
        .then((data) => {
          setAvailableBHPs(data.bhps || []);
        })
        .catch((error) => {
          console.error("Failed to fetch BHPs:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load available BHPs",
          });
        })
        .finally(() => {
          setLoadingBHPs(false);
        });
    }
  }, [watchRole, toast]);

  async function onSubmit(data: RegisterInput) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Registration failed");
      }

      const approvalMessage =
        data.role === "BHRF"
          ? "Your facility application has been submitted. The BHP you selected will review and approve your access."
          : "Your registration has been submitted. An administrator will review and approve your account.";

      toast({
        title: "Registration Submitted",
        description: approvalMessage,
      });

      router.push("/login");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Create an Account
          </CardTitle>
          <CardDescription className="text-center">
            Register as a BHP (Behavioral Health Professional) or BHRF (Behavioral
            Health Residential Facility)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BHP">
                          BHP - Behavioral Health Professional
                        </SelectItem>
                        <SelectItem value="BHRF">
                          BHRF - Residential Facility
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {watchRole === "BHP"
                        ? "BHPs manage facilities and review prescreens"
                        : "BHRFs submit prescreens and manage facility documents"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {watchRole === "BHP" && (
                <>
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="(555) 123-4567"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Address (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St, Phoenix, AZ" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about your practice..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      BHP registrations require administrator approval before you can access the system.
                    </AlertDescription>
                  </Alert>
                </>
              )}

              {watchRole === "BHRF" && (
                <>
                  <FormField
                    control={form.control}
                    name="selectedBhpId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select BHP</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={loadingBHPs}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  loadingBHPs
                                    ? "Loading BHPs..."
                                    : "Select a BHP to register under"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableBHPs.length === 0 ? (
                              <div className="p-2 text-sm text-muted-foreground text-center">
                                No approved BHPs available
                              </div>
                            ) : (
                              availableBHPs.map((bhp) => (
                                <SelectItem key={bhp.id} value={bhp.id}>
                                  {bhp.name}
                                  {bhp.address && ` - ${bhp.address}`}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Your facility will be registered under this BHP
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="facilityName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facility Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Sunrise Care Home" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="facilityAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facility Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="456 Oak Street, Phoenix, AZ 85001"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="facilityPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facility Phone (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="(555) 987-6543"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Your facility application will be reviewed by the selected BHP before you can access the system.
                    </AlertDescription>
                  </Alert>
                </>
              )}

              <Button type="submit" className="w-full" disabled={isLoading || (watchRole === "BHRF" && availableBHPs.length === 0)}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-sm text-muted-foreground text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
