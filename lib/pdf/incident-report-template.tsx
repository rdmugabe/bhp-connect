import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { INCIDENT_TYPES, INTERVENTION_TYPES, FOLLOW_UP_TYPES } from "@/lib/validations";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    paddingBottom: 60,
    fontFamily: "Helvetica",
    fontSize: 9,
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 15,
    borderBottom: "2 solid #1a365d",
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 3,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 10,
    color: "#4a5568",
    textAlign: "center",
  },
  confidentialBanner: {
    backgroundColor: "#fed7d7",
    padding: 5,
    marginTop: 8,
    borderRadius: 3,
  },
  confidentialText: {
    color: "#c53030",
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 6,
    paddingBottom: 3,
    borderBottom: "1 solid #e2e8f0",
    backgroundColor: "#f7fafc",
    padding: 4,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: "35%",
    color: "#4a5568",
    fontSize: 8,
  },
  value: {
    width: "65%",
    fontSize: 9,
  },
  twoColumn: {
    flexDirection: "row",
    gap: 10,
  },
  column: {
    flex: 1,
  },
  textBlock: {
    marginBottom: 8,
  },
  textBlockLabel: {
    color: "#4a5568",
    fontSize: 8,
    marginBottom: 2,
  },
  textBlockValue: {
    fontSize: 9,
    backgroundColor: "#f7fafc",
    padding: 6,
    borderRadius: 3,
  },
  checkboxRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 4,
  },
  checkbox: {
    fontSize: 8,
    backgroundColor: "#e2e8f0",
    padding: 2,
    borderRadius: 2,
  },
  checkedBox: {
    fontSize: 8,
    backgroundColor: "#c6f6d5",
    padding: 2,
    borderRadius: 2,
  },
  table: {
    marginTop: 6,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#edf2f7",
    padding: 4,
    fontWeight: "bold",
    fontSize: 8,
  },
  tableRow: {
    flexDirection: "row",
    padding: 4,
    borderBottom: "1 solid #e2e8f0",
    fontSize: 8,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    borderTop: "1 solid #e2e8f0",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: "#718096",
    textAlign: "center",
  },
  signatureSection: {
    marginTop: 15,
    padding: 12,
    backgroundColor: "#f7fafc",
    borderRadius: 3,
    border: "1 solid #e2e8f0",
  },
  signatureRow: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "flex-end",
  },
  signatureBlock: {
    flex: 1,
    marginRight: 15,
  },
  signatureLine: {
    borderBottom: "1 solid #1a365d",
    marginBottom: 4,
    height: 20,
  },
  signatureLabel: {
    fontSize: 8,
    color: "#4a5568",
  },
});

interface IncidentReportData {
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
  // Signatures
  staffSignatureName: string | null;
  staffSignatureDate: string | null;
  adminSignatureName: string | null;
  adminSignatureDate: string | null;
  bhpSignatureName: string | null;
  bhpSignatureDate: string | null;
  facility: {
    name: string;
    address: string;
    phone: string | null;
  };
  bhpName: string;
}

function formatDate(dateString: string): string {
  // Use UTC to preserve date-only fields. See lib/date-utils.ts for strategy.
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
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

function Header({ data }: { data: IncidentReportData }) {
  return (
    <View style={styles.header} fixed>
      <Text style={styles.title}>BHRF Incident Report</Text>
      <Text style={styles.subtitle}>
        {data.facility.name} | Report #: {data.reportNumber || "N/A"}
      </Text>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingTop: 6, borderTop: "1 solid #e2e8f0" }}>
        <View style={{ flexDirection: "row" }}>
          <Text style={{ fontSize: 8, color: "#4a5568" }}>Resident: </Text>
          <Text style={{ fontSize: 8, fontWeight: "bold" }}>{data.residentName || "N/A"}</Text>
        </View>
        <View style={{ flexDirection: "row" }}>
          <Text style={{ fontSize: 8, color: "#4a5568" }}>DOB: </Text>
          <Text style={{ fontSize: 8, fontWeight: "bold" }}>{data.residentDOB ? formatDate(data.residentDOB) : "N/A"}</Text>
        </View>
        <View style={{ flexDirection: "row" }}>
          <Text style={{ fontSize: 8, color: "#4a5568" }}>AHCCCS ID: </Text>
          <Text style={{ fontSize: 8, fontWeight: "bold" }}>{data.residentAhcccsId || "N/A"}</Text>
        </View>
        <View style={{ flexDirection: "row" }}>
          <Text style={{ fontSize: 8, color: "#4a5568" }}>Incident Date: </Text>
          <Text style={{ fontSize: 8, fontWeight: "bold" }}>{formatDate(data.incidentDate)}</Text>
        </View>
      </View>
      <View style={styles.confidentialBanner}>
        <Text style={styles.confidentialText}>
          CONFIDENTIAL - PROTECTED HEALTH INFORMATION (PHI)
        </Text>
      </View>
    </View>
  );
}

function Footer({ id }: { id: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        This document contains Protected Health Information (PHI) subject to HIPAA regulations.
      </Text>
      <Text
        style={styles.footerText}
        render={({ pageNumber, totalPages }) =>
          `Document ID: ${id} | Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  );
}

export function IncidentReportPDF({ data }: { data: IncidentReportData }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page} wrap>
        <Header data={data} />
        <Footer id={data.id} />

        {/* Facility Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FACILITY INFORMATION</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Facility Name:</Text>
                <Text style={styles.value}>{data.facility.name}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Phone:</Text>
                <Text style={styles.value}>{data.facility.phone || "N/A"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Address:</Text>
                <Text style={styles.value}>{data.facility.address}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Report Number:</Text>
                <Text style={styles.value}>{data.reportNumber || "N/A"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Incident Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INCIDENT INFORMATION</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Date of Incident:</Text>
                <Text style={styles.value}>{formatDate(data.incidentDate)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Time of Incident:</Text>
                <Text style={styles.value}>{data.incidentTime}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Location:</Text>
                <Text style={styles.value}>{data.incidentLocation}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Report Completed By:</Text>
                <Text style={styles.value}>{data.reportCompletedBy}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Title/Position:</Text>
                <Text style={styles.value}>{data.reporterTitle || "N/A"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Resident Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RESIDENT INFORMATION</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Resident Name:</Text>
                <Text style={styles.value}>{data.residentName || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>DOB:</Text>
                <Text style={styles.value}>
                  {data.residentDOB ? formatDate(data.residentDOB) : "N/A"}
                </Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Admission Date:</Text>
                <Text style={styles.value}>
                  {data.residentAdmissionDate ? formatDate(data.residentAdmissionDate) : "N/A"}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>AHCCCS ID:</Text>
                <Text style={styles.value}>{data.residentAhcccsId || "N/A"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Incident Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INCIDENT TYPE</Text>
          <View style={styles.checkboxRow}>
            {data.incidentTypes.map((type) => (
              <Text key={type} style={styles.checkedBox}>
                {getIncidentTypeLabel(type)}
              </Text>
            ))}
          </View>
          {data.otherIncidentType && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Other:</Text>
              <Text style={styles.textBlockValue}>{data.otherIncidentType}</Text>
            </View>
          )}
        </View>

        {/* Incident Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INCIDENT DESCRIPTION</Text>
          <View style={styles.textBlock}>
            <Text style={styles.textBlockValue}>{data.incidentDescription}</Text>
          </View>
        </View>

        {/* Persons Involved */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PERSONS INVOLVED</Text>

          {data.residentsInvolved && data.residentsInvolved.length > 0 && (
            <View style={styles.table}>
              <Text style={styles.textBlockLabel}>Residents Involved:</Text>
              <View style={styles.tableHeader}>
                <Text style={{ width: "35%" }}>Name</Text>
                <Text style={{ width: "25%" }}>DOB</Text>
                <Text style={{ width: "40%" }}>Role in Incident</Text>
              </View>
              {data.residentsInvolved.map((person, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={{ width: "35%" }}>{person.name}</Text>
                  <Text style={{ width: "25%" }}>{person.dob || "-"}</Text>
                  <Text style={{ width: "40%" }}>{person.roleInIncident || "-"}</Text>
                </View>
              ))}
            </View>
          )}

          {data.staffInvolved && data.staffInvolved.length > 0 && (
            <View style={styles.table}>
              <Text style={styles.textBlockLabel}>Staff Involved:</Text>
              <View style={styles.tableHeader}>
                <Text style={{ width: "35%" }}>Name</Text>
                <Text style={{ width: "25%" }}>Title</Text>
                <Text style={{ width: "40%" }}>Role in Incident</Text>
              </View>
              {data.staffInvolved.map((person, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={{ width: "35%" }}>{person.name}</Text>
                  <Text style={{ width: "25%" }}>{person.title || "-"}</Text>
                  <Text style={{ width: "40%" }}>{person.roleInIncident || "-"}</Text>
                </View>
              ))}
            </View>
          )}

          {data.witnesses && data.witnesses.length > 0 && (
            <View style={styles.table}>
              <Text style={styles.textBlockLabel}>Witnesses:</Text>
              <View style={styles.tableHeader}>
                <Text style={{ width: "30%" }}>Name</Text>
                <Text style={{ width: "30%" }}>Title/Relationship</Text>
                <Text style={{ width: "40%" }}>Contact Information</Text>
              </View>
              {data.witnesses.map((person, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={{ width: "30%" }}>{person.name}</Text>
                  <Text style={{ width: "30%" }}>{person.titleOrRelationship || "-"}</Text>
                  <Text style={{ width: "40%" }}>{person.contactInfo || "-"}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Injuries */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INJURIES</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Any Injuries:</Text>
                <Text style={styles.value}>{data.anyInjuries ? "Yes" : "No"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Medical Attention Required:</Text>
                <Text style={styles.value}>{data.medicalAttentionRequired ? "Yes" : "No"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>911 Called:</Text>
                <Text style={styles.value}>{data.was911Called ? "Yes" : "No"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Transported to Hospital:</Text>
                <Text style={styles.value}>{data.wasTransportedToHospital ? "Yes" : "No"}</Text>
              </View>
            </View>
          </View>
          {data.injuryDescription && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Injury Description:</Text>
              <Text style={styles.textBlockValue}>{data.injuryDescription}</Text>
            </View>
          )}
          {data.treatmentProvided && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Treatment Provided:</Text>
              <Text style={styles.textBlockValue}>{data.treatmentProvided}</Text>
            </View>
          )}
          {data.hospitalName && (
            <View style={styles.row}>
              <Text style={styles.label}>Hospital Name:</Text>
              <Text style={styles.value}>{data.hospitalName}</Text>
            </View>
          )}
        </View>

        {/* Interventions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INTERVENTIONS AND ACTIONS TAKEN</Text>
          {data.interventionsUsed.length > 0 && (
            <>
              <Text style={styles.textBlockLabel}>Immediate Interventions Used:</Text>
              <View style={styles.checkboxRow}>
                {data.interventionsUsed.map((intervention) => (
                  <Text key={intervention} style={styles.checkedBox}>
                    {getInterventionLabel(intervention)}
                  </Text>
                ))}
              </View>
            </>
          )}
          {data.otherIntervention && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Other Intervention:</Text>
              <Text style={styles.textBlockValue}>{data.otherIntervention}</Text>
            </View>
          )}
          {data.actionsDescription && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Actions Taken:</Text>
              <Text style={styles.textBlockValue}>{data.actionsDescription}</Text>
            </View>
          )}
        </View>

        {/* Notifications */}
        {data.notifications && data.notifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={{ width: "25%" }}>Person/Entity</Text>
                <Text style={{ width: "20%" }}>Name</Text>
                <Text style={{ width: "20%" }}>Date/Time</Text>
                <Text style={{ width: "15%" }}>Method</Text>
                <Text style={{ width: "20%" }}>Notified By</Text>
              </View>
              {data.notifications.map((notification, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={{ width: "25%" }}>{notification.personEntity}</Text>
                  <Text style={{ width: "20%" }}>{notification.name || "-"}</Text>
                  <Text style={{ width: "20%" }}>{notification.dateTime || "-"}</Text>
                  <Text style={{ width: "15%" }}>{notification.method || "-"}</Text>
                  <Text style={{ width: "20%" }}>{notification.notifiedBy || "-"}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Resident Status Post-Incident */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RESIDENT STATUS POST-INCIDENT</Text>
          {data.residentCurrentCondition && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Current Condition:</Text>
              <Text style={styles.textBlockValue}>{data.residentCurrentCondition}</Text>
            </View>
          )}
          {data.residentStatement && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Resident Statement:</Text>
              <Text style={styles.textBlockValue}>{data.residentStatement}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Current Supervision Level:</Text>
            <Text style={styles.value}>
              {data.currentSupervisionLevel === "Other"
                ? data.otherSupervisionLevel || "Other"
                : data.currentSupervisionLevel || "N/A"}
            </Text>
          </View>
        </View>

        {/* Follow-Up Required */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FOLLOW-UP REQUIRED</Text>
          {data.followUpRequired.length > 0 && (
            <View style={styles.checkboxRow}>
              {data.followUpRequired.map((followUp) => (
                <Text key={followUp} style={styles.checkedBox}>
                  {getFollowUpLabel(followUp)}
                </Text>
              ))}
            </View>
          )}
          {data.otherFollowUp && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Other Follow-Up:</Text>
              <Text style={styles.textBlockValue}>{data.otherFollowUp}</Text>
            </View>
          )}
          {data.followUpActionsTimeline && (
            <View style={styles.textBlock}>
              <Text style={styles.textBlockLabel}>Follow-Up Actions and Timeline:</Text>
              <Text style={styles.textBlockValue}>{data.followUpActionsTimeline}</Text>
            </View>
          )}
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <Text style={styles.sectionTitle}>SIGNATURES</Text>

          {/* Staff Signature */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 9, fontWeight: "bold", color: "#1a365d", marginBottom: 6 }}>Staff/Report Completed By:</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 15 }}>
              <View style={{ width: "35%" }}>
                <Text style={{ fontSize: 8, marginBottom: 2 }}>{data.staffSignatureName || ""}</Text>
                <View style={{ borderTop: "1 solid #1a365d", paddingTop: 2 }}>
                  <Text style={{ fontSize: 7, color: "#718096" }}>Printed Name</Text>
                </View>
              </View>
              <View style={{ width: "35%" }}>
                <View style={{ height: 12 }} />
                <View style={{ borderTop: "1 solid #1a365d", paddingTop: 2 }}>
                  <Text style={{ fontSize: 7, color: "#718096" }}>Signature</Text>
                </View>
              </View>
              <View style={{ width: "20%" }}>
                <Text style={{ fontSize: 8, marginBottom: 2 }}>{data.staffSignatureDate ? formatDate(data.staffSignatureDate) : ""}</Text>
                <View style={{ borderTop: "1 solid #1a365d", paddingTop: 2 }}>
                  <Text style={{ fontSize: 7, color: "#718096" }}>Date</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Administrator Signature */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 9, fontWeight: "bold", color: "#1a365d", marginBottom: 6 }}>Administrator/Director Review:</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 15 }}>
              <View style={{ width: "35%" }}>
                <Text style={{ fontSize: 8, marginBottom: 2 }}>{data.adminSignatureName || ""}</Text>
                <View style={{ borderTop: "1 solid #1a365d", paddingTop: 2 }}>
                  <Text style={{ fontSize: 7, color: "#718096" }}>Printed Name</Text>
                </View>
              </View>
              <View style={{ width: "35%" }}>
                <View style={{ height: 12 }} />
                <View style={{ borderTop: "1 solid #1a365d", paddingTop: 2 }}>
                  <Text style={{ fontSize: 7, color: "#718096" }}>Signature</Text>
                </View>
              </View>
              <View style={{ width: "20%" }}>
                <Text style={{ fontSize: 8, marginBottom: 2 }}>{data.adminSignatureDate ? formatDate(data.adminSignatureDate) : ""}</Text>
                <View style={{ borderTop: "1 solid #1a365d", paddingTop: 2 }}>
                  <Text style={{ fontSize: 7, color: "#718096" }}>Date</Text>
                </View>
              </View>
            </View>
          </View>

          {/* BHP Signature */}
          <View>
            <Text style={{ fontSize: 9, fontWeight: "bold", color: "#1a365d", marginBottom: 6 }}>BHP:</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 15 }}>
              <View style={{ width: "35%" }}>
                <Text style={{ fontSize: 8, marginBottom: 2 }}>{data.bhpSignatureName || ""}</Text>
                <View style={{ borderTop: "1 solid #1a365d", paddingTop: 2 }}>
                  <Text style={{ fontSize: 7, color: "#718096" }}>Printed Name</Text>
                </View>
              </View>
              <View style={{ width: "35%" }}>
                <View style={{ height: 12 }} />
                <View style={{ borderTop: "1 solid #1a365d", paddingTop: 2 }}>
                  <Text style={{ fontSize: 7, color: "#718096" }}>Signature</Text>
                </View>
              </View>
              <View style={{ width: "20%" }}>
                <Text style={{ fontSize: 8, marginBottom: 2 }}>{data.bhpSignatureDate ? formatDate(data.bhpSignatureDate) : ""}</Text>
                <View style={{ borderTop: "1 solid #1a365d", paddingTop: 2 }}>
                  <Text style={{ fontSize: 7, color: "#718096" }}>Date</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
