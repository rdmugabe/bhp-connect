/**
 * Plain, no-color .docx builder for an evacuation or disaster drill report.
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

function quarterLabel(q: string): string {
  const map: Record<string, string> = {
    Q1: "Q1 (Jan–Mar)",
    Q2: "Q2 (Apr–Jun)",
    Q3: "Q3 (Jul–Sep)",
    Q4: "Q4 (Oct–Dec)",
  };
  return map[q] || q;
}

export interface EvacuationDrillDocxData {
  id: string;
  drillType: "EVACUATION" | "DISASTER" | string;
  drillDate: string | Date;
  drillTime: string;
  dayOfWeek: string;
  totalLengthMinutes: number | null;
  shift: "AM" | "PM" | string;
  quarter: "Q1" | "Q2" | "Q3" | "Q4" | string;
  year: number;
  disasterDrillType: string | null;
  staffInvolved: { name: string }[];
  residentsInvolved: { name: string; assistanceRequired?: string }[] | null;
  exitBlocked: string | null;
  exitUsed: string | null;
  assemblyPoint: string | null;
  correctLocation: boolean | null;
  allAccountedFor: boolean | null;
  issuesIdentified: boolean | null;
  observations: string | null;
  drillResult: "SATISFACTORY" | "NEEDS_IMPROVEMENT" | "UNSATISFACTORY" | string;
  signatures: {
    conductedBy?: string;
    conductedByDate?: string;
    supervisor?: string;
    supervisorDate?: string;
  } | null;
  submittedAt: string | Date;
  facility: {
    name: string;
    address: string;
    bhp?: { user: { name: string } } | null;
  };
}

export async function buildEvacuationDrillDocx(d: EvacuationDrillDocxData): Promise<Uint8Array> {
  const children: (Paragraph | Table)[] = [];

  const typeLabel = d.drillType === "EVACUATION" ? "Evacuation Drill" : "Disaster Drill";

  children.push(docTitle(typeLabel));
  children.push(docSubtitle(`${quarterLabel(d.quarter)} ${d.year} — ${d.shift} Shift`));
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
      ["Drill Type", typeLabel],
      ["Drill Date", fmtDateLong(d.drillDate)],
      ["Day of Week", d.dayOfWeek],
      ["Shift", d.shift],
      ["Drill Time", d.drillTime],
      ["Quarter", quarterLabel(d.quarter)],
      ...(d.drillType === "DISASTER" && d.disasterDrillType
        ? ([["Disaster Type", d.disasterDrillType]] as [string, string][])
        : []),
      ["Total Length (minutes)", d.totalLengthMinutes !== null ? String(d.totalLengthMinutes) : null],
    ])
  );

  // Staff Involved
  if (d.staffInvolved && d.staffInvolved.length > 0) {
    children.push(sectionHeading(`Staff Involved (${d.staffInvolved.length})`));
    children.push(
      dataTable(
        ["#", "Staff Name"],
        d.staffInvolved.map((s, i) => [String(i + 1), s.name])
      )
    );
  }

  // Participants (evacuation only)
  if (d.drillType === "EVACUATION" && d.residentsInvolved && d.residentsInvolved.length > 0) {
    children.push(sectionHeading(`Participants (${d.residentsInvolved.length})`));
    children.push(
      dataTable(
        ["#", "Name", "Assistance Required"],
        d.residentsInvolved.map((r, i) => [String(i + 1), r.name, r.assistanceRequired || "None"])
      )
    );
  }

  // Evacuation Details
  children.push(sectionHeading("Evacuation Details"));
  children.push(
    twoColumnKVTable([
      ["Exit Blocked (Scenario)", d.exitBlocked],
      ["Exit Used", d.exitUsed],
      ["Assembly Point", d.assemblyPoint],
    ])
  );
  children.push(inlineKV("Correct Location", d.correctLocation ? "Yes" : "No"));
  children.push(inlineKV("All Accounted For", d.allAccountedFor ? "Yes" : "No"));
  children.push(inlineKV("Issues Identified", d.issuesIdentified ? "Yes" : "No"));

  // Observations
  if ((d.observations || "").trim()) {
    children.push(sectionHeading("Observations / Notes"));
    children.push(...labeledBlock("Observations", d.observations));
  }

  // Drill Result
  children.push(sectionHeading("Drill Result"));
  appendKVs(children, [["Result", formatResult(d.drillResult)]]);

  // Signatures
  const sig = d.signatures || {};
  children.push(sectionHeading("Signatures"));
  children.push(
    twoColumnKVTable([
      ["Conducted By", sig.conductedBy || ""],
      ["Conducted By Date", fmtDate(sig.conductedByDate || null)],
      ["Administrator / Supervisor", sig.supervisor || ""],
      ["Supervisor Date", fmtDate(sig.supervisorDate || null)],
    ])
  );

  const doc = new Document({
    ...defaultDocProps(`${typeLabel} - ${quarterLabel(d.quarter)} ${d.year}`),
    sections: [defaultSection(children)],
  });
  const buf = await Packer.toBuffer(doc);
  return new Uint8Array(buf);
}

export function evacuationDrillDocxFilename(
  d: Pick<EvacuationDrillDocxData, "drillType" | "quarter" | "year" | "shift">
): string {
  const label = d.drillType === "EVACUATION" ? "Evacuation" : "Disaster";
  return sanitizeFilename(`${label}Drill_${d.quarter}${d.year}_${d.shift}.docx`);
}
