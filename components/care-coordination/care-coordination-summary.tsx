"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";

interface CareCoordinationSummaryProps {
  summary: {
    summary: string;
    keyHighlights: string[];
    pendingFollowUps: string[];
    coordinationGaps?: string;
  };
  entriesCount: number;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

export function CareCoordinationSummary({
  summary,
  entriesCount,
  dateRange,
}: CareCoordinationSummaryProps) {
  return (
    <div className="space-y-4">
      {/* Main Summary */}
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Sparkles className="h-5 w-5" />
            AI-Generated Summary
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Badge variant="outline" className="text-green-600 border-green-300">
              {entriesCount} entries analyzed
            </Badge>
            {dateRange && (
              <span>
                {dateRange.startDate} - {dateRange.endDate}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {summary.summary}
          </p>
        </CardContent>
      </Card>

      {/* Key Highlights */}
      {summary.keyHighlights.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-blue-800 text-base">
              <CheckCircle className="h-5 w-5" />
              Key Highlights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.keyHighlights.map((highlight, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-gray-700"
                >
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Pending Follow-ups */}
      {summary.pendingFollowUps.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-yellow-800 text-base">
              <AlertCircle className="h-5 w-5" />
              Pending Follow-Ups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.pendingFollowUps.map((followUp, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-gray-700"
                >
                  <span className="text-yellow-500 mt-1">•</span>
                  <span>{followUp}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Coordination Gaps */}
      {summary.coordinationGaps && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-red-800 text-base">
              <AlertTriangle className="h-5 w-5" />
              Coordination Gaps Identified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{summary.coordinationGaps}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
