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
    marginBottom: 8,
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
  textBlock: {
    marginBottom: 8,
  },
  textBlockLabel: {
    color: "#4a5568",
    fontSize: 9,
    marginBottom: 2,
  },
  textBlockValue: {
    fontSize: 9,
    backgroundColor: "#f7fafc",
    padding: 6,
    borderRadius: 3,
  },
  checklistItem: {
    flexDirection: "row",
    marginBottom: 3,
    fontSize: 9,
  },
  checklistBox: {
    width: 12,
    height: 12,
    border: "1 solid #1a365d",
    marginRight: 8,
    textAlign: "center",
    fontSize: 10,
    fontWeight: "bold",
  },
  checklistLabel: {
    flex: 1,
    paddingTop: 1,
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
  dateLine: {
    borderBottom: "1 solid #1a365d",
    marginBottom: 4,
    height: 20,
  },
  dateLabel: {
    fontSize: 8,
    color: "#4a5568",
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

interface SafetyChecklist {
  fireAlarmFunctioned?: boolean;
  allResidentsAccountedFor?: boolean;
  staffFollowedProcedures?: boolean;
  exitRoutesClear?: boolean;
  emergencyExitsOpenedProperly?: boolean;
  fireExtinguishersAccessible?: boolean;
}

interface Resident {
  name: string;
  evacuated: boolean;
}

interface Signatures {
  staffSignature?: string;
  staffSignatureDate?: string;
  supervisorSignature?: string;
  supervisorSignatureDate?: string;
}

interface FireDrillData {
  id: string;
  reportMonth: number;
  reportYear: number;
  drillDate: string;
  drillTime: string;
  location: string | null;
  shift: "AM" | "PM";
  drillType: "ANNOUNCED" | "UNANNOUNCED";
  conductedBy: string;
  alarmActivatedTime: string | null;
  buildingClearTime: string | null;
  totalEvacuationTime: string | null;
  numberEvacuated: number | null;
  safetyChecklist: SafetyChecklist;
  residentsPresent: Resident[] | null;
  observations: string | null;
  correctiveActions: string | null;
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

function getMonthName(month: number): string {
  const date = new Date();
  date.setMonth(month - 1);
  return date.toLocaleString("default", { month: "long" });
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

function Header({ data }: { data: FireDrillData }) {
  return (
    <View style={styles.header} fixed>
      <Text style={styles.title}>Fire Drill Safety Report</Text>
      <Text style={styles.subtitle}>
        {getMonthName(data.reportMonth)} {data.reportYear} - {data.shift} Shift
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
        This document is an official fire drill safety record.
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

export function FireDrillPDF({ data }: { data: FireDrillData }) {
  const checklist = data.safetyChecklist || {};
  const residents = data.residentsPresent || [];
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
                <Text style={styles.label}>Drill Date:</Text>
                <Text style={styles.value}>{formatDate(data.drillDate)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Drill Time:</Text>
                <Text style={styles.value}>{data.drillTime}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Location:</Text>
                <Text style={styles.value}>{data.location || "N/A"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Shift:</Text>
                <Text style={styles.value}>{data.shift}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Drill Type:</Text>
                <Text style={styles.value}>{data.drillType}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Conducted By:</Text>
                <Text style={styles.value}>{data.conductedBy}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Evacuation Times */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EVACUATION TIMES</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Alarm Activated:</Text>
                <Text style={styles.value}>
                  {data.alarmActivatedTime || "N/A"}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Building Clear:</Text>
                <Text style={styles.value}>
                  {data.buildingClearTime || "N/A"}
                </Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.row}>
                <Text style={styles.label}>Total Evacuation Time:</Text>
                <Text style={styles.value}>
                  {data.totalEvacuationTime || "N/A"}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Number Evacuated:</Text>
                <Text style={styles.value}>
                  {data.numberEvacuated !== null ? data.numberEvacuated : "N/A"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Safety Checklist */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SAFETY CHECKLIST</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.checklistItem}>
                <View style={styles.checklistBox}>
                  <Text>{checklist.fireAlarmFunctioned ? "X" : ""}</Text>
                </View>
                <Text style={styles.checklistLabel}>
                  Fire alarm functioned properly
                </Text>
              </View>
              <View style={styles.checklistItem}>
                <View style={styles.checklistBox}>
                  <Text>{checklist.allResidentsAccountedFor ? "X" : ""}</Text>
                </View>
                <Text style={styles.checklistLabel}>
                  All residents accounted for
                </Text>
              </View>
              <View style={styles.checklistItem}>
                <View style={styles.checklistBox}>
                  <Text>{checklist.staffFollowedProcedures ? "X" : ""}</Text>
                </View>
                <Text style={styles.checklistLabel}>
                  Staff followed evacuation procedures
                </Text>
              </View>
            </View>
            <View style={styles.column}>
              <View style={styles.checklistItem}>
                <View style={styles.checklistBox}>
                  <Text>{checklist.exitRoutesClear ? "X" : ""}</Text>
                </View>
                <Text style={styles.checklistLabel}>
                  Exit routes clear and accessible
                </Text>
              </View>
              <View style={styles.checklistItem}>
                <View style={styles.checklistBox}>
                  <Text>{checklist.emergencyExitsOpenedProperly ? "X" : ""}</Text>
                </View>
                <Text style={styles.checklistLabel}>
                  Emergency exits opened properly
                </Text>
              </View>
              <View style={styles.checklistItem}>
                <View style={styles.checklistBox}>
                  <Text>{checklist.fireExtinguishersAccessible ? "X" : ""}</Text>
                </View>
                <Text style={styles.checklistLabel}>
                  Fire extinguishers accessible
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Residents Present */}
        {residents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RESIDENTS PRESENT</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={{ width: "60%" }}>Resident Name</Text>
                <Text style={{ width: "40%" }}>Successfully Evacuated</Text>
              </View>
              {residents.map((resident, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={{ width: "60%" }}>{resident.name}</Text>
                  <Text style={{ width: "40%" }}>
                    {resident.evacuated ? "Yes" : "No"}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Observations */}
        {data.observations && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>OBSERVATIONS</Text>
            <View style={styles.textBlock}>
              <Text style={styles.textBlockValue}>{data.observations}</Text>
            </View>
          </View>
        )}

        {/* Corrective Actions */}
        {data.correctiveActions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CORRECTIVE ACTIONS NEEDED</Text>
            <View style={styles.textBlock}>
              <Text style={styles.textBlockValue}>{data.correctiveActions}</Text>
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
              {signatures.staffSignature ? (
                <Text style={styles.signatureValue}>
                  {signatures.staffSignature}
                </Text>
              ) : (
                <View style={styles.signatureLine} />
              )}
              <Text style={styles.signatureLabel}>Staff Member</Text>
            </View>
            <View style={styles.dateBlock}>
              {signatures.staffSignatureDate ? (
                <Text style={styles.signatureValue}>
                  {formatDate(signatures.staffSignatureDate)}
                </Text>
              ) : (
                <View style={styles.dateLine} />
              )}
              <Text style={styles.dateLabel}>Date</Text>
            </View>
          </View>

          <View style={styles.signatureRow}>
            <View style={styles.signatureBlock}>
              {signatures.supervisorSignature ? (
                <Text style={styles.signatureValue}>
                  {signatures.supervisorSignature}
                </Text>
              ) : (
                <View style={styles.signatureLine} />
              )}
              <Text style={styles.signatureLabel}>Supervisor</Text>
            </View>
            <View style={styles.dateBlock}>
              {signatures.supervisorSignatureDate ? (
                <Text style={styles.signatureValue}>
                  {formatDate(signatures.supervisorSignatureDate)}
                </Text>
              ) : (
                <View style={styles.dateLine} />
              )}
              <Text style={styles.dateLabel}>Date</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
