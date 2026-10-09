/**
 * Plain, no-color .docx builder for individual progress notes.
 *
 * Produces a basic Word document (Calibri 11pt, black on white, light
 * gray section borders) with the resident identity block, note metadata,
 * section headings, and signature. Intended for batch export of saved
 * progress notes.
 */

import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

const FONT = "Calibri";
const RUN_SIZE = 22; // 11pt

const BORDER = {
  top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
  left: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
  right: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
};

const USABLE_WIDTH_DXA = 12240 - 1440 * 2; // Letter minus 1" margins

function run(text: string, opts: { bold?: boolean; italics?: boolean; size?: number } = {}): TextRun {
  return new TextRun({ text, bold: opts.bold, italics: opts.italics, size: opts.size ?? RUN_SIZE, font: FONT });
}

function heading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 60 },
    children: [run(text, { bold: true, size: 24 })],
  });
}

function body(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 80 },
    children: [run(text || "N/A")],
  });
}

/** Bold inline label followed by the value on the same line. Used for short
 *  sections where a two-line heading + body wastes space. */
function inlineSection(label: string, value: string): Paragraph {
  return new Paragraph({
    spacing: { before: 160, after: 80 },
    children: [
      run(`${label}: `, { bold: true, size: 24 }),
      run(value || ""),
    ],
  });
}

function kvRow(label: string, value: string, labelW: number, valueW: number): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        borders: BORDER,
        width: { size: labelW, type: WidthType.DXA },
        children: [new Paragraph({ children: [run(label, { bold: true })] })],
      }),
      new TableCell({
        borders: BORDER,
        width: { size: valueW, type: WidthType.DXA },
        children: [new Paragraph({ children: [run(value || "")] })],
      }),
    ],
  });
}

export interface ProgressNoteDocxData {
  // Identity
  residentName: string;
  dateOfBirth?: Date | null;
  ahcccsId?: string | null;
  facilityName?: string | null;

  // Metadata
  noteDate: Date;
  shift?: string | null;
  authorName: string;
  authorTitle?: string | null;
  status: string;

  // Content
  residentStatus?: string | null;
  observedBehaviors?: string | null;
  moodAffect?: string | null;
  activityParticipation?: string | null;
  staffInteractions?: string | null;
  peerInteractions?: string | null;
  medicationCompliance?: string | null;
  hygieneAdl?: string | null;
  mealsAppetite?: string | null;
  sleepPattern?: string | null;
  staffInterventions?: string | null;
  residentResponse?: string | null;
  notableEvents?: string | null;
  additionalNotes?: string | null;

  // Signature
  bhtSignature?: string | null;
  bhtCredentials?: string | null;
  bhtSignatureDate?: Date | null;
  bhtSignatureImage?: {
    buffer: Buffer | Uint8Array;
    type: "png" | "jpg";
  } | null;
}

function fmtDate(d: Date | null | undefined, withTime = false): string {
  if (!d) return "";
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const base = `${mm}/${dd}/${yyyy}`;
  if (!withTime) return base;
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  return `${base} ${hh}:${mi}`;
}

function sanitizeFilename(s: string): string {
  return s.replace(/[\\/:*?"<>|]+/g, "-").trim().slice(0, 120);
}

export async function buildProgressNoteDocx(d: ProgressNoteDocxData): Promise<Uint8Array> {
  const identity = new Table({
    width: { size: USABLE_WIDTH_DXA, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: [
          new TableCell({ borders: BORDER, width: { size: Math.round(USABLE_WIDTH_DXA / 2), type: WidthType.DXA }, children: [new Paragraph({ children: [run("Resident: ", { bold: true }), run(d.residentName)] })] }),
          new TableCell({ borders: BORDER, width: { size: Math.round(USABLE_WIDTH_DXA / 2), type: WidthType.DXA }, children: [new Paragraph({ children: [run("DOB: ", { bold: true }), run(fmtDate(d.dateOfBirth ?? null))] })] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ borders: BORDER, children: [new Paragraph({ children: [run("Facility: ", { bold: true }), run(d.facilityName || "")] })] }),
          new TableCell({ borders: BORDER, children: [new Paragraph({ children: [run("AHCCCS ID: ", { bold: true }), run(d.ahcccsId || "")] })] }),
        ],
      }),
    ],
  });

  const half = Math.round(USABLE_WIDTH_DXA / 2);
  const meta = new Table({
    width: { size: USABLE_WIDTH_DXA, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: [
          new TableCell({ borders: BORDER, width: { size: half, type: WidthType.DXA }, children: [new Paragraph({ children: [run("Note Date: ", { bold: true }), run(fmtDate(d.noteDate))] })] }),
          new TableCell({ borders: BORDER, width: { size: half, type: WidthType.DXA }, children: [new Paragraph({ children: [run("Shift: ", { bold: true }), run(d.shift || "")] })] }),
        ],
      }),
    ],
  });

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [run("Daily Progress Note", { bold: true, size: 28 })],
    }),
    identity,
    new Paragraph({ children: [run("")] }),
    meta,
    heading("Status"),
    body(d.residentStatus || ""),
    heading("Behavior & Observations"),
    body(d.observedBehaviors || ""),
    inlineSection("Mood / Affect", d.moodAffect || ""),
    heading("Programming"),
    body(d.activityParticipation || ""),
    heading("Staff Interactions"),
    body(d.staffInteractions || ""),
    heading("Peer Interactions"),
    body(d.peerInteractions || ""),
  ];

  // Medication Compliance is inline and only shown when there's a value to
  // print (residents with no active meds skip the line entirely).
  if ((d.medicationCompliance || "").trim()) {
    children.push(inlineSection("Medication Compliance", d.medicationCompliance || ""));
  }

  children.push(
    heading("ADLs & Hygiene"),
    body(d.hygieneAdl || ""),
    heading("Meals & Appetite"),
    body(d.mealsAppetite || ""),
    heading("Sleep"),
    body(d.sleepPattern || ""),
    heading("Interventions Provided"),
    body(d.staffInterventions || ""),
    heading("Resident Response"),
    body(d.residentResponse || ""),
    // Notable Events is almost always short ("None.") — keep label and value
    // on one line so the signature block fits on page 1.
    new Paragraph({
      spacing: { before: 160, after: 80 },
      children: [
        run("Notable Events: ", { bold: true, size: 24 }),
        run(d.notableEvents || "None."),
      ],
    }),
  );

  if ((d.additionalNotes || "").trim()) {
    children.push(heading("Additional Notes"));
    children.push(body(d.additionalNotes || ""));
  }

  // Signature line (tight spacing so it fits on page 1). When a signature
  // image is provided, drop it in above the printed-name line; otherwise
  // keep the plain underscore line as a hand-sign placeholder.
  if (d.bhtSignatureImage) {
    children.push(
      new Paragraph({
        spacing: { before: 240 },
        children: [
          new ImageRun({
            data: d.bhtSignatureImage.buffer,
            transformation: { width: 180, height: 60 },
            type: d.bhtSignatureImage.type,
          }),
        ],
      })
    );
  } else {
    children.push(
      new Paragraph({ spacing: { before: 240 }, children: [run("________________________________________")] })
    );
  }
  children.push(
    new Paragraph({
      children: [
        run(`${d.bhtSignature || d.authorName}${d.bhtCredentials ? ", " + d.bhtCredentials : d.authorTitle ? ", " + d.authorTitle : ""}`, { bold: true }),
      ],
    })
  );
  children.push(
    new Paragraph({ children: [run(`Signed: ${fmtDate(d.bhtSignatureDate ?? null, true)}`, { italics: true })] })
  );

  const doc = new Document({
    creator: "BHP Connect",
    title: `Progress Note - ${d.residentName} - ${fmtDate(d.noteDate)}`,
    styles: {
      default: {
        document: {
          run: { font: FONT, size: RUN_SIZE },
        },
      },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
        },
        children,
      },
    ],
  });

  const buf = await Packer.toBuffer(doc);
  return new Uint8Array(buf);
}

export function progressNoteDocxFilename(d: Pick<ProgressNoteDocxData, "residentName" | "noteDate" | "shift">): string {
  const yyyy = d.noteDate.getUTCFullYear();
  const mm = String(d.noteDate.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.noteDate.getUTCDate()).padStart(2, "0");
  return sanitizeFilename(`${d.residentName}_${yyyy}-${mm}-${dd}_${d.shift || "SHIFT"}.docx`);
}
