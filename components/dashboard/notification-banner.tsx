"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, AlertTriangle, Bell, FileText, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UrgentNotification {
  id: string;
  type: "warning" | "info" | "urgent";
  message: string;
  link?: string;
  linkText?: string;
}

export function NotificationBanner() {
  const [notifications, setNotifications] = useState<UrgentNotification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUrgentNotifications = async () => {
      try {
        const response = await fetch("/api/notifications/urgent");
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications);
        }
      } catch (error) {
        console.error("Failed to fetch urgent notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUrgentNotifications();
    // Refresh every minute
    const interval = setInterval(fetchUrgentNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => {
      const newSet = new Set(Array.from(prev));
      newSet.add(id);
      return newSet;
    });
  };

  const visibleNotifications = notifications.filter(
    (n) => !dismissedIds.has(n.id)
  );

  if (isLoading || visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-1">
      {visibleNotifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            "flex items-center justify-between gap-4 px-4 py-2 text-sm",
            notification.type === "urgent" && "bg-red-500 text-white",
            notification.type === "warning" && "bg-yellow-500 text-yellow-950",
            notification.type === "info" && "bg-blue-500 text-white"
          )}
        >
          <div className="flex items-center gap-2 flex-1">
            {notification.type === "urgent" ? (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            ) : notification.type === "warning" ? (
              <Bell className="h-4 w-4 shrink-0" />
            ) : (
              <MessageSquare className="h-4 w-4 shrink-0" />
            )}
            <span>{notification.message}</span>
            {notification.link && (
              <Link
                href={notification.link}
                className={cn(
                  "underline font-medium hover:no-underline",
                  notification.type === "warning"
                    ? "text-yellow-950"
                    : "text-white"
                )}
              >
                {notification.linkText || "View"}
              </Link>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 shrink-0",
              notification.type === "warning"
                ? "hover:bg-yellow-600/20 text-yellow-950"
                : "hover:bg-white/20 text-white"
            )}
            onClick={() => handleDismiss(notification.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
