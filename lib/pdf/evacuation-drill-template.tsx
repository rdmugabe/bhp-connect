import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    paddingBottom: 60,
    fontFamily: "Helvetica",
    fontSize: 10,
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
    fontSize: 11,
    color: "#4a5568",
    textAlign: "center",
    marginBottom: 4,
  },
  drillTypeLabel: {
    fontSize: 10,
    color: "#2d3748",
    textAlign: "center",
    fontStyle: "italic",
  },
  facilityInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 6,
    borderTop: "1 solid #e2e8f0",
  },
  facilityInfoItem: {
    fontSize: 9,
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
    fontSize: 9,
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
  threeColumn: {
    flexDirection: "row",
    gap: 8,
  },
  threeColumnItem: {
    flex: 1,
  },
  table: {
    marginTop: 6,
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#edf2f7",
    padding: 4,
    fontWeight: "bold",
    fontSize: 9,
    borderBottom: "1 solid #cbd5e0",
  },
  tableRow: {
    flexDirection: "row",
    padding: 4,
    borderBottom: "1 solid #e2e8f0",
    fontSize: 9,
  },
  checkItem: {
    flexDirection: "row",
    marginBottom: 3,
    fontSize: 9,
  },
  checkBox: {
    width: 12,
    height: 12,
    border: "1 solid #1a365d",
    marginRight: 8,
    textAlign: "center",
    fontSize: 10,
    fontWeight: "bold",
  },
  checkLabel: {
    flex: 1,
    paddingTop: 1,
  },
  textBlock: {
    marginBottom: 8,
  },
  textBlockValue: {
    fontSize: 9,
    backgroundColor: "#f7fafc",
    padding: 6,
    borderRadius: 3,
  },
  resultBadge: {
    padding: 4,
    borderRadius: 3,
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 4,
  },
  satisfactory: {
    backgroundColor: "#c6f6d5",
    color: "#276749",
  },
  needsImprovement: {
    backgroundColor: "#fefcbf",
    color: "#975a16",
  },
  unsatisfactory: {
    backgroundColor: "#fed7d7",
    color: "#c53030",
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
  signatureValue: {
    fontSize: 9,
    color: "#1a365d",
    height: 20,
    paddingTop: 4,
  },
  dateBlock: {
    width: 100,
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
});

interface Staff {
  name: string;
}

interface Resident {
  name: string;
  assistanceRequired?: string;
}

interface Signatures {
  conductedBy?: string;
  conductedByDate?: string;
  supervisor?: string;
  supervisorDate?: string;
}

interface EvacuationDrillData {
  id: string;
  drillType: "EVACUATION" | "DISASTER";
  drillDate: string;
  drillTime: string;
  dayOfWeek: string;
  totalLengthMinutes: number | null;
  shift: "AM" | "PM";
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  year: number;
  disasterDrillType: string | null;
  staffInvolved: Staff[];
  residentsInvolved: Resident[] | null;
  exitBlocked: string | null;
  exitUsed: string | null;
  assemblyPoint: string | null;
  correctLocation: boolean | null;
  allAccountedFor: boolean | null;
  issuesIdentified: boolean | null;
  observations: string | null;
  drillResult: "SATISFACTORY" | "NEEDS_IMPROVEMENT" | "UNSATISFACTORY";
  signatures: Signatures | null;
  submittedAt: string;
  facility: {
    name: string;
    address: string;
    bhp?: {
      user: {
        name: string;
      };
    };
  };
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return "N/A";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs} hr ${mins} min`;
  if (hrs > 0) return `${hrs} hr`;
  return `${mins} min`;
}

function getQuarterLabel(quarter: string): string {
  const labels: Record<string, string> = {
    Q1: "Q1 (Jan, Feb, Mar)",
    Q2: "Q2 (Apr, May, Jun)",
    Q3: "Q3 (Jul, Aug, Sep)",
    Q4: "Q4 (Oct, Nov, Dec)",
  };
  return labels[quarter] || quarter;
}

function getShiftLabel(shift: string): string {
  return shift === "AM" ? "AM (7:00AM - 7:00PM)" : "PM (7:00PM - 7:00AM)";
}

function getResultStyle(result: string) {
  switch (result) {
    case "SATISFACTORY":
      return styles.satisfactory;
    case "NEEDS_IMPROVEMENT":
      return styles.needsImprovement;
    case "UNSATISFACTORY":
      return styles.unsatisfactory;
    default:
      return {};
  }
}

function formatResult(result: string): string {
  return result.replace(/_/g, " ");
}

function Header({ data }: { data: EvacuationDrillData }) {
  return (
    <View style={styles.header} fixed>
      <Text style={styles.title}>EVACUATION / DISASTER DRILL REPORT</Text>
      <Text style={styles.subtitle}>
        {data.drillType === "EVACUATION" ? "Evacuation Drill" : "Disaster Drill"} - {getQuarterLabel(data.quarter)} {data.year}
      </Text>
      <Text style={styles.drillTypeLabel}>
        {data.drillType === "EVACUATION"
          ? "Staff and Residents - Every 6 Months"
          : "Staff Only - Every 3 Months"}
      </Text>
      <View style={styles.facilityInfo}>
        <View style={styles.facilityInfoItem}>
          <Text style={{ fontWeight: "bold" }}>{data.facility.name}</Text>
          <Text>{data.facility.address}</Text>
        </View>
        {data.facility.bhp && (
          <View style={styles.facilityInfoItem}>
            <Text>Managed by: {data.facility.bhp.user.name}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function Footer({ id }: { id: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        This document is an official evacuation/disaster drill record.
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

export function EvacuationDrillPDF({ data }: { data: EvacuationDrillData }) {
  const staff = data.staffInvolved || [];
  const residents = data.residentsInvolved || [];
  const signatures = data.signatures || {};

  return (
    <Document>
      <Page size="LETTER" style={styles.page} wrap>
        <Header data={data} />
        <Footer id={data.id} />

        {/* Drill Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DRILL INFORMATION</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Drill Type:</Text>
                <Text style={styles.value}>
                  {data.drillType === "EVACUATION" ? "Evacuation Drill" : "Disaster Drill"}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Date:</Text>
                <Text style={styles.value}>{formatDate(data.drillDate)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Day of Week:</Text>
                <Text style={styles.value}>{data.dayOfWeek}</Text>
              </View>
              {data.drillType === "DISASTER" && data.disasterDrillType && (
                <View style={styles.row}>
                  <Text style={styles.label}>Disaster Type:</Text>
                  <Text style={styles.value}>{data.disasterDrillType}</Text>
                </View>
              )}
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Time:</Text>
                <Text style={styles.value}>{data.drillTime}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Total Length:</Text>
                <Text style={styles.value}>{formatDuration(data.totalLengthMinutes)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Shift:</Text>
                <Text style={styles.value}>{getShiftLabel(data.shift)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Quarter:</Text>
                <Text style={styles.value}>{getQuarterLabel(data.quarter)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Staff Involved */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>STAFF INVOLVED ({staff.length})</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={{ width: "10%" }}>No.</Text>
              <Text style={{ width: "45%" }}>Staff Name</Text>
              <Text style={{ width: "10%" }}>No.</Text>
              <Text style={{ width: "35%" }}>Staff Name</Text>
            </View>
            {Array.from({ length: Math.ceil(staff.length / 2) }).map((_, rowIdx) => {
              const leftIdx = rowIdx * 2;
              const rightIdx = rowIdx * 2 + 1;
              return (
                <View key={rowIdx} style={styles.tableRow}>
                  <Text style={{ width: "10%" }}>{leftIdx + 1}</Text>
                  <Text style={{ width: "45%" }}>{staff[leftIdx]?.name || ""}</Text>
                  <Text style={{ width: "10%" }}>{rightIdx < staff.length ? rightIdx + 1 : ""}</Text>
                  <Text style={{ width: "35%" }}>{staff[rightIdx]?.name || ""}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Residents Involved - Only for Evacuation Drills */}
        {data.drillType === "EVACUATION" && residents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CLIENTS/RESIDENTS INVOLVED ({residents.length})</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={{ width: "10%" }}>No.</Text>
                <Text style={{ width: "40%" }}>Client Name</Text>
                <Text style={{ width: "50%" }}>Type of Assistance Required</Text>
              </View>
              {residents.map((resident, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={{ width: "10%" }}>{idx + 1}</Text>
                  <Text style={{ width: "40%" }}>{resident.name}</Text>
                  <Text style={{ width: "50%" }}>{resident.assistanceRequired || "None"}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Evacuation Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EVACUATION DETAILS</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Exit Blocked (Scenario):</Text>
                <Text style={styles.value}>{data.exitBlocked || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Exit Used:</Text>
                <Text style={styles.value}>{data.exitUsed || "N/A"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Assembly Point:</Text>
                <Text style={styles.value}>{data.assemblyPoint || "N/A"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.checkItem}>
                <View style={styles.checkBox}>
                  <Text>{data.correctLocation ? "X" : ""}</Text>
                </View>
                <Text style={styles.checkLabel}>Correct Location?</Text>
              </View>
              <View style={styles.checkItem}>
                <View style={styles.checkBox}>
                  <Text>{data.allAccountedFor ? "X" : ""}</Text>
                </View>
                <Text style={styles.checkLabel}>All Accounted For?</Text>
              </View>
              <View style={styles.checkItem}>
                <View style={styles.checkBox}>
                  <Text>{data.issuesIdentified ? "X" : ""}</Text>
                </View>
                <Text style={styles.checkLabel}>Issues Identified?</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Observations */}
        {data.observations && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>OBSERVATIONS / NOTES</Text>
            <View style={styles.textBlock}>
              <Text style={styles.textBlockValue}>{data.observations}</Text>
            </View>
          </View>
        )}

        {/* Drill Result */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DRILL RESULT</Text>
          <View style={[styles.resultBadge, getResultStyle(data.drillResult)]}>
            <Text>{formatResult(data.drillResult)}</Text>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection} wrap={false}>
          <Text style={styles.sectionTitle}>SIGNATURES</Text>

          <View style={styles.signatureRow}>
            <View style={styles.signatureBlock}>
              {signatures.conductedBy ? (
                <Text style={styles.signatureValue}>{signatures.conductedBy}</Text>
              ) : (
                <View style={styles.signatureLine} />
              )}
              <Text style={styles.signatureLabel}>Conducted By</Text>
            </View>
            <View style={styles.dateBlock}>
              {signatures.conductedByDate ? (
                <Text style={styles.signatureValue}>
                  {formatDate(signatures.conductedByDate)}
                </Text>
              ) : (
                <View style={styles.signatureLine} />
              )}
              <Text style={styles.signatureLabel}>Date</Text>
            </View>
          </View>

          <View style={styles.signatureRow}>
            <View style={styles.signatureBlock}>
              {signatures.supervisor ? (
                <Text style={styles.signatureValue}>{signatures.supervisor}</Text>
              ) : (
                <View style={styles.signatureLine} />
              )}
              <Text style={styles.signatureLabel}>Administrator/Supervisor</Text>
            </View>
            <View style={styles.dateBlock}>
              {signatures.supervisorDate ? (
                <Text style={styles.signatureValue}>
                  {formatDate(signatures.supervisorDate)}
                </Text>
              ) : (
                <View style={styles.signatureLine} />
              )}
              <Text style={styles.signatureLabel}>Date</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
