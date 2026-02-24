"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Download,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { INCIDENT_TYPES, INTERVENTION_TYPES, FOLLOW_UP_TYPES } from "@/lib/validations";

interface IncidentReport {
  id: string;
  reportNumber: string | null;
  incidentDate: string;
  incidentTime: string;
  incidentLocation: string;
  reportDate: string;
  reportCompletedBy: string;
  reporterTitle: string | null;
  residentName: string | null;
  residentDOB: string | null;
  residentAdmissionDate: string | null;
  residentAhcccsId: string | null;
  incidentTypes: string[];
  otherIncidentType: string | null;
  incidentDescription: string;
  residentsInvolved: { name: string; dob?: string; roleInIncident?: string }[] | null;
  staffInvolved: { name: string; title?: string; roleInIncident?: string }[] | null;
  witnesses: { name: string; titleOrRelationship?: string; contactInfo?: string }[] | null;
  anyInjuries: boolean;
  injuryDescription: string | null;
  medicalAttentionRequired: boolean;
  treatmentProvided: string | null;
  was911Called: boolean;
  wasTransportedToHospital: boolean;
  hospitalName: string | null;
  interventionsUsed: string[];
  otherIntervention: string | null;
  actionsDescription: string | null;
  notifications: { personEntity: string; name?: string; dateTime?: string; method?: string; notifiedBy?: string }[] | null;
  residentCurrentCondition: string | null;
  residentStatement: string | null;
  currentSupervisionLevel: string | null;
  otherSupervisionLevel: string | null;
  followUpRequired: string[];
  otherFollowUp: string | null;
  followUpActionsTimeline: string | null;
  facility: {
    name: string;
    address: string;
    phone: string | null;
  };
  intake: {
    id: string;
    residentName: string;
    dateOfBirth: string;
    admissionDate: string | null;
    policyNumber: string | null;
  } | null;
}

function getIncidentTypeLabel(code: string): string {
  const type = INCIDENT_TYPES.find((t) => t.code === code);
  return type?.label || code;
}

function getInterventionLabel(code: string): string {
  const type = INTERVENTION_TYPES.find((t) => t.code === code);
  return type?.label || code;
}

function getFollowUpLabel(code: string): string {
  const type = FOLLOW_UP_TYPES.find((t) => t.code === code);
  return type?.label || code;
}

export default function BHPViewIncidentReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [report, setReport] = useState<IncidentReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    async function fetchReport() {
      try {
        const response = await fetch(`/api/incident-reports/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch report");
        }
        const data = await response.json();
        setReport(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load incident report",
          variant: "destructive",
        });
        router.push("/bhp/incident-reports");
      } finally {
        setIsLoading(false);
      }
    }
    fetchReport();
  }, [id, router, toast]);

  async function handleDownloadPDF() {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/incident-reports/${id}/pdf`);
      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `incident-report-${report?.reportNumber || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download PDF",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const residentName = report.intake?.residentName || report.residentName;
  const residentDOB = report.intake?.dateOfBirth || report.residentDOB;
  const residentAdmission = report.intake?.admissionDate || report.residentAdmissionDate;
  const residentAhcccs = report.intake?.policyNumber || report.residentAhcccsId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/bhp/incident-reports">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              Incident Report {report.reportNumber || `#${id.slice(0, 8)}`}
            </h1>
            <p className="text-muted-foreground">
              {report.facility.name} - {format(new Date(report.incidentDate), "MMMM d, yyyy")}
            </p>
          </div>
        </div>
        <Button onClick={handleDownloadPDF} disabled={isDownloading}>
          {isDownloading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Download PDF
        </Button>
      </div>

      {/* Facility Information */}
      <Card>
        <CardHeader>
          <CardTitle>Facility Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Facility Name</p>
              <p className="font-medium">{report.facility.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Report Number</p>
              <p className="font-medium">{report.reportNumber || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{report.facility.address}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{report.facility.phone || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incident Information */}
      <Card>
        <CardHeader>
          <CardTitle>Incident Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Date of Incident</p>
              <p className="font-medium">{format(new Date(report.incidentDate), "MMMM d, yyyy")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Time of Incident</p>
              <p className="font-medium">{report.incidentTime}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-medium">{report.incidentLocation}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Report Completed By</p>
              <p className="font-medium">{report.reportCompletedBy}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Title/Position</p>
              <p className="font-medium">{report.reporterTitle || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resident Information */}
      <Card>
        <CardHeader>
          <CardTitle>Resident Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Resident Name</p>
              <p className="font-medium">{residentName || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">DOB</p>
              <p className="font-medium">
                {residentDOB ? format(new Date(residentDOB), "MMMM d, yyyy") : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Admission Date</p>
              <p className="font-medium">
                {residentAdmission ? format(new Date(residentAdmission), "MMMM d, yyyy") : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">AHCCCS ID</p>
              <p className="font-medium">{residentAhcccs || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incident Type */}
      <Card>
        <CardHeader>
          <CardTitle>Incident Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {report.incidentTypes.map((type) => (
              <Badge key={type} variant="outline">
                {getIncidentTypeLabel(type)}
              </Badge>
            ))}
          </div>
          {report.otherIncidentType && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Other</p>
              <p>{report.otherIncidentType}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Incident Description */}
      <Card>
        <CardHeader>
          <CardTitle>Incident Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{report.incidentDescription}</p>
        </CardContent>
      </Card>

      {/* Persons Involved */}
      {((report.residentsInvolved && report.residentsInvolved.length > 0) ||
        (report.staffInvolved && report.staffInvolved.length > 0) ||
        (report.witnesses && report.witnesses.length > 0)) && (
        <Card>
          <CardHeader>
            <CardTitle>Persons Involved</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {report.residentsInvolved && report.residentsInvolved.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Residents Involved</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2 text-sm">Name</th>
                        <th className="text-left p-2 text-sm">DOB</th>
                        <th className="text-left p-2 text-sm">Role in Incident</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.residentsInvolved.map((person, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-2">{person.name}</td>
                          <td className="p-2">{person.dob || "-"}</td>
                          <td className="p-2">{person.roleInIncident || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {report.staffInvolved && report.staffInvolved.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Staff Involved</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2 text-sm">Name</th>
                        <th className="text-left p-2 text-sm">Title</th>
                        <th className="text-left p-2 text-sm">Role in Incident</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.staffInvolved.map((person, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-2">{person.name}</td>
                          <td className="p-2">{person.title || "-"}</td>
                          <td className="p-2">{person.roleInIncident || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {report.witnesses && report.witnesses.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Witnesses</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2 text-sm">Name</th>
                        <th className="text-left p-2 text-sm">Title/Relationship</th>
                        <th className="text-left p-2 text-sm">Contact Info</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.witnesses.map((person, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-2">{person.name}</td>
                          <td className="p-2">{person.titleOrRelationship || "-"}</td>
                          <td className="p-2">{person.contactInfo || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Injuries */}
      <Card>
        <CardHeader>
          <CardTitle>Injuries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Any Injuries</p>
              <p className="font-medium">{report.anyInjuries ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Medical Attention Required</p>
              <p className="font-medium">{report.medicalAttentionRequired ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">911 Called</p>
              <p className="font-medium">{report.was911Called ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transported to Hospital</p>
              <p className="font-medium">{report.wasTransportedToHospital ? "Yes" : "No"}</p>
            </div>
          </div>
          {report.injuryDescription && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Injury Description</p>
              <p>{report.injuryDescription}</p>
            </div>
          )}
          {report.treatmentProvided && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Treatment Provided</p>
              <p>{report.treatmentProvided}</p>
            </div>
          )}
          {report.hospitalName && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Hospital Name</p>
              <p>{report.hospitalName}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interventions */}
      <Card>
        <CardHeader>
          <CardTitle>Interventions and Actions Taken</CardTitle>
        </CardHeader>
        <CardContent>
          {report.interventionsUsed.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Interventions Used</p>
              <div className="flex flex-wrap gap-2">
                {report.interventionsUsed.map((intervention) => (
                  <Badge key={intervention} variant="outline">
                    {getInterventionLabel(intervention)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {report.otherIntervention && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">Other Intervention</p>
              <p>{report.otherIntervention}</p>
            </div>
          )}
          {report.actionsDescription && (
            <div>
              <p className="text-sm text-muted-foreground">Actions Description</p>
              <p className="whitespace-pre-wrap">{report.actionsDescription}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      {report.notifications && report.notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2 text-sm">Person/Entity</th>
                    <th className="text-left p-2 text-sm">Name</th>
                    <th className="text-left p-2 text-sm">Date/Time</th>
                    <th className="text-left p-2 text-sm">Method</th>
                    <th className="text-left p-2 text-sm">Notified By</th>
                  </tr>
                </thead>
                <tbody>
                  {report.notifications.map((notification, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2">{notification.personEntity}</td>
                      <td className="p-2">{notification.name || "-"}</td>
                      <td className="p-2">{notification.dateTime || "-"}</td>
                      <td className="p-2">{notification.method || "-"}</td>
                      <td className="p-2">{notification.notifiedBy || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resident Status Post-Incident */}
      <Card>
        <CardHeader>
          <CardTitle>Resident Status Post-Incident</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.residentCurrentCondition && (
            <div>
              <p className="text-sm text-muted-foreground">Current Condition</p>
              <p className="whitespace-pre-wrap">{report.residentCurrentCondition}</p>
            </div>
          )}
          {report.residentStatement && (
            <div>
              <p className="text-sm text-muted-foreground">Resident Statement</p>
              <p className="whitespace-pre-wrap">{report.residentStatement}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Current Supervision Level</p>
            <p className="font-medium">
              {report.currentSupervisionLevel === "Other"
                ? report.otherSupervisionLevel
                : report.currentSupervisionLevel || "N/A"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Follow-Up Required */}
      <Card>
        <CardHeader>
          <CardTitle>Follow-Up Required</CardTitle>
        </CardHeader>
        <CardContent>
          {report.followUpRequired.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {report.followUpRequired.map((followUp) => (
                  <Badge key={followUp} variant="outline">
                    {getFollowUpLabel(followUp)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {report.otherFollowUp && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">Other Follow-Up</p>
              <p>{report.otherFollowUp}</p>
            </div>
          )}
          {report.followUpActionsTimeline && (
            <div>
              <p className="text-sm text-muted-foreground">Follow-Up Actions and Timeline</p>
              <p className="whitespace-pre-wrap">{report.followUpActionsTimeline}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
