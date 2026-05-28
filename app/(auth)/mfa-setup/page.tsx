"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { useToast } from "@/components/ui/use-toast";

const mfaVerifySchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});

type MfaVerifyInput = z.infer<typeof mfaVerifySchema>;

export default function MfaSetupPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

  const form = useForm<MfaVerifyInput>({
    resolver: zodResolver(mfaVerifySchema),
    defaultValues: {
      code: "",
    },
  });

  useEffect(() => {
    if (!session) {
      router.push("/login");
      return;
    }

    // Generate MFA secret
    async function generateMfa() {
      try {
        const response = await fetch("/api/auth/mfa/generate", {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("Failed to generate MFA");
        }

        const data = await response.json();
        setQrCode(data.qrCode);
        setSecret(data.secret);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to generate MFA setup. Please try again.",
        });
      }
    }

    generateMfa();
  }, [session, router, toast]);

  async function onSubmit(data: MfaVerifyInput) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: data.code }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Verification failed");
      }

      // Update session
      await update();

      toast({
        title: "MFA Enabled",
        description: "Two-factor authentication has been enabled for your account.",
      });

      router.push(session?.user.role === "BHP" ? "/bhp" : "/facility");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description:
          error instanceof Error ? error.message : "Invalid code. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Set Up Two-Factor Authentication
          </CardTitle>
          <CardDescription className="text-center">
            Scan the QR code with your authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {qrCode && (
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <Image
                  src={qrCode}
                  alt="MFA QR Code"
                  width={200}
                  height={200}
                  className="mx-auto"
                />
              </div>
              {secret && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    Or enter this code manually:
                  </p>
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                    {secret}
                  </code>
                </div>
              )}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Code</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Enable MFA"}
              </Button>
            </form>
          </Form>

          <Button
            variant="ghost"
            className="w-full"
            onClick={() =>
              router.push(session?.user.role === "BHP" ? "/bhp" : "/facility")
            }
          >
            Skip for now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
