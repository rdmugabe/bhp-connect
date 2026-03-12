import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingTop: 70,
    paddingBottom: 70,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.5,
  },
  pageHeader: {
    position: "absolute",
    top: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "1 solid #e2e8f0",
    paddingBottom: 8,
    fontSize: 8,
    color: "#4a5568",
  },
  pageHeaderLeft: {
    flexDirection: "column",
  },
  pageHeaderRight: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  pageHeaderItem: {
    flexDirection: "row",
    marginBottom: 2,
  },
  pageHeaderLabel: {
    color: "#718096",
    marginRight: 4,
  },
  pageHeaderValue: {
    fontWeight: "bold",
    color: "#1a365d",
  },
  header: {
    marginBottom: 20,
    borderBottom: "2 solid #1a365d",
    paddingBottom: 12,
  },
  facilityName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 11,
    color: "#4a5568",
    textAlign: "center",
    marginBottom: 8,
  },
  confidentialBanner: {
    backgroundColor: "#fed7d7",
    padding: 6,
    marginTop: 8,
    borderRadius: 3,
  },
  confidentialText: {
    color: "#c53030",
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
  },
  riskBanner: {
    backgroundColor: "#feb2b2",
    padding: 10,
    marginBottom: 15,
    borderRadius: 4,
    borderLeft: "4 solid #c53030",
  },
  riskTitle: {
    color: "#742a2a",
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 4,
  },
  riskFlags: {
    color: "#9b2c2c",
    fontSize: 9,
  },
  riskWarning: {
    color: "#742a2a",
    fontSize: 9,
    marginTop: 6,
    fontStyle: "italic",
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: "1 solid #e2e8f0",
    backgroundColor: "#f7fafc",
    padding: 6,
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
  },
  label: {
    width: "30%",
    color: "#4a5568",
    fontSize: 9,
    fontWeight: "bold",
  },
  value: {
    width: "70%",
    fontSize: 10,
  },
  twoColumn: {
    flexDirection: "row",
    gap: 20,
  },
  column: {
    flex: 1,
  },
  observationBlock: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: "#f7fafc",
    borderRadius: 4,
    borderLeft: "3 solid #3182ce",
  },
  observationLabel: {
    color: "#2b6cb0",
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 4,
  },
  observationValue: {
    fontSize: 10,
    color: "#2d3748",
    lineHeight: 1.6,
  },
  generatedNoteSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f0fff4",
    borderRadius: 6,
    borderLeft: "4 solid #38a169",
  },
  generatedNoteTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#22543d",
    marginBottom: 10,
  },
  generatedNoteContent: {
    fontSize: 10,
    color: "#2d3748",
    lineHeight: 1.7,
    textAlign: "justify",
  },
  footer: {
    position: "absolute",
    bottom: 25,
    left: 40,
    right: 40,
    borderTop: "1 solid #e2e8f0",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 7,
    color: "#718096",
    textAlign: "center",
    marginBottom: 2,
  },
  statusBadge: {
    padding: "4 8",
    borderRadius: 3,
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  statusFinal: {
    backgroundColor: "#c6f6d5",
    color: "#22543d",
  },
  statusDraft: {
    backgroundColor: "#fefcbf",
    color: "#744210",
  },
  metaInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#edf2f7",
    borderRadius: 4,
  },
  metaItem: {
    flexDirection: "column",
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 8,
    color: "#718096",
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#2d3748",
  },
  signatureSection: {
    marginTop: 30,
    padding: 15,
    borderTop: "2 solid #1a365d",
  },
  signatureTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 15,
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  signatureBlock: {
    width: "45%",
  },
  signatureLine: {
    borderBottom: "1 solid #2d3748",
    marginBottom: 4,
    paddingBottom: 8,
    minHeight: 20,
  },
  signatureLineText: {
    fontSize: 10,
    color: "#2d3748",
  },
  signatureLabel: {
    fontSize: 8,
    color: "#718096",
  },
});

interface ProgressNoteData {
  // Resident Info
  residentName: string;
  dateOfBirth: string;

  // Facility Info
  facilityName: string;

  // Note Metadata
  noteDate: string;
  shift?: string;
  authorName: string;
  authorTitle?: string;
  status: string;

  // Staff Observations
  residentStatus?: string;
  observedBehaviors?: string;
  moodAffect?: string;
  activityParticipation?: string;
  staffInteractions?: string;
  peerInteractions?: string;
  medicationCompliance?: string;
  hygieneAdl?: string;
  mealsAppetite?: string;
  sleepPattern?: string;
  staffInterventions?: string;
  residentResponse?: string;
  notableEvents?: string;
  additionalNotes?: string;

  // AI Generated
  generatedNote?: string;
  riskFlagsDetected?: string[];

  // BHT Signature
  bhtSignature?: string;
  bhtCredentials?: string;
  bhtSignatureDate?: string;

  // Timestamps
  createdAt: string;
  submittedAt?: string;
}

const RISK_FLAG_LABELS: Record<string, string> = {
  SELF_HARM: "Self-Harm Risk",
  SUICIDAL_IDEATION: "Suicidal Ideation",
  HOMICIDAL_IDEATION: "Homicidal Ideation",
  AGGRESSION: "Aggressive Behavior",
  MEDICAL_DISTRESS: "Medical Distress",
  ELOPEMENT_RISK: "Elopement Risk",
  SUBSTANCE_USE: "Substance Use Concern",
};

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const month = months[date.getUTCMonth()];
    const day = date.getUTCDate();
    const year = date.getUTCFullYear();
    return `${month} ${day}, ${year}`;
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function PageHeader({ data }: { data: ProgressNoteData }) {
  return (
    <View style={styles.pageHeader} fixed>
      <View style={styles.pageHeaderLeft}>
        <View style={styles.pageHeaderItem}>
          <Text style={styles.pageHeaderLabel}>Resident:</Text>
          <Text style={styles.pageHeaderValue}>{data.residentName}</Text>
        </View>
        <View style={styles.pageHeaderItem}>
          <Text style={styles.pageHeaderLabel}>DOB:</Text>
          <Text style={styles.pageHeaderValue}>{formatDate(data.dateOfBirth)}</Text>
        </View>
      </View>
      <View style={styles.pageHeaderRight}>
        <View style={styles.pageHeaderItem}>
          <Text style={styles.pageHeaderLabel}>Note Date:</Text>
          <Text style={styles.pageHeaderValue}>{formatDate(data.noteDate)}</Text>
        </View>
        <View style={styles.pageHeaderItem}>
          <Text style={styles.pageHeaderLabel}>Shift:</Text>
          <Text style={styles.pageHeaderValue}>{data.shift || "N/A"}</Text>
        </View>
      </View>
    </View>
  );
}

function PageFooter({ facilityName }: { facilityName: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        {facilityName} | Daily Progress Note | Confidential
      </Text>
      <Text style={styles.footerText}>
        Generated: {new Date().toLocaleString()}
      </Text>
    </View>
  );
}

function ObservationBlock({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.observationBlock}>
      <Text style={styles.observationLabel}>{label}</Text>
      <Text style={styles.observationValue}>{value}</Text>
    </View>
  );
}

function SignatureSection({ data }: { data: ProgressNoteData }) {
  return (
    <View style={styles.signatureSection}>
      <Text style={styles.signatureTitle}>BHT Signature</Text>
      <View style={styles.signatureRow}>
        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureLineText}>
              {data.bhtSignature || ""}
              {data.bhtCredentials ? `, ${data.bhtCredentials}` : ""}
            </Text>
          </View>
          <Text style={styles.signatureLabel}>
            Behavioral Health Technician Signature / Credentials
          </Text>
        </View>
        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureLineText}>
              {formatDate(data.bhtSignatureDate)}
            </Text>
          </View>
          <Text style={styles.signatureLabel}>Date</Text>
        </View>
      </View>
    </View>
  );
}

export function ProgressNotePDF({ data }: { data: ProgressNoteData }) {
  const hasRiskFlags = data.riskFlagsDetected && data.riskFlagsDetected.length > 0;
  const hasObservations = data.residentStatus || data.observedBehaviors ||
    data.moodAffect || data.activityParticipation || data.staffInteractions ||
    data.peerInteractions || data.medicationCompliance || data.hygieneAdl ||
    data.mealsAppetite || data.sleepPattern || data.staffInterventions ||
    data.residentResponse || data.notableEvents || data.additionalNotes;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PageHeader data={data} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.facilityName}>{data.facilityName}</Text>
          <Text style={styles.title}>Daily Progress Note</Text>
          <Text style={styles.subtitle}>
            {formatDate(data.noteDate)} {data.shift ? `- ${data.shift} Shift` : ""}
          </Text>
          <View style={styles.confidentialBanner}>
            <Text style={styles.confidentialText}>
              CONFIDENTIAL - PROTECTED HEALTH INFORMATION
            </Text>
          </View>
        </View>

        {/* Risk Flags Banner */}
        {hasRiskFlags && (
          <View style={styles.riskBanner}>
            <Text style={styles.riskTitle}>RISK INDICATORS DETECTED</Text>
            <Text style={styles.riskFlags}>
              {data.riskFlagsDetected?.map(flag => RISK_FLAG_LABELS[flag] || flag).join(" | ")}
            </Text>
            <Text style={styles.riskWarning}>
              Staff should continue to monitor the resident closely and follow facility
              protocol by notifying appropriate clinical personnel.
            </Text>
          </View>
        )}

        {/* Status and Meta Info */}
        <View style={styles.metaInfo}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Status</Text>
            <Text style={styles.metaValue}>
              {data.status === "FINAL" ? "Finalized" : "Draft"}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Author</Text>
            <Text style={styles.metaValue}>
              {data.authorName}{data.authorTitle ? `, ${data.authorTitle}` : ""}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Created</Text>
            <Text style={styles.metaValue}>{formatDateTime(data.createdAt)}</Text>
          </View>
          {data.submittedAt && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Submitted</Text>
              <Text style={styles.metaValue}>{formatDateTime(data.submittedAt)}</Text>
            </View>
          )}
        </View>

        {/* Resident Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resident Information</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Resident Name:</Text>
                <Text style={styles.value}>{data.residentName}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Date of Birth:</Text>
                <Text style={styles.value}>{formatDate(data.dateOfBirth)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* AI Generated Clinical Note */}
        {data.generatedNote && (
          <View style={styles.generatedNoteSection}>
            <Text style={styles.generatedNoteTitle}>Clinical Progress Note</Text>
            <Text style={styles.generatedNoteContent}>{data.generatedNote}</Text>
          </View>
        )}

        {/* Signature on page 1 if no observations */}
        {!hasObservations && data.bhtSignature && (
          <SignatureSection data={data} />
        )}

        <PageFooter facilityName={data.facilityName} />
      </Page>

      {/* Page 2: Staff Observations (if any) */}
      {hasObservations && (
        <Page size="LETTER" style={styles.page}>
          <PageHeader data={data} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Staff Observations</Text>

            <ObservationBlock label="Resident Status" value={data.residentStatus} />
            <ObservationBlock label="Observed Behaviors" value={data.observedBehaviors} />
            <ObservationBlock label="Mood / Affect" value={data.moodAffect} />
            <ObservationBlock label="Activity Participation" value={data.activityParticipation} />
            <ObservationBlock label="Staff Interactions" value={data.staffInteractions} />
            <ObservationBlock label="Peer Interactions" value={data.peerInteractions} />
            <ObservationBlock label="Medication Compliance" value={data.medicationCompliance} />
            <ObservationBlock label="Hygiene / ADLs" value={data.hygieneAdl} />
            <ObservationBlock label="Meals / Appetite" value={data.mealsAppetite} />
            <ObservationBlock label="Sleep Pattern" value={data.sleepPattern} />
          </View>

          {(data.staffInterventions || data.residentResponse || data.notableEvents || data.additionalNotes) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Interventions & Events</Text>
              <ObservationBlock label="Staff Interventions" value={data.staffInterventions} />
              <ObservationBlock label="Resident Response" value={data.residentResponse} />
              <ObservationBlock label="Notable Events" value={data.notableEvents} />
              <ObservationBlock label="Additional Notes" value={data.additionalNotes} />
            </View>
          )}

          {/* Signature on page 2 */}
          {data.bhtSignature && (
            <SignatureSection data={data} />
          )}

          <PageFooter facilityName={data.facilityName} />
        </Page>
      )}
    </Document>
  );
}
