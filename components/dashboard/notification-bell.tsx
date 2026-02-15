"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  MessageSquare,
  FileText,
  FolderOpen,
  ClipboardList,
  Award,
  CheckCheck,
  Video,
  Users,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: "message" | "intake" | "document" | "application" | "credential" | "employee_document" | "meeting";
  title: string;
  description: string;
  link: string;
  createdAt: string;
  isRead: boolean;
}

const typeIcons = {
  message: MessageSquare,
  intake: FileText,
  document: FolderOpen,
  application: ClipboardList,
  credential: Award,
  employee_document: Users,
  meeting: Video,
};

const typeColors = {
  message: "text-blue-500",
  intake: "text-purple-500",
  document: "text-green-500",
  application: "text-yellow-500",
  credential: "text-orange-500",
  employee_document: "text-indigo-500",
  meeting: "text-pink-500",
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    try {
      // Add cache-busting to ensure fresh data
      const response = await fetch("/api/notifications", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setTotalCount(data.totalCount);
        setUnreadMessageCount(data.unreadMessageCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Extract actual ID from notification ID (e.g., "msg-abc123" -> "abc123")
  const extractMessageId = (notificationId: string): string => {
    const parts = notificationId.split("-");
    parts.shift(); // Remove the "msg" prefix
    return parts.join("-");
  };

  const markAsRead = async (notification: Notification) => {
    // For messages, mark as read in the database
    if (notification.type === "message") {
      // Mark locally as read immediately for better UX
      setNotifications((prev) =>
        prev.filter((n) => n.id !== notification.id)
      );
      setTotalCount((prev) => Math.max(0, prev - 1));
      setUnreadMessageCount((prev) => Math.max(0, prev - 1));

      const messageId = extractMessageId(notification.id);

      try {
        await fetch("/api/messages/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messageIds: [messageId],
          }),
        });
        // Refresh to get accurate count from server
        setTimeout(fetchNotifications, 500);
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
        // Revert on error
        fetchNotifications();
      }
    }
    // For other types, they will be cleared when the action is completed
    // (e.g., intake reviewed, document uploaded, etc.)
  };

  const markAllAsRead = async () => {
    // Mark all messages as read
    try {
      // Remove message notifications from local state immediately
      const messageCount = notifications.filter((n) => n.type === "message").length;
      setNotifications((prev) => prev.filter((n) => n.type !== "message"));
      setUnreadMessageCount(0);
      setTotalCount((prev) => Math.max(0, prev - messageCount));

      await fetch("/api/messages/read", {
        method: "PATCH",
      });
      // Refresh to get accurate data from server
      setTimeout(fetchNotifications, 500);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      // Revert on error
      fetchNotifications();
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification);
    setIsOpen(false);
    router.push(notification.link);
  };

  useEffect(() => {
    fetchNotifications();

    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Refresh when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {totalCount > 99 ? "99+" : totalCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80"
        align="end"
        forceMount
        sideOffset={5}
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <div className="flex items-center gap-2">
            {totalCount > 0 && (
              <>
                <Badge variant="secondary">
                  {totalCount} new
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    markAllAsRead();
                  }}
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              </>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No notifications
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => {
                const Icon = typeIcons[notification.type];
                const iconColor = typeColors[notification.type];

                return (
                  <DropdownMenuItem
                    key={notification.id}
                    className="cursor-pointer p-0"
                    onSelect={(e) => {
                      e.preventDefault();
                      handleNotificationClick(notification);
                    }}
                  >
                    <div
                      className={`flex items-start gap-3 p-3 w-full hover:bg-muted/50 ${
                        !notification.isRead ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <div className="relative">
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted ${iconColor}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        {!notification.isRead && (
                          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className={`text-sm leading-none ${!notification.isRead ? "font-semibold" : "font-medium"}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.description}
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
