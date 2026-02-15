"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Settings, User, Shield } from "lucide-react";
import { NotificationBell } from "./notification-bell";

interface DashboardHeaderProps {
  user: {
    name: string;
    email: string;
    role: string;
    mfaEnabled: boolean;
  };
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">BHP</span>
            </div>
            <span className="font-semibold text-lg hidden sm:inline">
              BHP Connect
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {user.role === "ADMIN"
              ? "System Administrator"
              : user.role === "BHP"
              ? "Behavioral Health Professional"
              : "Residential Facility"}
          </span>

          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href={
                    user.role === "ADMIN"
                      ? "/admin"
                      : user.role === "BHP"
                      ? "/bhp/profile"
                      : "/facility/profile"
                  }
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  {user.role === "ADMIN" ? "Dashboard" : "Profile"}
                </Link>
              </DropdownMenuItem>
              {user.role !== "ADMIN" && (
                <DropdownMenuItem asChild>
                  <Link
                    href={
                      user.role === "BHP" ? "/bhp/settings" : "/facility/settings"
                    }
                    className="cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
              )}
              {!user.mfaEnabled && (
                <DropdownMenuItem asChild>
                  <Link href="/mfa-setup" className="cursor-pointer">
                    <Shield className="mr-2 h-4 w-4" />
                    Enable MFA
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:text-red-600"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
