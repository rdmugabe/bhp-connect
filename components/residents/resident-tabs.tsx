"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface ResidentTabsProps {
  residentId: string;
  isApproved: boolean;
  isDischarged: boolean;
}

export function ResidentTabs({ residentId, isApproved, isDischarged }: ResidentTabsProps) {
  const pathname = usePathname();
  const basePath = `/facility/residents/${residentId}`;

  const tabs = [
    { name: "Overview", href: basePath, exact: true },
    { name: "Calendar", href: `${basePath}/calendar`, show: isApproved && !isDischarged },
    { name: "Care Coordination", href: `${basePath}/care-coordination`, show: isApproved },
    { name: "ART Meetings", href: `${basePath}/art-meetings`, show: isApproved },
    { name: "Progress Notes", href: `${basePath}/progress-notes`, show: isApproved },
    { name: "Discharge Summary", href: `${basePath}/discharge-summary`, show: isApproved },
  ].filter(tab => tab.show !== false);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="border-b mb-6">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <Link
            key={tab.name}
            href={tab.href}
            className={cn(
              "whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors",
              isActive(tab.href, tab.exact)
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
            )}
          >
            {tab.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
