import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { format } from "date-fns";

const styles = StyleSheet.create({
  page: {
    padding: 15,
    fontFamily: "Helvetica",
    fontSize: 7,
  },
  title: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
    color: "#1a365d",
  },
  subtitle: {
    fontSize: 9,
    textAlign: "center",
    marginBottom: 8,
    color: "#4a5568",
  },
  headerSection: {
    marginBottom: 6,
    padding: 6,
    backgroundColor: "#f7fafc",
    border: "1 solid #e2e8f0",
  },
  headerRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  headerLabel: {
    fontWeight: "bold",
    width: 50,
    fontSize: 7,
  },
  headerValue: {
    flex: 1,
    fontSize: 7,
  },
  allergyWarning: {
    backgroundColor: "#fed7d7",
    padding: 3,
    marginTop: 3,
    border: "1 solid #fc8181",
  },
  allergyText: {
    color: "#c53030",
    fontWeight: "bold",
    fontSize: 7,
  },
  legend: {
    flexDirection: "row",
    marginBottom: 6,
    padding: 4,
    backgroundColor: "#edf2f7",
    border: "1 solid #e2e8f0",
    flexWrap: "wrap",
    gap: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  legendBadge: {
    width: 14,
    height: 10,
    marginRight: 3,
    textAlign: "center",
    fontSize: 6,
    fontWeight: "bold",
    paddingTop: 1,
  },
  legendText: {
    fontSize: 6,
  },
  table: {
    marginBottom: 6,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#2d3748",
    color: "#fff",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "0.5 solid #e2e8f0",
    minHeight: 14,
  },
  tableRowAlt: {
    backgroundColor: "#f7fafc",
  },
  medicationCell: {
    width: "18%",
    padding: 2,
    borderRight: "0.5 solid #e2e8f0",
    fontSize: 6,
  },
  doseCell: {
    width: "8%",
    padding: 2,
    borderRight: "0.5 solid #e2e8f0",
    fontSize: 6,
    textAlign: "center",
  },
  routeCell: {
    width: "6%",
    padding: 2,
    borderRight: "0.5 solid #e2e8f0",
    fontSize: 6,
    textAlign: "center",
  },
  timeCell: {
    width: "6%",
    padding: 2,
    borderRight: "0.5 solid #e2e8f0",
    fontSize: 6,
    textAlign: "center",
  },
  dayCell: {
    width: "2%",
    padding: 1,
    borderRight: "0.5 solid #e2e8f0",
    fontSize: 5,
    textAlign: "center",
  },
  dayHeaderCell: {
    width: "2%",
    padding: 2,
    borderRight: "0.5 solid #e2e8f0",
    fontSize: 5,
    textAlign: "center",
    color: "#fff",
    fontWeight: "bold",
  },
  headerCell: {
    padding: 2,
    fontSize: 6,
    fontWeight: "bold",
    color: "#fff",
  },
  statusGiven: {
    backgroundColor: "#c6f6d5",
    color: "#22543d",
  },
  statusRefused: {
    backgroundColor: "#fed7d7",
    color: "#742a2a",
  },
  statusHeld: {
    backgroundColor: "#feebc8",
    color: "#744210",
  },
  statusMissed: {
    backgroundColor: "#feb2b2",
    color: "#742a2a",
  },
  statusNA: {
    backgroundColor: "#e2e8f0",
    color: "#4a5568",
  },
  prnBadge: {
    backgroundColor: "#e9d8fd",
    color: "#553c9a",
    padding: "1 3",
    fontSize: 5,
    marginLeft: 3,
  },
  controlledBadge: {
    backgroundColor: "#fed7d7",
    color: "#c53030",
    padding: "1 3",
    fontSize: 5,
    marginLeft: 3,
  },
  summarySection: {
    marginTop: 6,
    padding: 5,
    backgroundColor: "#f7fafc",
    border: "1 solid #e2e8f0",
  },
  summaryTitle: {
    fontSize: 8,
    fontWeight: "bold",
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  summaryLabel: {
    width: 90,
    fontSize: 6,
    fontWeight: "bold",
  },
  summaryValue: {
    flex: 1,
    fontSize: 6,
  },
  footer: {
    position: "absolute",
    bottom: 10,
    left: 15,
    right: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 6,
    color: "#718096",
    borderTop: "1 solid #e2e8f0",
    paddingTop: 5,
  },
  signatureSection: {
    marginTop: 8,
    paddingTop: 5,
    borderTop: "1 solid #e2e8f0",
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  signatureLine: {
    width: "45%",
    borderTop: "1 solid #000",
    paddingTop: 2,
    fontSize: 6,
    textAlign: "center",
  },
  providerSection: {
    flexDirection: "row",
    marginBottom: 6,
    gap: 10,
  },
  providerBox: {
    flex: 1,
    padding: 5,
    backgroundColor: "#f7fafc",
    border: "1 solid #e2e8f0",
  },
  providerTitle: {
    fontSize: 7,
    fontWeight: "bold",
    marginBottom: 3,
    color: "#2d3748",
  },
  providerItem: {
    marginBottom: 2,
  },
  providerName: {
    fontSize: 6,
    fontWeight: "bold",
  },
  providerDetail: {
    fontSize: 6,
    color: "#718096",
  },
  initialsLegend: {
    marginTop: 5,
    padding: 5,
    backgroundColor: "#f7fafc",
    border: "1 solid #e2e8f0",
  },
  initialsLegendTitle: {
    fontSize: 7,
    fontWeight: "bold",
    marginBottom: 3,
    color: "#2d3748",
  },
  initialsLegendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  initialsLegendItem: {
    flexDirection: "row",
    marginRight: 10,
    marginBottom: 2,
  },
  initialsLegendInitials: {
    fontSize: 6,
    fontWeight: "bold",
    width: 20,
  },
  initialsLegendName: {
    fontSize: 6,
  },
});

interface MedicationData {
  id: string;
  medicationName: string;
  strength: string;
  dose: string;
  route: string;
  frequency: string;
  isPRN: boolean;
  isControlled: boolean;
  scheduleTimes: string[];
  dailyAdministrations: Record<string, {
    status: string;
    time?: string;
    by?: string;
  }[]>;
}

interface PrescriberInfo {
  name: string;
  npi?: string;
  phone?: string;
}

interface PharmacyInfo {
  name: string;
  phone?: string;
}

interface EmarReportData {
  patient: {
    residentName: string;
    dateOfBirth: string;
    allergies: string | null;
  };
  facility: {
    name: string;
  };
  prescribers?: PrescriberInfo[];
  pharmacies?: PharmacyInfo[];
  medications: MedicationData[];
  dateRange: {
    start: string;
    end: string;
  };
  summary: {
    totalScheduled: number;
    given: number;
    refused: number;
    held: number;
    missed: number;
    notAvailable: number;
    completionRate: number;
  };
  generatedAt: string;
  generatedBy: string;
}

const ROUTE_LABELS: Record<string, string> = {
  PO: "PO",
  SL: "SL",
  IM: "IM",
  IV: "IV",
  SC: "SC",
  TOPICAL: "TOP",
  INHALED: "INH",
  OPHTHALMIC: "OPH",
  OTIC: "OT",
  NASAL: "NAS",
  RECTAL: "REC",
  TRANSDERMAL: "TD",
  OTHER: "OTH",
};

function getStatusAbbrev(status: string): string {
  switch (status) {
    case "GIVEN": return "G";
    case "REFUSED": return "R";
    case "HELD": return "H";
    case "MISSED": return "M";
    case "NOT_AVAILABLE": return "NA";
    case "LOA": return "LOA";
    default: return "-";
  }
}

function getStatusStyle(status: string) {
  switch (status) {
    case "GIVEN": return styles.statusGiven;
    case "REFUSED": return styles.statusRefused;
    case "HELD": return styles.statusHeld;
    case "MISSED": return styles.statusMissed;
    case "NOT_AVAILABLE":
    case "LOA": return styles.statusNA;
    default: return {};
  }
}

function getInitials(name: string | undefined): string {
  if (!name) return "";
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);
}

function getDaysInRange(start: string, end: string): Date[] {
  const days: Date[] = [];
  // Add T12:00:00 to parse as noon local time, avoiding timezone issues
  const startDate = new Date(start + "T12:00:00");
  const endDate = new Date(end + "T12:00:00");
  const current = new Date(startDate);

  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

export function EmarReportTemplate({ data }: { data: EmarReportData }) {
  const days = getDaysInRange(data.dateRange.start, data.dateRange.end);

  return (
    <Document>
      <Page size="LETTER" orientation="landscape" style={styles.page}>
        {/* Title */}
        <Text style={styles.title}>MEDICATION ADMINISTRATION RECORD (eMAR)</Text>
        <Text style={styles.subtitle}>
          {format(new Date(data.dateRange.start + "T12:00:00"), "MMMM yyyy")}
        </Text>

        {/* Header Information */}
        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Facility:</Text>
            <Text style={styles.headerValue}>{data.facility.name}</Text>
            <Text style={styles.headerLabel}>Patient:</Text>
            <Text style={styles.headerValue}>{data.patient.residentName}</Text>
            <Text style={styles.headerLabel}>DOB:</Text>
            <Text style={styles.headerValue}>
              {format(new Date(data.patient.dateOfBirth.split("T")[0] + "T12:00:00"), "MM/dd/yyyy")}
            </Text>
          </View>
          {data.patient.allergies && (
            <View style={styles.allergyWarning}>
              <Text style={styles.allergyText}>
                ⚠ ALLERGIES: {data.patient.allergies}
              </Text>
            </View>
          )}
        </View>

        {/* Prescriber and Pharmacy Information */}
        {((data.prescribers && data.prescribers.length > 0) || (data.pharmacies && data.pharmacies.length > 0)) && (
          <View style={styles.providerSection}>
            {data.prescribers && data.prescribers.length > 0 && (
              <View style={styles.providerBox}>
                <Text style={styles.providerTitle}>
                  Prescriber{data.prescribers.length > 1 ? "s" : ""}
                </Text>
                {data.prescribers.map((prescriber, idx) => (
                  <View key={idx} style={styles.providerItem}>
                    <Text style={styles.providerName}>{prescriber.name}</Text>
                    {prescriber.npi && (
                      <Text style={styles.providerDetail}>NPI: {prescriber.npi}</Text>
                    )}
                    {prescriber.phone && (
                      <Text style={styles.providerDetail}>Phone: {prescriber.phone}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
            {data.pharmacies && data.pharmacies.length > 0 && (
              <View style={styles.providerBox}>
                <Text style={styles.providerTitle}>
                  Pharmac{data.pharmacies.length > 1 ? "ies" : "y"}
                </Text>
                {data.pharmacies.map((pharmacy, idx) => (
                  <View key={idx} style={styles.providerItem}>
                    <Text style={styles.providerName}>{pharmacy.name}</Text>
                    {pharmacy.phone && (
                      <Text style={styles.providerDetail}>Phone: {pharmacy.phone}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBadge, styles.statusGiven]}>
              <Text>G</Text>
            </View>
            <Text style={styles.legendText}>Given</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBadge, styles.statusRefused]}>
              <Text>R</Text>
            </View>
            <Text style={styles.legendText}>Refused</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBadge, styles.statusHeld]}>
              <Text>H</Text>
            </View>
            <Text style={styles.legendText}>Held</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBadge, styles.statusMissed]}>
              <Text>M</Text>
            </View>
            <Text style={styles.legendText}>Missed</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBadge, styles.statusNA]}>
              <Text>NA</Text>
            </View>
            <Text style={styles.legendText}>Not Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBadge, styles.statusNA]}>
              <Text>LOA</Text>
            </View>
            <Text style={styles.legendText}>Leave of Absence</Text>
          </View>
        </View>

        {/* Medication Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={[styles.medicationCell, styles.headerCell]}>
              <Text>Medication</Text>
            </View>
            <View style={[styles.doseCell, styles.headerCell]}>
              <Text>Dose</Text>
            </View>
            <View style={[styles.routeCell, styles.headerCell]}>
              <Text>Route</Text>
            </View>
            <View style={[styles.timeCell, styles.headerCell]}>
              <Text>Time</Text>
            </View>
            {days.map((day) => (
              <View key={day.toISOString()} style={styles.dayHeaderCell}>
                <Text>{format(day, "d")}</Text>
              </View>
            ))}
          </View>

          {/* Medication Rows */}
          {data.medications.map((med, medIndex) => (
            med.scheduleTimes.map((time, timeIdx) => (
              <View
                key={`${med.id}-${time}`}
                style={[
                  styles.tableRow,
                  medIndex % 2 === 1 ? styles.tableRowAlt : {},
                ]}
              >
                {timeIdx === 0 && (
                  <View style={[styles.medicationCell, { height: med.scheduleTimes.length * 14 }]}>
                    <Text style={{ fontWeight: "bold" }}>
                      {med.medicationName}
                      {med.isPRN && (
                        <Text style={styles.prnBadge}> PRN</Text>
                      )}
                      {med.isControlled && (
                        <Text style={styles.controlledBadge}> C</Text>
                      )}
                    </Text>
                    <Text>{med.strength}</Text>
                  </View>
                )}
                {timeIdx !== 0 && (
                  <View style={styles.medicationCell} />
                )}
                <View style={styles.doseCell}>
                  <Text>{med.dose}</Text>
                </View>
                <View style={styles.routeCell}>
                  <Text>{ROUTE_LABELS[med.route] || med.route}</Text>
                </View>
                <View style={styles.timeCell}>
                  <Text>{time}</Text>
                </View>
                {days.map((day) => {
                  const dateKey = format(day, "yyyy-MM-dd");
                  const admins = med.dailyAdministrations[dateKey] || [];

                  // Find matching administration
                  let admin;
                  const schedHour = parseInt(time.split(":")[0]);

                  if (med.isPRN || isNaN(schedHour) || time === "PRN" || time === "--") {
                    // For PRN meds or invalid schedule times, just show first admin of the day
                    admin = admins[0];
                  } else {
                    // For scheduled meds, try to match by hour
                    admin = admins.find(a => {
                      if (!a.time) return false;
                      const adminHour = parseInt(a.time.split(":")[0]);
                      return Math.abs(adminHour - schedHour) <= 1;
                    });
                    // If no match by hour, fall back to first admin (for meds with empty scheduleTimes)
                    if (!admin && admins.length > 0 && med.scheduleTimes.length <= 1) {
                      admin = admins[0];
                    }
                  }

                  return (
                    <View
                      key={dateKey}
                      style={[
                        styles.dayCell,
                        admin ? getStatusStyle(admin.status) : {},
                      ]}
                    >
                      <Text>{admin ? getStatusAbbrev(admin.status) : "-"}</Text>
                      {admin && admin.by && (
                        <Text style={{ fontSize: 4, marginTop: 1 }}>
                          {getInitials(admin.by)}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            ))
          ))}
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Monthly Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Scheduled:</Text>
            <Text style={styles.summaryValue}>{data.summary.totalScheduled}</Text>
            <Text style={styles.summaryLabel}>Given:</Text>
            <Text style={styles.summaryValue}>{data.summary.given}</Text>
            <Text style={styles.summaryLabel}>Completion Rate:</Text>
            <Text style={styles.summaryValue}>{data.summary.completionRate}%</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Refused:</Text>
            <Text style={styles.summaryValue}>{data.summary.refused}</Text>
            <Text style={styles.summaryLabel}>Held:</Text>
            <Text style={styles.summaryValue}>{data.summary.held}</Text>
            <Text style={styles.summaryLabel}>Missed:</Text>
            <Text style={styles.summaryValue}>{data.summary.missed}</Text>
          </View>
        </View>

        {/* Staff Initials Legend */}
        {(() => {
          // Collect all unique administrators from medication data
          const staffMap = new Map<string, string>();
          data.medications.forEach(med => {
            Object.values(med.dailyAdministrations).forEach(admins => {
              admins.forEach(admin => {
                if (admin.by) {
                  const initials = getInitials(admin.by);
                  if (!staffMap.has(initials)) {
                    staffMap.set(initials, admin.by);
                  }
                }
              });
            });
          });

          const staffList = Array.from(staffMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

          if (staffList.length === 0) return null;

          return (
            <View style={styles.initialsLegend}>
              <Text style={styles.initialsLegendTitle}>Staff Signatures</Text>
              {staffList.map(([initials, name]) => (
                <View key={initials} style={{ flexDirection: "row", alignItems: "flex-end", marginBottom: 8 }}>
                  <View style={{ width: 80, borderBottom: "1 solid #000", marginRight: 8, height: 12 }} />
                  <Text style={{ fontSize: 6, width: 25 }}>{initials}:</Text>
                  <Text style={{ fontSize: 6 }}>{name}</Text>
                </View>
              ))}
            </View>
          );
        })()}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated: {data.generatedAt}</Text>
          <Text>Generated by: {data.generatedBy}</Text>
          <Text>
            eMAR Report - {data.patient.residentName} - {format(new Date(data.dateRange.start + "T12:00:00"), "MMMM yyyy")}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
