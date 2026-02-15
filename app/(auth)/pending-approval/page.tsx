"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, XCircle, LogOut } from "lucide-react";

export default function PendingApprovalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div>Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const isRejected = session.user.approvalStatus === "REJECTED";
  const isBHRF = session.user.role === "BHRF";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          {isRejected ? (
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          ) : (
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          )}
          <CardTitle className="text-2xl font-bold">
            {isRejected ? "Registration Rejected" : "Pending Approval"}
          </CardTitle>
          <CardDescription>
            {isRejected
              ? "Your registration has been rejected."
              : isBHRF
              ? "Your facility application is under review."
              : "Your account is awaiting administrator approval."}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {isRejected ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                Unfortunately, your registration request was not approved. If you
                believe this was a mistake, please contact support for assistance.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Hello, {session.user.name}!</strong>
                </p>
                <p className="text-sm text-blue-800 mt-2">
                  {isBHRF
                    ? "The BHP you selected during registration will review your facility application and approve your access."
                    : "A system administrator will review your registration and approve your access."}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                You will be able to access the system once your account has been
                approved. Please check back later.
              </p>
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Signed in as {session.user.email}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
