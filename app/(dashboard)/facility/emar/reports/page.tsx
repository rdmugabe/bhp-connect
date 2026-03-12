"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  BarChart3,
  AlertTriangle,
  Calendar,
  ArrowRight,
} from "lucide-react";

const reports = [
  {
    title: "Medication Administration Record (MAR)",
    description: "Generate detailed MAR reports for individual patients or all patients",
    icon: FileText,
    href: "/facility/emar/reports/mar",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "Adherence Report",
    description: "View medication adherence metrics and compliance rates",
    icon: BarChart3,
    href: "/facility/emar/reports/adherence",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    title: "Missed Doses Report",
    description: "Review missed and refused medications with reasons",
    icon: AlertTriangle,
    href: "/facility/emar/reports/missed-doses",
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  {
    title: "Monthly Summary",
    description: "Monthly medication administration summary by patient",
    icon: Calendar,
    href: "/facility/emar/reports/monthly",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
];

export default function ReportsPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">eMAR Reports</h1>
        <p className="text-muted-foreground">
          Generate and view medication administration reports
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.title} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${report.bgColor}`}>
                    <Icon className={`h-6 w-6 ${report.color}`} />
                  </div>
                </div>
                <CardTitle className="mt-4">{report.title}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={report.href}>
                  <Button className="w-full">
                    Generate Report
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
