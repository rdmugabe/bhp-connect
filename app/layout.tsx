import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/auth/auth-provider";
import { validateEnv } from "@/lib/env";

// Fail fast on misconfiguration: validate required env vars when this server
// module first loads (memoized). Throws a clear, aggregated error listing any
// missing/invalid vars instead of failing deep inside a later request.
validateEnv();

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BHP Connect",
  description: "HIPAA-compliant behavioral health consulting platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
