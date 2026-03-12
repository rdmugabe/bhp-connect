import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { EmarDashboard } from "@/components/emar";

export const metadata: Metadata = {
  title: "eMAR Dashboard | BHP Connect",
  description: "Electronic Medication Administration Record Dashboard",
};

export default async function EmarDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Only BHRF and ADMIN can access
  if (session.user.role !== "BHRF" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <EmarDashboard />
    </div>
  );
}
