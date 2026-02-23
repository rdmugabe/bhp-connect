import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: "Helvetica",
    fontSize: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#1a365d",
  },
  headerSection: {
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  headerCell: {
    flex: 1,
    flexDirection: "row",
  },
  headerLabel: {
    fontWeight: "bold",
    marginRight: 4,
  },
  headerValue: {
    flex: 1,
    borderBottom: "1 solid #000",
    minHeight: 12,
    paddingBottom: 2,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    borderTop: "1 solid #000",
    borderLeft: "1 solid #000",
    borderRight: "1 solid #000",
  },
  tableRow: {
    flexDirection: "row",
    borderLeft: "1 solid #000",
    borderRight: "1 solid #000",
    borderBottom: "1 solid #000",
    minHeight: 20,
  },
  medicationCell: {
    width: "15%",
    borderRight: "1 solid #000",
    padding: 2,
    fontSize: 7,
  },
  doseCell: {
    width: "12%",
    borderRight: "1 solid #000",
    padding: 2,
    fontSize: 7,
  },
  timeCell: {
    width: "5%",
    borderRight: "1 solid #000",
    padding: 2,
    fontSize: 7,
    textAlign: "center",
  },
  dayCell: {
    width: "2.2%",
    borderRight: "1 solid #000",
    padding: 1,
    fontSize: 6,
    textAlign: "center",
  },
  dayHeaderCell: {
    width: "2.2%",
    borderRight: "1 solid #000",
    padding: 1,
    fontSize: 6,
    textAlign: "center",
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 5,
    backgroundColor: "#f7fafc",
    padding: 4,
    borderTop: "1 solid #000",
    borderLeft: "1 solid #000",
    borderRight: "1 solid #000",
  },
  prnTable: {
    marginTop: 5,
  },
  prnHeader: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    borderTop: "1 solid #000",
    borderLeft: "1 solid #000",
    borderRight: "1 solid #000",
  },
  prnCell: {
    padding: 3,
    borderRight: "1 solid #000",
    fontSize: 7,
    textAlign: "center",
  },
  codesSection: {
    marginTop: 10,
    padding: 5,
    backgroundColor: "#f7fafc",
    border: "1 solid #000",
  },
  codesText: {
    fontSize: 7,
    marginBottom: 2,
  },
  signatureSection: {
    marginTop: 10,
  },
  signatureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    border: "1 solid #000",
  },
  signatureCell: {
    width: "25%",
    padding: 4,
    borderRight: "1 solid #000",
    borderBottom: "1 solid #000",
    minHeight: 25,
  },
  signatureLabel: {
    fontSize: 6,
    color: "#718096",
  },
  reviewSection: {
    marginTop: 10,
    padding: 8,
    border: "1 solid #000",
    backgroundColor: "#f7fafc",
  },
  reviewRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  importantNote: {
    marginTop: 10,
    padding: 5,
    backgroundColor: "#fed7d7",
    border: "1 solid #c53030",
  },
  importantText: {
    fontSize: 7,
    color: "#c53030",
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 15,
    left: 20,
    right: 20,
    fontSize: 6,
    color: "#718096",
    textAlign: "center",
    borderTop: "1 solid #e2e8f0",
    paddingTop: 5,
  },
});

interface MARData {
  facilityName: string;
  monthYear: string;
  residentName: string;
  dateOfBirth: string;
  admitDate?: string;
  allergies?: string;
  ahcccsId?: string;
  diagnosis?: string;
  emergencyContact?: string;
  prescriberName?: string;
  prescriberPhone?: string;
  pharmacyName?: string;
  pharmacyPhone?: string;
}

function getDaysInMonth(monthYear: string): number {
  try {
    const [month, year] = monthYear.split("/");
    const monthNum = parseInt(month) || new Date().getMonth() + 1;
    const yearNum = parseInt(year) || new Date().getFullYear();
    return new Date(yearNum, monthNum, 0).getDate();
  } catch {
    return 31;
  }
}

export function MARTemplate({ data }: { data: MARData }) {
  const daysInMonth = getDaysInMonth(data.monthYear);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const medicationRows = Array.from({ length: 12 }, (_, i) => i);
  const prnRows = Array.from({ length: 6 }, (_, i) => i);
  const signatureRows = Array.from({ length: 4 }, (_, i) => i);

  return (
    <Document>
      <Page size="LETTER" orientation="landscape" style={styles.page}>
        {/* Title */}
        <Text style={styles.title}>MEDICATION ADMINISTRATION RECORD (MAR)</Text>

        {/* Header Information */}
        <View style={styles.headerSection}>
          {/* Row 1 */}
          <View style={styles.headerRow}>
            <View style={[styles.headerCell, { flex: 2 }]}>
              <Text style={styles.headerLabel}>Facility:</Text>
              <Text style={styles.headerValue}>{data.facilityName}</Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.headerLabel}>Month/Year:</Text>
              <Text style={styles.headerValue}>{data.monthYear}</Text>
            </View>
          </View>

          {/* Row 2 */}
          <View style={styles.headerRow}>
            <View style={styles.headerCell}>
              <Text style={styles.headerLabel}>Resident:</Text>
              <Text style={styles.headerValue}>{data.residentName}</Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.headerLabel}>DOB:</Text>
              <Text style={styles.headerValue}>{data.dateOfBirth}</Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.headerLabel}>Admit Date:</Text>
              <Text style={styles.headerValue}>{data.admitDate || ""}</Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.headerLabel}>ALLERGIES:</Text>
              <Text style={[styles.headerValue, { color: data.allergies ? "#c53030" : "#000" }]}>
                {data.allergies || "NKDA"}
              </Text>
            </View>
          </View>

          {/* Row 3 */}
          <View style={styles.headerRow}>
            <View style={styles.headerCell}>
              <Text style={styles.headerLabel}>Prescriber:</Text>
              <Text style={styles.headerValue}>{data.prescriberName || ""}</Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.headerLabel}>Pharmacy:</Text>
              <Text style={styles.headerValue}>{data.pharmacyName || ""}</Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.headerLabel}>AHCCCS ID:</Text>
              <Text style={styles.headerValue}>{data.ahcccsId || ""}</Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.headerLabel}>Dx:</Text>
              <Text style={styles.headerValue}>{data.diagnosis || ""}</Text>
            </View>
          </View>

          {/* Row 4 */}
          <View style={styles.headerRow}>
            <View style={styles.headerCell}>
              <Text style={styles.headerLabel}>Prescriber Ph:</Text>
              <Text style={styles.headerValue}>{data.prescriberPhone || ""}</Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.headerLabel}>Pharmacy Ph:</Text>
              <Text style={styles.headerValue}>{data.pharmacyPhone || ""}</Text>
            </View>
            <View style={[styles.headerCell, { flex: 2 }]}>
              <Text style={styles.headerLabel}>Emergency Contact:</Text>
              <Text style={styles.headerValue}>{data.emergencyContact || ""}</Text>
            </View>
          </View>
        </View>

        {/* Medication Table */}
        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.tableHeader}>
            <View style={[styles.medicationCell, { fontWeight: "bold" }]}>
              <Text>Medication</Text>
            </View>
            <View style={[styles.doseCell, { fontWeight: "bold" }]}>
              <Text>Dose/Route/Freq</Text>
            </View>
            <View style={[styles.timeCell, { fontWeight: "bold" }]}>
              <Text>Time</Text>
            </View>
            {days.map((day) => (
              <View key={day} style={styles.dayHeaderCell}>
                <Text>{day}</Text>
              </View>
            ))}
          </View>

          {/* Medication Rows */}
          {medicationRows.map((row) => (
            <View key={row} style={styles.tableRow}>
              <View style={styles.medicationCell}>
                <Text> </Text>
              </View>
              <View style={styles.doseCell}>
                <Text> </Text>
              </View>
              <View style={styles.timeCell}>
                <Text> </Text>
              </View>
              {days.map((day) => (
                <View key={day} style={[styles.dayCell, day > daysInMonth ? { backgroundColor: "#e2e8f0" } : {}]}>
                  <Text> </Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* PRN Medications Section */}
        <Text style={styles.sectionTitle}>PRN (AS NEEDED) MEDICATIONS</Text>
        <View style={styles.prnTable}>
          <View style={styles.prnHeader}>
            <View style={[styles.prnCell, { width: "12%" }]}>
              <Text style={{ fontWeight: "bold" }}>Date/Time</Text>
            </View>
            <View style={[styles.prnCell, { width: "25%" }]}>
              <Text style={{ fontWeight: "bold" }}>Medication/Dose</Text>
            </View>
            <View style={[styles.prnCell, { width: "25%" }]}>
              <Text style={{ fontWeight: "bold" }}>Reason Given</Text>
            </View>
            <View style={[styles.prnCell, { width: "25%" }]}>
              <Text style={{ fontWeight: "bold" }}>Effectiveness (30-60 min)</Text>
            </View>
            <View style={[styles.prnCell, { width: "13%", borderRight: "none" }]}>
              <Text style={{ fontWeight: "bold" }}>Initials</Text>
            </View>
          </View>
          {prnRows.map((row) => (
            <View key={row} style={styles.tableRow}>
              <View style={[styles.prnCell, { width: "12%" }]}>
                <Text> </Text>
              </View>
              <View style={[styles.prnCell, { width: "25%" }]}>
                <Text> </Text>
              </View>
              <View style={[styles.prnCell, { width: "25%" }]}>
                <Text> </Text>
              </View>
              <View style={[styles.prnCell, { width: "25%" }]}>
                <Text> </Text>
              </View>
              <View style={[styles.prnCell, { width: "13%", borderRight: "none" }]}>
                <Text> </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Codes Section */}
        <View style={styles.codesSection}>
          <Text style={styles.codesText}>
            <Text style={{ fontWeight: "bold" }}>CODES: </Text>
            ✓/Initials = Administered | O (circle) = Refused | H = Held | N/A = Not Available | D/C = Discontinued | LOA = Leave of Absence
          </Text>
        </View>

        {/* Staff Signature Log */}
        <Text style={styles.sectionTitle}>STAFF SIGNATURE LOG</Text>
        <View style={styles.signatureGrid}>
          {signatureRows.map((row) => (
            <View key={row} style={{ flexDirection: "row", width: "100%" }}>
              <View style={styles.signatureCell}>
                <Text style={styles.signatureLabel}>Initials</Text>
              </View>
              <View style={[styles.signatureCell, { width: "25%" }]}>
                <Text style={styles.signatureLabel}>Signature/Title</Text>
              </View>
              <View style={styles.signatureCell}>
                <Text style={styles.signatureLabel}>Initials</Text>
              </View>
              <View style={[styles.signatureCell, { width: "25%", borderRight: "none" }]}>
                <Text style={styles.signatureLabel}>Signature/Title</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Monthly Review Section */}
        <View style={styles.reviewSection}>
          <Text style={{ fontWeight: "bold", marginBottom: 4 }}>MONTHLY REVIEW:</Text>
          <View style={styles.reviewRow}>
            <Text>Doses Scheduled: ________ | Doses Given: ________ | Doses Missed/Refused: ________ | Discrepancies: ________________________________</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text>Nurse/Supervisor Signature: _________________________________________________ Date: ______________</Text>
          </View>
        </View>

        {/* Important Note */}
        <View style={styles.importantNote}>
          <Text style={styles.importantText}>
            IMPORTANT: Document in real-time. Never pre-sign or back-sign. Use black ink only. Single line through errors with initials/date. No white-out.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Medication Administration Record - {data.residentName} - {data.monthYear}</Text>
        </View>
      </Page>
    </Document>
  );
}
