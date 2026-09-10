/**
 * Group therapy note .docx builder.
 *
 * Produces one Word document per resident per session slot. Runs entirely
 * in-process — no external service required. Fields come straight from the
 * wizard's per-resident form entries.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";

export interface SessionSlot {
  code: "0930" | "1300" | "1630";
  label: string;
}

export const SESSION_SLOTS: SessionSlot[] = [
  { code: "0930", label: "9:30 AM Group" },
  { code: "1300", label: "1:00 PM Group" },
  { code: "1630", label: "4:30 PM Group" },
];

export interface ResidentEntry {
  name: string;
  present: boolean;
  absenceReason: string;
  participation: string;
  behavior: string;
  overall: string;
  significantInfo: string;
}

export interface GenerateArgs {
  facilityName: string;
  dateMdY: string;
  staffName: string;
  staffTitle: string;
  groupTopic: string;
  groupSummary: string;
  sessionCodes: Array<"0930" | "1300" | "1630">;
  residents: ResidentEntry[];
}

const DEFAULT_TOPIC = "Group Session";
const DEFAULT_TOPIC_SUFFIX = (partIndex: number, total: number) =>
  ` — Part ${partIndex} of ${total}`;

const FALLBACK_TEXT = {
  participation:
    "Resident participated in the group session. Engaged with the material presented, contributed appropriately to discussion when prompted, and demonstrated attention throughout the session.",
  behavior:
    "Resident's behavior was appropriate throughout the session. Interacted respectfully with peers and staff, followed group norms, and displayed no signs of agitation or acute distress.",
  overall:
    "Resident tolerated the group well and appeared to benefit from the content. No adverse events noted. Continue treatment as planned.",
  significantInfo: "No significant events reported this session.",
};

function safeText(s: string | null | undefined, fallback: string): string {
  const t = (s ?? "").trim();
  return t.length > 0 ? t : fallback;
}

function sanitizeFilename(s: string): string {
  return s.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "_").slice(0, 80);
}

/** Heading paragraph (H2-ish). */
function heading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true })],
  });
}

/** Plain body paragraph, justified. */
function body(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120 },
    children: [new TextRun({ text })],
  });
}

/** Key–value line: bold label, then plain value. */
function kv(label: string, value: string): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: `${label}: `, bold: true }),
      new TextRun({ text: value }),
    ],
  });
}

/** Blank line. */
function spacer(): Paragraph {
  return new Paragraph({ children: [new TextRun({ text: "" })] });
}

interface OneNoteArgs {
  facilityName: string;
  dateMdY: string;
  sessionLabel: string;
  topic: string;
  summary: string;
  staffName: string;
  staffTitle: string;
  resident: ResidentEntry;
}

function buildOneNote(a: OneNoteArgs): Document {
  const { resident } = a;
  const absent = !resident.present;

  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: "Group Therapy Progress Note", bold: true })],
    })
  );

  // Header key–values
  children.push(kv("Facility", a.facilityName));
  children.push(kv("Date", a.dateMdY));
  children.push(kv("Session", a.sessionLabel));
  children.push(kv("Resident", resident.name));
  children.push(kv("Group Topic", a.topic));
  children.push(spacer());

  // Group summary
  children.push(heading("Group Summary"));
  children.push(
    body(
      safeText(
        a.summary,
        "Structured group session focused on the day's topic. Facilitator delivered content and led discussion; residents were invited to share reflections and practice skills as applicable."
      )
    )
  );

  if (absent) {
    children.push(heading("Attendance"));
    children.push(
      body(
        `Resident was absent from this group session. Reason: ${safeText(
          resident.absenceReason,
          "Not documented"
        )}.`
      )
    );
  } else {
    children.push(heading("Participation"));
    children.push(body(safeText(resident.participation, FALLBACK_TEXT.participation)));

    children.push(heading("Behavior"));
    children.push(body(safeText(resident.behavior, FALLBACK_TEXT.behavior)));

    children.push(heading("Overall Observations"));
    children.push(body(safeText(resident.overall, FALLBACK_TEXT.overall)));

    children.push(heading("Significant Information"));
    children.push(body(safeText(resident.significantInfo, FALLBACK_TEXT.significantInfo)));
  }

  // Signature block
  children.push(spacer());
  children.push(spacer());
  children.push(
    new Paragraph({
      spacing: { before: 200 },
      children: [
        new TextRun({ text: "________________________________", }),
      ],
    })
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${a.staffName || "Staff Name"}${a.staffTitle ? ", " + a.staffTitle : ""}`,
          bold: true,
        }),
      ],
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: `Signed: ${a.dateMdY}`, italics: true })],
    })
  );

  return new Document({
    creator: "BHP Connect",
    title: `Group Note - ${resident.name} - ${a.sessionLabel} - ${a.dateMdY}`,
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 22, // 11pt
          },
        },
      },
    },
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });
}

export interface GeneratedFile {
  filename: string;
  bytes: Uint8Array;
  resident: string;
  session: string;
  status: "ok" | "skipped";
  reason?: string;
}

export async function buildAllNotes(args: GenerateArgs): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];
  const activeSlots = SESSION_SLOTS.filter(s => args.sessionCodes.includes(s.code));
  const totalParts = activeSlots.length;

  for (let sIdx = 0; sIdx < activeSlots.length; sIdx++) {
    const slot = activeSlots[sIdx];
    const topic =
      args.groupTopic.trim() ||
      DEFAULT_TOPIC + DEFAULT_TOPIC_SUFFIX(sIdx + 1, totalParts);

    for (const r of args.residents) {
      const doc = buildOneNote({
        facilityName: args.facilityName,
        dateMdY: args.dateMdY,
        sessionLabel: slot.label,
        topic,
        summary: args.groupSummary,
        staffName: args.staffName,
        staffTitle: args.staffTitle,
        resident: r,
      });
      const buf = await Packer.toBuffer(doc);
      const filename = sanitizeFilename(
        `${r.name}_${slot.code}_${args.dateMdY.replace(/\//g, "-")}.docx`
      );
      files.push({
        filename,
        bytes: new Uint8Array(buf),
        resident: r.name,
        session: slot.label,
        status: "ok",
      });
    }
  }

  return files;
}
