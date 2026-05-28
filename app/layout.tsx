import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/auth/auth-provider";
import { validateEnv } from "@/lib/env";

// Fail fast on misconfiguration at RUNTIME (server start / first request),
// memoized. Skipped during `next build` — build environments don't always
// have runtime secrets present, and a missing runtime var must never break
// the production build.
if (process.env.NEXT_PHASE !== "phase-production-build") {
  validateEnv();
}

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
