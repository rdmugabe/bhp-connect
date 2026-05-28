import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        mfaCode: { label: "MFA Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: {
            bhpProfile: true,
            bhrfProfile: {
              include: {
                facility: true,
              },
            },
          },
        });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        // Block deactivated users
        if (!user.isActive) {
          throw new Error("Account has been deactivated. Please contact your facility admin.");
        }

        // Check MFA if enabled
        if (user.mfaEnabled && user.mfaSecret) {
          if (!credentials.mfaCode) {
            throw new Error("MFA_REQUIRED");
          }

          const isValidToken = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: "base32",
            token: credentials.mfaCode,
            window: 1,
          });

          if (!isValidToken) {
            throw new Error("Invalid MFA code");
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          mfaEnabled: user.mfaEnabled,
          approvalStatus: user.approvalStatus,
          bhpProfileId: user.bhpProfile?.id || null,
          bhrfProfileId: user.bhrfProfile?.id || null,
          facilityId: user.bhrfProfile?.facilityId || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.mfaEnabled = user.mfaEnabled;
        token.approvalStatus = user.approvalStatus;
        token.bhpProfileId = user.bhpProfileId;
        token.bhrfProfileId = user.bhrfProfileId;
        token.facilityId = user.facilityId;
      } else if (trigger === "update" && token.id) {
        // Refresh volatile claims from the DB (e.g. after the user enrolls in
        // MFA, gets approved, or is deactivated) so the MFA enrollment gate
        // and approval checks see current state without requiring re-login.
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { mfaEnabled: true, approvalStatus: true, isActive: true },
        });
        if (dbUser) {
          token.mfaEnabled = dbUser.mfaEnabled;
          token.approvalStatus = dbUser.approvalStatus;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.mfaEnabled = token.mfaEnabled as boolean;
        session.user.approvalStatus = token.approvalStatus as string;
        session.user.bhpProfileId = token.bhpProfileId as string | null;
        session.user.bhrfProfileId = token.bhrfProfileId as string | null;
        session.user.facilityId = token.facilityId as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Type augmentation for NextAuth
declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    mfaEnabled: boolean;
    approvalStatus: string;
    bhpProfileId: string | null;
    bhrfProfileId: string | null;
    facilityId: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      mfaEnabled: boolean;
      approvalStatus: string;
      bhpProfileId: string | null;
      bhrfProfileId: string | null;
      facilityId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    mfaEnabled: boolean;
    approvalStatus: string;
    bhpProfileId: string | null;
    bhrfProfileId: string | null;
    facilityId: string | null;
  }
}
