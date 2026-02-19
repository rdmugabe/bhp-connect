"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Building2,
  FileText,
  FolderOpen,
  MessageSquare,
  Award,
  Users,
  Users2,
  ClipboardList,
  UserCheck,
  Video,
  Activity,
  UserPlus,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  showBadge?: "messages" | "applications" | "intakes" | "asam" | "meetings";
}

const bhpNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/bhp",
    icon: LayoutDashboard,
  },
  {
    title: "Residents",
    href: "/bhp/residents",
    icon: Users,
  },
  {
    title: "Applications",
    href: "/bhp/applications",
    icon: ClipboardList,
    showBadge: "applications",
  },
  {
    title: "Facilities",
    href: "/bhp/facilities",
    icon: Building2,
  },
  {
    title: "Intakes",
    href: "/bhp/intakes",
    icon: FileText,
  },
  {
    title: "ASAM Assessments",
    href: "/bhp/asam",
    icon: Activity,
  },
  {
    title: "Credentials",
    href: "/bhp/credentials",
    icon: Award,
  },
  {
    title: "Documents",
    href: "/bhp/documents",
    icon: FolderOpen,
  },
  {
    title: "Messages",
    href: "/bhp/messages",
    icon: MessageSquare,
    showBadge: "messages",
  },
  {
    title: "Meetings",
    href: "/bhp/meetings",
    icon: Video,
    showBadge: "meetings",
  },
];

const bhrfNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/facility",
    icon: LayoutDashboard,
  },
  {
    title: "Residents",
    href: "/facility/residents",
    icon: Users2,
  },
  {
    title: "Onboarding",
    href: "/facility/onboarding",
    icon: UserPlus,
  },
  {
    title: "Intakes",
    href: "/facility/intakes",
    icon: FileText,
  },
  {
    title: "ASAM Assessments",
    href: "/facility/asam",
    icon: Activity,
  },
  {
    title: "Documents",
    href: "/facility/documents",
    icon: FolderOpen,
  },
  {
    title: "Employees",
    href: "/facility/employees",
    icon: Users,
  },
  {
    title: "Messages",
    href: "/facility/messages",
    icon: MessageSquare,
    showBadge: "messages",
  },
  {
    title: "Meetings",
    href: "/facility/meetings",
    icon: Video,
    showBadge: "meetings",
  },
  {
    title: "BHP Info",
    href: "/facility/bhp",
    icon: UserCheck,
  },
];

const adminNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Pending Users",
    href: "/admin/users/pending",
    icon: UserCheck,
    showBadge: "applications",
  },
];

interface BadgeCounts {
  messages: number;
  applications: number;
  intakes: number;
  asam: number;
  meetings: number;
}

interface DashboardNavProps {
  role: string;
}

export function DashboardNav({ role }: DashboardNavProps) {
  const pathname = usePathname();
  const [badgeCounts, setBadgeCounts] = useState<BadgeCounts>({
    messages: 0,
    applications: 0,
    intakes: 0,
    asam: 0,
    meetings: 0,
  });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await fetch("/api/notifications/counts");
        if (response.ok) {
          const data = await response.json();
          setBadgeCounts(data);
        }
      } catch (error) {
        console.error("Failed to fetch badge counts:", error);
      }
    };

    fetchCounts();
    // Refresh every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  let navItems: NavItem[];
  if (role === "ADMIN") {
    navItems = adminNavItems;
  } else if (role === "BHP") {
    navItems = bhpNavItems;
  } else {
    navItems = bhrfNavItems;
  }

  return (
    <nav className="hidden md:flex w-64 flex-col border-r bg-white min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/bhp" &&
              item.href !== "/facility" &&
              item.href !== "/admin" &&
              pathname.startsWith(item.href));

          const badgeCount = item.showBadge ? badgeCounts[item.showBadge] : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1">{item.title}</span>
              {badgeCount > 0 && (
                <Badge
                  variant={isActive ? "secondary" : "destructive"}
                  className={cn(
                    "ml-auto h-5 min-w-[20px] px-1.5 text-xs font-bold",
                    isActive && "bg-white text-primary"
                  )}
                >
                  {badgeCount > 99 ? "99+" : badgeCount}
                </Badge>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
