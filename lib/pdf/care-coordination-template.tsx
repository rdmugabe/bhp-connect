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
  residentInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#edf2f7",
    borderRadius: 4,
  },
  infoColumn: {
    flexDirection: "column",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 9,
    color: "#718096",
    marginRight: 4,
    width: 80,
  },
  infoValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#2d3748",
  },
  table: {
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#edf2f7",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    minHeight: 30,
  },
  tableRowAlt: {
    backgroundColor: "#f7fafc",
  },
  tableCell: {
    padding: 6,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
  },
  tableCellLast: {
    borderRightWidth: 0,
  },
  tableHeaderCell: {
    fontWeight: "bold",
    color: "#2d3748",
    fontSize: 9,
  },
  colDate: {
    width: "12%",
  },
  colTime: {
    width: "8%",
  },
  colType: {
    width: "12%",
  },
  colDescription: {
    width: "35%",
  },
  colOutcome: {
    width: "20%",
  },
  colStaff: {
    width: "13%",
  },
  activityTypeBadge: {
    padding: "2 4",
    borderRadius: 2,
    fontSize: 8,
    textAlign: "center",
  },
  summarySection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f0fff4",
    borderRadius: 6,
    borderLeft: "4 solid #38a169",
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#22543d",
    marginBottom: 10,
  },
  summaryContent: {
    fontSize: 10,
    color: "#2d3748",
    lineHeight: 1.7,
    textAlign: "justify",
  },
  highlightsSection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#ebf8ff",
    borderRadius: 4,
  },
  highlightsTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#2b6cb0",
    marginBottom: 8,
  },
  highlightItem: {
    flexDirection: "row",
    marginBottom: 4,
  },
  highlightBullet: {
    width: 15,
    fontSize: 10,
    color: "#2b6cb0",
  },
  highlightText: {
    flex: 1,
    fontSize: 9,
    color: "#2d3748",
  },
  followUpSection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#fffaf0",
    borderRadius: 4,
    borderLeft: "4 solid #dd6b20",
  },
  followUpTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#c05621",
    marginBottom: 8,
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
  pageNumber: {
    position: "absolute",
    bottom: 30,
    right: 40,
    fontSize: 8,
    color: "#718096",
  },
});

const ACTIVITY_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  MEDICAL: { bg: "#fed7d7", text: "#c53030" },
  BEHAVIORAL_HEALTH: { bg: "#e9d8fd", text: "#6b46c1" },
  TRANSPORTATION: { bg: "#bee3f8", text: "#2b6cb0" },
  INSURANCE: { bg: "#c6f6d5", text: "#276749" },
  CASE_MANAGER: { bg: "#fefcbf", text: "#975a16" },
  APPOINTMENTS: { bg: "#b2f5ea", text: "#0d9488" },
  MEDICATIONS: { bg: "#fed7aa", text: "#c05621" },
  FAMILY: { bg: "#fbb6ce", text: "#b83280" },
  REFERRALS: { bg: "#c3dafe", text: "#4c51bf" },
  OTHER: { bg: "#e2e8f0", text: "#4a5568" },
};

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  MEDICAL: "Medical",
  BEHAVIORAL_HEALTH: "BH",
  TRANSPORTATION: "Transport",
  INSURANCE: "Insurance",
  CASE_MANAGER: "Case Mgmt",
  APPOINTMENTS: "Appt",
  MEDICATIONS: "Meds",
  FAMILY: "Family",
  REFERRALS: "Referral",
  OTHER: "Other",
};

interface CareCoordinationEntry {
  activityType: string;
  activityDate: string;
  activityTime?: string;
  description: string;
  outcome?: string;
  followUpNeeded: boolean;
  followUpDate?: string;
  createdByName: string;
}

interface CareCoordinationPDFData {
  // Resident Info
  residentName: string;
  dateOfBirth: string;
  ahcccsId?: string;

  // Facility Info
  facilityName: string;

  // Report Meta
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  generatedAt: string;
  generatedBy: string;

  // Entries
  entries: CareCoordinationEntry[];

  // Summary (optional)
  summary?: {
    text: string;
    keyHighlights?: string[];
    pendingFollowUps?: string[];
    coordinationGaps?: string;
  };
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
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

function PageHeader({ data }: { data: CareCoordinationPDFData }) {
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
          <Text style={styles.pageHeaderLabel}>Generated:</Text>
          <Text style={styles.pageHeaderValue}>{formatDateTime(data.generatedAt)}</Text>
        </View>
        <View style={styles.pageHeaderItem}>
          <Text style={styles.pageHeaderLabel}>By:</Text>
          <Text style={styles.pageHeaderValue}>{data.generatedBy}</Text>
        </View>
      </View>
    </View>
  );
}

function PageFooter({ facilityName }: { facilityName: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        {facilityName} | Care Coordination Timeline | Confidential
      </Text>
      <Text style={styles.footerText}>
        This document contains protected health information. Handle in accordance with facility policies.
      </Text>
    </View>
  );
}

function ActivityTypeBadge({ type }: { type: string }) {
  const colors = ACTIVITY_TYPE_COLORS[type] || ACTIVITY_TYPE_COLORS.OTHER;
  const label = ACTIVITY_TYPE_LABELS[type] || type;

  return (
    <Text
      style={[
        styles.activityTypeBadge,
        { backgroundColor: colors.bg, color: colors.text },
      ]}
    >
      {label}
    </Text>
  );
}

export function CareCoordinationPDF({ data }: { data: CareCoordinationPDFData }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PageHeader data={data} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.facilityName}>{data.facilityName}</Text>
          <Text style={styles.title}>Care Coordination Timeline</Text>
          <Text style={styles.subtitle}>
            {data.dateRange
              ? `${formatDate(data.dateRange.startDate)} - ${formatDate(data.dateRange.endDate)}`
              : "All Activities"}
          </Text>
          <View style={styles.confidentialBanner}>
            <Text style={styles.confidentialText}>
              CONFIDENTIAL - PROTECTED HEALTH INFORMATION
            </Text>
          </View>
        </View>

        {/* Resident Information */}
        <View style={styles.residentInfo}>
          <View style={styles.infoColumn}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Resident Name:</Text>
              <Text style={styles.infoValue}>{data.residentName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date of Birth:</Text>
              <Text style={styles.infoValue}>{formatDate(data.dateOfBirth)}</Text>
            </View>
          </View>
          <View style={styles.infoColumn}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>AHCCCS ID:</Text>
              <Text style={styles.infoValue}>{data.ahcccsId || "N/A"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total Entries:</Text>
              <Text style={styles.infoValue}>{data.entries.length}</Text>
            </View>
          </View>
        </View>

        {/* Summary Section (if available) */}
        {data.summary && (
          <>
            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>Coordination Summary</Text>
              <Text style={styles.summaryContent}>{data.summary.text}</Text>
            </View>

            {data.summary.keyHighlights && data.summary.keyHighlights.length > 0 && (
              <View style={styles.highlightsSection}>
                <Text style={styles.highlightsTitle}>Key Highlights</Text>
                {data.summary.keyHighlights.map((highlight, idx) => (
                  <View key={idx} style={styles.highlightItem}>
                    <Text style={styles.highlightBullet}>•</Text>
                    <Text style={styles.highlightText}>{highlight}</Text>
                  </View>
                ))}
              </View>
            )}

            {data.summary.pendingFollowUps && data.summary.pendingFollowUps.length > 0 && (
              <View style={styles.followUpSection}>
                <Text style={styles.followUpTitle}>Pending Follow-Ups</Text>
                {data.summary.pendingFollowUps.map((followUp, idx) => (
                  <View key={idx} style={styles.highlightItem}>
                    <Text style={styles.highlightBullet}>•</Text>
                    <Text style={styles.highlightText}>{followUp}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <PageFooter facilityName={data.facilityName} />

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>

      {/* Timeline Table Page(s) */}
      <Page size="LETTER" style={styles.page}>
        <PageHeader data={data} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Timeline</Text>

          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.tableHeaderCell, styles.colDate]}>
                Date
              </Text>
              <Text style={[styles.tableCell, styles.tableHeaderCell, styles.colTime]}>
                Time
              </Text>
              <Text style={[styles.tableCell, styles.tableHeaderCell, styles.colType]}>
                Type
              </Text>
              <Text style={[styles.tableCell, styles.tableHeaderCell, styles.colDescription]}>
                Description
              </Text>
              <Text style={[styles.tableCell, styles.tableHeaderCell, styles.colOutcome]}>
                Outcome
              </Text>
              <Text style={[styles.tableCell, styles.tableHeaderCell, styles.colStaff, styles.tableCellLast]}>
                Staff
              </Text>
            </View>

            {/* Table Rows */}
            {data.entries.map((entry, idx) => (
              <View
                key={idx}
                style={idx % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}
                wrap={false}
              >
                <View style={[styles.tableCell, styles.colDate]}>
                  <Text>{formatDate(entry.activityDate)}</Text>
                </View>
                <View style={[styles.tableCell, styles.colTime]}>
                  <Text>{entry.activityTime || "-"}</Text>
                </View>
                <View style={[styles.tableCell, styles.colType]}>
                  <ActivityTypeBadge type={entry.activityType} />
                </View>
                <View style={[styles.tableCell, styles.colDescription]}>
                  <Text>{entry.description}</Text>
                  {entry.followUpNeeded && (
                    <Text style={{ fontSize: 8, color: "#c05621", marginTop: 2 }}>
                      Follow-up: {entry.followUpDate ? formatDate(entry.followUpDate) : "Needed"}
                    </Text>
                  )}
                </View>
                <View style={[styles.tableCell, styles.colOutcome]}>
                  <Text>{entry.outcome || "-"}</Text>
                </View>
                <Text style={[styles.tableCell, styles.colStaff, styles.tableCellLast]}>
                  {entry.createdByName}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <PageFooter facilityName={data.facilityName} />

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
