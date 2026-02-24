import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 12,
    fontFamily: "Helvetica",
    fontSize: 7,
  },
  title: {
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
    color: "#1a365d",
  },
  headerSection: {
    marginBottom: 6,
  },
  headerRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  headerCell: {
    flex: 1,
    flexDirection: "row",
  },
  headerLabel: {
    fontWeight: "bold",
    marginRight: 3,
    fontSize: 7,
  },
  headerValue: {
    flex: 1,
    borderBottom: "0.5 solid #000",
    minHeight: 10,
    fontSize: 7,
  },
  table: {
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    borderTop: "0.5 solid #000",
    borderLeft: "0.5 solid #000",
    borderRight: "0.5 solid #000",
  },
  tableRow: {
    flexDirection: "row",
    borderLeft: "0.5 solid #000",
    borderRight: "0.5 solid #000",
    borderBottom: "0.5 solid #000",
    minHeight: 16,
  },
  medicationCell: {
    width: "15%",
    borderRight: "0.5 solid #000",
    padding: 2,
    fontSize: 6,
  },
  doseCell: {
    width: "12%",
    borderRight: "0.5 solid #000",
    padding: 2,
    fontSize: 6,
  },
  timeCell: {
    width: "5%",
    borderRight: "0.5 solid #000",
    padding: 2,
    fontSize: 6,
    textAlign: "center",
  },
  dayCell: {
    width: "2.2%",
    borderRight: "0.5 solid #000",
    padding: 1,
    fontSize: 5,
    textAlign: "center",
  },
  dayHeaderCell: {
    width: "2.2%",
    borderRight: "0.5 solid #000",
    padding: 1,
    fontSize: 5,
    textAlign: "center",
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: "bold",
    marginTop: 6,
    marginBottom: 2,
    backgroundColor: "#f7fafc",
    padding: 3,
    borderTop: "0.5 solid #000",
    borderLeft: "0.5 solid #000",
    borderRight: "0.5 solid #000",
  },
  prnHeader: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    borderTop: "0.5 solid #000",
    borderLeft: "0.5 solid #000",
    borderRight: "0.5 solid #000",
  },
  prnRow: {
    flexDirection: "row",
    borderLeft: "0.5 solid #000",
    borderRight: "0.5 solid #000",
    borderBottom: "0.5 solid #000",
    minHeight: 14,
  },
  prnCell: {
    padding: 2,
    borderRight: "0.5 solid #000",
    fontSize: 6,
    textAlign: "center",
  },
  bottomRow: {
    flexDirection: "row",
    marginTop: 6,
    gap: 10,
  },
  codesBox: {
    flex: 1,
    padding: 4,
    backgroundColor: "#f7fafc",
    border: "0.5 solid #000",
  },
  codesText: {
    fontSize: 6,
  },
  signatureBox: {
    flex: 1.5,
  },
  signatureTitle: {
    fontSize: 7,
    fontWeight: "bold",
    backgroundColor: "#f7fafc",
    padding: 2,
    borderTop: "0.5 solid #000",
    borderLeft: "0.5 solid #000",
    borderRight: "0.5 solid #000",
  },
  signatureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    border: "0.5 solid #000",
  },
  signatureCell: {
    width: "25%",
    padding: 2,
    borderRight: "0.5 solid #000",
    borderBottom: "0.5 solid #000",
    minHeight: 18,
  },
  signatureLabel: {
    fontSize: 5,
    color: "#718096",
  },
  reviewBox: {
    marginTop: 6,
    padding: 4,
    border: "0.5 solid #000",
    backgroundColor: "#f7fafc",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  reviewText: {
    fontSize: 6,
  },
  importantNote: {
    marginTop: 4,
    padding: 3,
    backgroundColor: "#fed7d7",
    border: "0.5 solid #c53030",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  importantText: {
    fontSize: 5,
    color: "#c53030",
    fontWeight: "bold",
  },
  footerText: {
    fontSize: 5,
    color: "#718096",
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
  const medicationRows = Array.from({ length: 14 }, (_, i) => i);
  const prnRows = Array.from({ length: 5 }, (_, i) => i);
  const signatureRows = Array.from({ length: 4 }, (_, i) => i);

  return (
    <Document>
      <Page size="LETTER" orientation="landscape" style={styles.page}>
        {/* Title */}
        <Text style={styles.title}>MEDICATION ADMINISTRATION RECORD (MAR)</Text>

        {/* Header Information - Compact */}
        <View style={styles.headerSection}>
          {/* Row 1 */}
          <View style={styles.headerRow}>
            <View style={[styles.headerCell, { flex: 1.5 }]}>
              <Text style={styles.headerLabel}>Facility:</Text>
              <Text style={styles.headerValue}>{data.facilityName}</Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.headerLabel}>Month/Year:</Text>
              <Text style={styles.headerValue}>{data.monthYear}</Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.headerLabel}>Resident:</Text>
              <Text style={styles.headerValue}>{data.residentName}</Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.headerLabel}>DOB:</Text>
              <Text style={styles.headerValue}>{data.dateOfBirth}</Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.headerLabel}>ALLERGIES:</Text>
              <Text style={[styles.headerValue, { color: data.allergies ? "#c53030" : "#000" }]}>
                {data.allergies || "NKDA"}
              </Text>
            </View>
          </View>

          {/* Row 2 */}
          <View style={styles.headerRow}>
            <View style={styles.headerCell}>
              <Text style={styles.headerLabel}>Prescriber:</Text>
              <Text style={styles.headerValue}>{data.prescriberName || ""}</Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.headerLabel}>Ph:</Text>
              <Text style={styles.headerValue}>{data.prescriberPhone || ""}</Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.headerLabel}>Pharmacy:</Text>
              <Text style={styles.headerValue}>{data.pharmacyName || ""}</Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.headerLabel}>Ph:</Text>
              <Text style={styles.headerValue}>{data.pharmacyPhone || ""}</Text>
            </View>
            <View style={styles.headerCell}>
              <Text style={styles.headerLabel}>AHCCCS:</Text>
              <Text style={styles.headerValue}>{data.ahcccsId || ""}</Text>
            </View>
          </View>
        </View>

        {/* Medication Table */}
        <View style={styles.table}>
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
        <View>
          <View style={styles.prnHeader}>
            <View style={[styles.prnCell, { width: "12%" }]}>
              <Text style={{ fontWeight: "bold" }}>Date/Time</Text>
            </View>
            <View style={[styles.prnCell, { width: "22%" }]}>
              <Text style={{ fontWeight: "bold" }}>Medication/Dose</Text>
            </View>
            <View style={[styles.prnCell, { width: "22%" }]}>
              <Text style={{ fontWeight: "bold" }}>Reason Given</Text>
            </View>
            <View style={[styles.prnCell, { width: "22%" }]}>
              <Text style={{ fontWeight: "bold" }}>Effectiveness</Text>
            </View>
            <View style={[styles.prnCell, { width: "22%", borderRight: "none" }]}>
              <Text style={{ fontWeight: "bold" }}>Initials</Text>
            </View>
          </View>
          {prnRows.map((row) => (
            <View key={row} style={styles.prnRow}>
              <View style={[styles.prnCell, { width: "12%" }]}>
                <Text> </Text>
              </View>
              <View style={[styles.prnCell, { width: "22%" }]}>
                <Text> </Text>
              </View>
              <View style={[styles.prnCell, { width: "22%" }]}>
                <Text> </Text>
              </View>
              <View style={[styles.prnCell, { width: "22%" }]}>
                <Text> </Text>
              </View>
              <View style={[styles.prnCell, { width: "22%", borderRight: "none" }]}>
                <Text> </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Bottom Row - Codes and Signature side by side */}
        <View style={styles.bottomRow}>
          {/* Codes */}
          <View style={styles.codesBox}>
            <Text style={[styles.codesText, { fontWeight: "bold", marginBottom: 2 }]}>CODES:</Text>
            <Text style={styles.codesText}>✓/Initials = Administered | O = Refused | H = Held</Text>
            <Text style={styles.codesText}>N/A = Not Available | D/C = Discontinued | LOA = Leave of Absence</Text>
          </View>

          {/* Signature Log */}
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>STAFF SIGNATURE LOG</Text>
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
          </View>
        </View>

        {/* Monthly Review - Compact single row */}
        <View style={styles.reviewBox}>
          <Text style={styles.reviewText}>
            <Text style={{ fontWeight: "bold" }}>MONTHLY REVIEW: </Text>
            Scheduled: _____ Given: _____ Missed: _____ Discrepancies: ____________
          </Text>
          <Text style={styles.reviewText}>Supervisor: ______________________ Date: ________</Text>
        </View>

        {/* Important Note with Footer */}
        <View style={styles.importantNote}>
          <Text style={styles.importantText}>
            IMPORTANT: Document in real-time. Never pre-sign or back-sign. Use black ink. Single line through errors with initials/date.
          </Text>
          <Text style={styles.footerText}>MAR - {data.residentName} - {data.monthYear}</Text>
        </View>
      </Page>
    </Document>
  );
}
