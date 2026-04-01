import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 35,
    paddingTop: 60,
    paddingBottom: 50,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.4,
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
    fontSize: 18,
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
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 6,
    paddingBottom: 3,
    borderBottom: "1 solid #e2e8f0",
    backgroundColor: "#f7fafc",
    padding: 5,
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
  textBlock: {
    marginBottom: 8,
    padding: 6,
    backgroundColor: "#f7fafc",
    borderRadius: 4,
    borderLeft: "3 solid #3182ce",
  },
  textBlockLabel: {
    color: "#2b6cb0",
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 3,
  },
  textBlockValue: {
    fontSize: 9,
    color: "#2d3748",
    lineHeight: 1.5,
  },
  attendeesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  attendeeBadge: {
    backgroundColor: "#c6f6d5",
    color: "#22543d",
    padding: "3 8",
    borderRadius: 3,
    fontSize: 9,
  },
  absentBadge: {
    backgroundColor: "#fed7d7",
    color: "#742a2a",
    padding: "3 8",
    borderRadius: 3,
    fontSize: 9,
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
  statusBadge: {
    padding: "4 8",
    borderRadius: 3,
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
  },
  statusApproved: {
    backgroundColor: "#c6f6d5",
    color: "#22543d",
  },
  statusDraft: {
    backgroundColor: "#fefcbf",
    color: "#744210",
  },
  statusSkipped: {
    backgroundColor: "#fed7d7",
    color: "#742a2a",
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
  signatureSection: {
    marginTop: 15,
    padding: 10,
    borderTop: "2 solid #1a365d",
  },
  signatureTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 10,
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  signatureBlock: {
    width: "45%",
  },
  signatureLine: {
    borderBottom: "1 solid #2d3748",
    marginBottom: 3,
    paddingBottom: 6,
    minHeight: 16,
  },
  signatureLabel: {
    fontSize: 8,
    color: "#718096",
  },
});

interface ARTMeetingData {
  // Meeting Info
  id: string;
  meetingMonth: number;
  meetingYear: number;
  meetingDate: string | null;
  meetingStartTime: string | null;
  meetingEndTime: string | null;
  status: string;
  isSkipped: boolean;
  skipReason: string | null;

  // Resident Info
  residentName: string;
  dateOfBirth: string | null;
  ahcccsId: string | null;
  caseManagerName: string | null;

  // Facility Info
  facilityName: string;

  // Meeting Content
  dxCodes: string | null;
  presentDuringMeeting: string[];
  absentDuringMeeting: string[];
  focusOfMeeting: string | null;
  resolutions: string | null;
  strengths: string | null;
  barriers: string | null;
  whatHasWorked: string | null;
  whatHasNotWorked: string | null;
  goals: string | null;
  concreteSteps: string | null;
  progressIndicators: string | null;
  medicalIssues: string | null;
  plan: string | null;
  summary: string | null;
  notesTakenBy: string | null;

  // Timestamps
  submittedAt: string | null;
  createdAt: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    const month = MONTH_NAMES[date.getUTCMonth()];
    const day = date.getUTCDate();
    const year = date.getUTCFullYear();
    return `${month} ${day}, ${year}`;
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr?: string | null): string {
  if (!timeStr) return "N/A";
  return timeStr;
}

function PageHeader({ data }: { data: ARTMeetingData }) {
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
          <Text style={styles.pageHeaderLabel}>Meeting Period:</Text>
          <Text style={styles.pageHeaderValue}>
            {MONTH_NAMES[data.meetingMonth - 1]} {data.meetingYear}
          </Text>
        </View>
        <View style={styles.pageHeaderItem}>
          <Text style={styles.pageHeaderLabel}>AHCCCS ID:</Text>
          <Text style={styles.pageHeaderValue}>{data.ahcccsId || "N/A"}</Text>
        </View>
      </View>
    </View>
  );
}

function PageFooter({ facilityName, id }: { facilityName: string; id: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        {facilityName} | ART Meeting Notes | Confidential
      </Text>
      <Text
        style={styles.footerText}
        render={({ pageNumber, totalPages }) =>
          `Document ID: ${id.slice(0, 8)} | Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  );
}

function TextBlock({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.textBlock}>
      <Text style={styles.textBlockLabel}>{label}</Text>
      <Text style={styles.textBlockValue}>{value}</Text>
    </View>
  );
}

function getStatusStyle(status: string, isSkipped: boolean) {
  if (isSkipped) return { ...styles.statusBadge, ...styles.statusSkipped };
  if (status === "APPROVED") return { ...styles.statusBadge, ...styles.statusApproved };
  return { ...styles.statusBadge, ...styles.statusDraft };
}

function getStatusLabel(status: string, isSkipped: boolean): string {
  if (isSkipped) return "SKIPPED";
  if (status === "APPROVED") return "APPROVED";
  if (status === "PENDING") return "PENDING";
  return "DRAFT";
}

export function ARTMeetingPDF({ data }: { data: ARTMeetingData }) {
  const hasContent = data.focusOfMeeting || data.resolutions || data.strengths ||
    data.barriers || data.whatHasWorked || data.whatHasNotWorked || data.goals ||
    data.concreteSteps || data.progressIndicators || data.medicalIssues || data.plan;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PageHeader data={data} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.facilityName}>{data.facilityName}</Text>
          <Text style={styles.title}>ART Meeting Notes</Text>
          <Text style={styles.subtitle}>
            Assessment Review Team Meeting - {MONTH_NAMES[data.meetingMonth - 1]} {data.meetingYear}
          </Text>
          <View style={styles.confidentialBanner}>
            <Text style={styles.confidentialText}>
              CONFIDENTIAL - PROTECTED HEALTH INFORMATION
            </Text>
          </View>
        </View>

        {/* Meeting Meta Info */}
        <View style={styles.metaInfo}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Meeting Date</Text>
            <Text style={styles.metaValue}>{formatDate(data.meetingDate)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Start Time</Text>
            <Text style={styles.metaValue}>{formatTime(data.meetingStartTime)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>End Time</Text>
            <Text style={styles.metaValue}>{formatTime(data.meetingEndTime)}</Text>
          </View>
        </View>

        {/* Skipped Meeting Notice */}
        {data.isSkipped && (
          <View style={{ backgroundColor: "#fed7d7", padding: 12, borderRadius: 4, marginBottom: 15 }}>
            <Text style={{ color: "#742a2a", fontWeight: "bold", fontSize: 11, marginBottom: 4 }}>
              Meeting Skipped
            </Text>
            <Text style={{ color: "#9b2c2c", fontSize: 10 }}>
              {data.skipReason || "No reason provided"}
            </Text>
          </View>
        )}

        {/* Resident Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RESIDENT INFORMATION</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Resident Name:</Text>
                <Text style={styles.value}>{data.residentName}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Date of Birth:</Text>
                <Text style={styles.value}>{formatDate(data.dateOfBirth)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>AHCCCS ID:</Text>
                <Text style={styles.value}>{data.ahcccsId || "N/A"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Case Manager:</Text>
                <Text style={styles.value}>{data.caseManagerName || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Diagnoses:</Text>
                <Text style={styles.value}>{data.dxCodes || "N/A"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Attendance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MEETING ATTENDANCE</Text>

          {data.presentDuringMeeting && data.presentDuringMeeting.length > 0 && (
            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 9, color: "#4a5568", marginBottom: 6, fontWeight: "bold" }}>
                Present:
              </Text>
              <View style={styles.attendeesList}>
                {data.presentDuringMeeting.map((person, idx) => (
                  <Text key={idx} style={styles.attendeeBadge}>{person}</Text>
                ))}
              </View>
            </View>
          )}

          {data.absentDuringMeeting && data.absentDuringMeeting.length > 0 && (
            <View>
              <Text style={{ fontSize: 9, color: "#4a5568", marginBottom: 6, fontWeight: "bold" }}>
                Absent:
              </Text>
              <View style={styles.attendeesList}>
                {data.absentDuringMeeting.map((person, idx) => (
                  <Text key={idx} style={styles.absentBadge}>{person}</Text>
                ))}
              </View>
            </View>
          )}

          {data.notesTakenBy && (
            <View style={styles.row}>
              <Text style={styles.label}>Notes Taken By:</Text>
              <Text style={styles.value}>{data.notesTakenBy}</Text>
            </View>
          )}
        </View>

        <PageFooter facilityName={data.facilityName} id={data.id} />
      </Page>

      {/* Page 2: Meeting Content */}
      {hasContent && !data.isSkipped && (
        <Page size="LETTER" style={styles.page}>
          <PageHeader data={data} />

          {/* Focus and Resolutions */}
          <View style={styles.section} minPresenceAhead={50}>
            <Text style={styles.sectionTitle}>MEETING FOCUS & RESOLUTIONS</Text>
            <TextBlock label="Focus of Meeting" value={data.focusOfMeeting} />
            <TextBlock label="Resolutions" value={data.resolutions} />
          </View>

          {/* Strengths and Barriers */}
          <View style={styles.section} minPresenceAhead={50}>
            <Text style={styles.sectionTitle}>STRENGTHS & BARRIERS</Text>
            <TextBlock label="Strengths" value={data.strengths} />
            <TextBlock label="Barriers" value={data.barriers} />
            <TextBlock label="What Has Worked" value={data.whatHasWorked} />
            <TextBlock label="What Has Not Worked" value={data.whatHasNotWorked} />
          </View>

          {/* Goals and Plan */}
          <View style={styles.section} minPresenceAhead={50}>
            <Text style={styles.sectionTitle}>GOALS & ACTION PLAN</Text>
            <TextBlock label="Goals" value={data.goals} />
            <TextBlock label="Concrete Steps" value={data.concreteSteps} />
            <TextBlock label="Progress Indicators" value={data.progressIndicators} />
          </View>

          {/* Medical Issues and Plan */}
          {(data.medicalIssues || data.plan) && (
            <View style={styles.section} minPresenceAhead={50}>
              <Text style={styles.sectionTitle}>MEDICAL ISSUES & PLAN</Text>
              <TextBlock label="Medical Issues" value={data.medicalIssues} />
              <TextBlock label="Plan" value={data.plan} />
            </View>
          )}

          {/* Meeting Summary */}
          {data.summary && (
            <View style={styles.section} minPresenceAhead={50}>
              <Text style={styles.sectionTitle}>MEETING SUMMARY</Text>
              <TextBlock label="Summary" value={data.summary} />
            </View>
          )}

          {/* Signature Section - wrap={false} keeps it together on one page */}
          <View style={styles.signatureSection} wrap={false}>
            <Text style={styles.signatureTitle}>Signatures</Text>
            <View style={styles.signatureRow}>
              <View style={styles.signatureBlock}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>BHT/Administrator Signature</Text>
              </View>
              <View style={styles.signatureBlock}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>Date</Text>
              </View>
            </View>
            <View style={styles.signatureRow}>
              <View style={styles.signatureBlock}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>BHP Signature</Text>
              </View>
              <View style={styles.signatureBlock}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>Date</Text>
              </View>
            </View>
          </View>

          <PageFooter facilityName={data.facilityName} id={data.id} />
        </Page>
      )}
    </Document>
  );
}
