"use client";

import { Badge } from "@/components/ui/badge";

interface ARTMeetingBadgeProps {
  status: string | null;
  isSkipped?: boolean;
}

export function ARTMeetingBadge({ status, isSkipped }: ARTMeetingBadgeProps) {
  if (isSkipped) {
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        Skipped
      </Badge>
    );
  }

  switch (status) {
    case "DRAFT":
      return <Badge variant="secondary">Draft</Badge>;
    case "PENDING":
      return <Badge variant="outline" className="border-blue-500 text-blue-600">Pending</Badge>;
    case "APPROVED":
      return <Badge className="bg-green-600">Completed</Badge>;
    case null:
      return <Badge variant="destructive">Missing</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
