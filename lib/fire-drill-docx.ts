/**
 * Plain, no-color .docx builder for a fire drill report.
 *
 * Mirrors the facility reference layout: Calibri 11pt black-on-white with
 * light-gray section borders, uppercase section headings, and a two-column
 * KV table for short fields.
 */

import { Document, Packer, Paragraph, Table } from "docx";
import {
  appendKVs,
  dataTable,
  defaultDocProps,
  defaultSection,
  docSubtitle,
  docTitle,
  fmtDate,
  fmtDateLong,
  inlineKV,
  labeledBlock,
  run,
  sanitizeFilename,
  sectionHeading,
  twoColumnKVTable,
} from "./plain-docx-utils";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatResult(result: string): string {
  switch (result) {
    case "SATISFACTORY":
      return "Satisfactory";
    case "NEEDS_IMPROVEMENT":
      return "Needs Improvement";
    case "UNSATISFACTORY":
      return "Unsatisfactory";
    default:
      return result;
  }
}

export interface FireDrillDocxData {
  id: string;
  reportMonth: number;
  reportYear: number;
  drillDate: string | Date;
  drillTime: string;
  location: string | null;
  shift: "AM" | "PM" | string;
  drillType: "ANNOUNCED" | "UNANNOUNCED" | string;
  conductedBy: string;
  alarmActivatedTime: string | null;
  buildingClearTime: string | null;
  totalEvacuationTime: string | null;
  numberEvacuated: number | null;
  safetyChecklist: {
    fireAlarmFunctioned?: boolean;
    allResidentsAccountedFor?: boolean;
    staffFollowedProcedures?: boolean;
    exitRoutesClear?: boolean;
    emergencyExitsOpenedProperly?: boolean;
    fireExtinguishersAccessible?: boolean;
  } | null;
  residentsPresent: { name: string; evacuated: boolean }[] | null;
  observations: string | null;
  correctiveActions: string | null;
  drillResult: "SATISFACTORY" | "NEEDS_IMPROVEMENT" | "UNSATISFACTORY" | string;
  signatures: {
    staffSignature?: string;
    staffSignatureDate?: string;
    supervisorSignature?: string;
    supervisorSignatureDate?: string;
  } | null;
  submittedAt: string | Date;
  facility: {
    name: string;
    address: string;
    bhp?: { user: { name: string } } | null;
  };
}

export async function buildFireDrillDocx(d: FireDrillDocxData): Promise<Uint8Array> {
  const children: (Paragraph | Table)[] = [];

  // Header
  children.push(docTitle("Monthly Fire Drill Report"));
  const periodLabel = `${MONTHS[d.reportMonth - 1]} ${d.reportYear} — ${d.shift} Shift`;
  children.push(docSubtitle(periodLabel));
  children.push(docSubtitle(d.facility.name));
  if (d.facility.bhp?.user?.name) {
    children.push(
      new Paragraph({
        spacing: { after: 160 },
        children: [run(`Managed by: ${d.facility.bhp.user.name}`, { italics: true, size: 20 })],
      })
    );
  }

  // Drill Information
  children.push(sectionHeading("Drill Information"));
  children.push(
    twoColumnKVTable([
      ["Drill Date", fmtDateLong(d.drillDate)],
      ["Shift", d.shift],
      ["Drill Time", d.drillTime],
      ["Drill Type", d.drillType],
      ["Location", d.location],
      ["Conducted By", d.conductedBy],
    ])
  );

  // Evacuation Times
  children.push(sectionHeading("Evacuation Times"));
  children.push(
    twoColumnKVTable([
      ["Alarm Activated", d.alarmActivatedTime],
      ["Building Clear", d.buildingClearTime],
      ["Total Evacuation Time", d.totalEvacuationTime],
      ["Number Evacuated", d.numberEvacuated !== null ? String(d.numberEvacuated) : null],
    ])
  );

  // Safety Checklist
  const checklist = d.safetyChecklist || {};
  const checklistItems: [string, boolean | undefined][] = [
    ["Fire alarm functioned properly", checklist.fireAlarmFunctioned],
    ["All residents accounted for", checklist.allResidentsAccountedFor],
    ["Staff followed evacuation procedures", checklist.staffFollowedProcedures],
    ["Exit routes clear and accessible", checklist.exitRoutesClear],
    ["Emergency exits opened properly", checklist.emergencyExitsOpenedProperly],
    ["Fire extinguishers accessible", checklist.fireExtinguishersAccessible],
  ];
  children.push(sectionHeading("Safety Checklist"));
  for (const [label, checked] of checklistItems) {
    children.push(inlineKV(label, checked ? "Yes" : "No"));
  }

  // Participants
  if (d.residentsPresent && d.residentsPresent.length > 0) {
    children.push(sectionHeading("Participants"));
    children.push(
      dataTable(
        ["Name", "Successfully Evacuated"],
        d.residentsPresent.map((r) => [r.name, r.evacuated ? "Yes" : "No"])
      )
    );
  }

  // Observations
  if ((d.observations || "").trim()) {
    children.push(sectionHeading("Observations"));
    children.push(...labeledBlock("Observations", d.observations));
  }

  // Corrective Actions
  if ((d.correctiveActions || "").trim()) {
    children.push(sectionHeading("Corrective Actions Needed"));
    children.push(...labeledBlock("Corrective Actions", d.correctiveActions));
  }

  // Drill Result
  children.push(sectionHeading("Drill Result"));
  appendKVs(children, [["Result", formatResult(d.drillResult)]]);

  // Signatures
  const sig = d.signatures || {};
  children.push(sectionHeading("Signatures"));
  children.push(
    twoColumnKVTable([
      ["Staff Member", sig.staffSignature || ""],
      ["Staff Date", fmtDate(sig.staffSignatureDate || null)],
      ["Supervisor", sig.supervisorSignature || ""],
      ["Supervisor Date", fmtDate(sig.supervisorSignatureDate || null)],
    ])
  );

  const doc = new Document({
    ...defaultDocProps(`Fire Drill Report - ${periodLabel}`),
    sections: [defaultSection(children)],
  });
  const buf = await Packer.toBuffer(doc);
  return new Uint8Array(buf);
}

export function fireDrillDocxFilename(
  d: Pick<FireDrillDocxData, "reportMonth" | "reportYear" | "shift">
): string {
  const monthName = MONTHS[d.reportMonth - 1];
  return sanitizeFilename(`FireDrill_${monthName}${d.reportYear}_${d.shift}.docx`);
}
