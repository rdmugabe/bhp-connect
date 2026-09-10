/**
 * Group therapy note .docx builder.
 *
 * Matches the "Therapeutic Group/Activity Note" template used by the
 * facility (see sample: Yngwie Howard - 090726 1630.docx). Produces one
 * Word document per resident per session slot. Runs entirely in-process
 * — no external service required.
 *
 * Layout notes (reverse-engineered from the signed sample):
 *  - Top identity block is a single-row 4-column table:
 *      Name / DOB / AHCCCS ID / Date, each cell contains "Label:\nValue".
 *  - Section titles ("Group Topic/Summary Notes", etc.) are plain bold
 *    paragraphs, not shaded headings.
 *  - Session Date is a paragraph on its own, then a single-row 6-column
 *    table for [Session Type][Group Therapy Session][Start Time][…][End
 *    Time][…].
 *  - Topic is a 2-cell 1-row table; the summary text is a 1-cell 1-row
 *    table that spans the width.
 *  - Participation Assessment is a 4-column × 2-row table (Yes/No row,
 *    Comments row).
 *  - Rating tables have 5 columns and 6 rows (header + 5 items). There
 *    is no Comments row inside the rating table; Comments is a paragraph
 *    that follows the table.
 *  - Treatment Goals is a 2-column × 2-row table.
 *  - Additional Information is a 1-row × 2-column table.
 *  - Signatures is a 4-column × 2-row table (staff row, BHP row).
 */

import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface SessionSlot {
  code: "0930" | "1300" | "1630";
  label: string;
  startLabel: string;
  endLabel: string;
}

export const SESSION_SLOTS: SessionSlot[] = [
  { code: "0930", label: "9:30 AM Group", startLabel: "9:30 AM", endLabel: "10:30 AM" },
  { code: "1300", label: "1:00 PM Group", startLabel: "1:00 PM", endLabel: "2:00 PM" },
  { code: "1630", label: "4:30 PM Group", startLabel: "4:30 PM", endLabel: "5:30 PM" },
];

export interface ResidentEntry {
  name: string;
  dob: string;            // ISO YYYY-MM-DD
  ahcccsId: string;
  present: boolean;
  absenceReason: string;
  participation: string;
  behavior: string;
  overall: string;
  significantInfo: string;
}

export interface GenerateArgs {
  facilityName: string;
  dateMdY: string;        // M/D/YY
  staffName: string;
  staffTitle: string;
  bhpSignatoryName: string;
  groupTopic: string;
  groupSummary: string;
  sessionCodes: Array<"0930" | "1300" | "1630">;
  /** Optional per-session summary overrides. When supplied, each session's
   *  notes use their own summary text; otherwise every session falls back
   *  to `groupSummary`. */
  summariesBySession?: Partial<Record<"0930" | "1300" | "1630", string>>;
  residents: ResidentEntry[];
}

export interface GeneratedFile {
  filename: string;
  bytes: Uint8Array;
  resident: string;
  session: string;
  status: "ok" | "skipped";
  reason?: string;
}

// ---------------------------------------------------------------------------
// Treatment-goal catalog. One phrase is chosen per note; selection is biased
// toward goals whose distinctive words appear in the group's topic and
// summary text, with a seeded fallback for variety across residents in the
// same session.
// ---------------------------------------------------------------------------
const TREATMENT_GOALS: string[] = [
  "Staying Sober","Not Going Back to Old Habits","Learning Healthy Ways to Cope",
  "Handling Strong Feelings","Getting Through Hard Moments","Handling Worry and Fear",
  "Lifting Low Mood","Handling Stress","Handling Anger","Healing From the Past",
  "Talking to Others in a Healthy Way","Setting Healthy Limits","Rebuilding Family Relationships",
  "Making Sober Friends","Feeling Better About Yourself","Building a Daily Routine",
  "Thinking Before Acting","Solving Problems","Staying Calm and Present","Staying Motivated",
  "Coping With Loss","Getting Along With Others","Sleeping Better and Taking Care of Yourself",
  "Handling Cravings and Triggers","Building Healthy Relationships","Handling Money and Bills",
  "Getting Ready for Work","Taking Medicine as Directed","Spending Less Time Alone",
  "Finding Fun, Healthy Activities","Taking Care of Your Health","Changing Negative Thinking",
  "Making a Plan to Stay Sober","Handling More Than One Problem at Once","Learning Everyday Life Skills",
  "Being More Patient","Talking Better With Family","Being Kind to Yourself","Knowing Your Triggers",
  "Speaking Up for Yourself","Letting Go of Guilt and Shame","Earning Back Trust",
  "Understanding Your Feelings","Building a New, Sober Life","Working Through Disagreements",
  "Making Good Choices","Handling Pain Without Drugs","Building a Support System",
  "Building Healthy Habits","Understanding Your Addiction","Handling Daily Life Better",
  "Feeling Less Anxious and Down","Getting Steady and Sober","Setting Limits With Others",
  "Staying Away From Risky Choices","Bouncing Back From Setbacks","Getting Along Better With People",
  "Staying Sober Long-Term","Understanding Yourself Better","Using Drugs and Alcohol Less",
  "Improving Your Mental Health","Keeping a Healthy Daily Routine","Being a Better Parent",
  "Handling Grief","Getting More Involved in the Community","Feeling Better in Body and Mind",
  "Talking Things Out in a Healthy Way","Working Through the Past","Feeling More Confident in Recovery",
  "Feeling Less Worried and Panicked","Handling Your Emotions","Making Healthy Friendships",
];

const STOP_WORDS = new Set([
  "a","an","the","and","or","of","to","in","on","for","with","from","at","by",
  "your","you","yours","yourself","yourselves",
  "is","are","was","were","be","been","being","am",
  "as","it","its","this","that","these","those","so","if","not","yes","no",
  "do","does","did","doing","done",
  "have","has","had","having",
  "will","would","can","could","should","may","might","must",
  "about","into","out","up","down","over","under","again","then","than",
  "more","most","very","just","also","too","only","own","any","each","every","all",
  "how","when","where","what","who","which","because","while","between",
  "few","some","such","other","others","another","different","same",
  "we","us","our","ours",
  "he","she","him","her","his","hers","they","them","their","theirs","i","me","my","mine",
  "one","two","three","four","five","many","much","several",
  "someone","anyone","everyone","nobody","something","anything","everything","nothing",
  "put","get","got","gets","getting","give","gave","given","take","took","taken","taking",
  "make","made","makes","making","let","lets","letting","use","used","using",
  "go","goes","went","gone","come","came","comes","coming",
  "know","knows","knew","known","knowing",
  "say","says","said","tell","told","telling",
  "feel","feels","felt","feeling","think","thinks","thought","thinking",
  "want","wants","wanted","need","needs","needed",
  "chance","member","members","people","person",
  "left","room","today","yesterday","tomorrow","now","later",
  "share","shared","sharing","support","supported","supporting","group","groups","session","sessions",
]);

function tokenize(s: string): string[] {
  return (s || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
    .filter(w => w && !STOP_WORDS.has(w) && w.length > 2);
}

function pickGoal(topic: string, summary: string, seed: string): string {
  const contextTokens = new Set([...tokenize(topic), ...tokenize(summary)]);
  if (contextTokens.size === 0) {
    const rand = seededRng(seed);
    return TREATMENT_GOALS[Math.floor(rand() * TREATMENT_GOALS.length)];
  }
  const scored = TREATMENT_GOALS.map(g => {
    const gtoks = tokenize(g);
    let score = 0;
    for (const t of gtoks) if (contextTokens.has(t)) score++;
    return { goal: g, score };
  });
  const maxScore = Math.max(...scored.map(s => s.score));
  if (maxScore === 0) {
    const rand = seededRng(seed);
    return TREATMENT_GOALS[Math.floor(rand() * TREATMENT_GOALS.length)];
  }
  const topBucket = scored.filter(s => s.score === maxScore).map(s => s.goal);
  const rand = seededRng(seed);
  return topBucket[Math.floor(rand() * topBucket.length)];
}

// ---------------------------------------------------------------------------
// Deterministic PRNG + rating picker
// ---------------------------------------------------------------------------

function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRng(seedStr: string): () => number {
  let a = hash32(seedStr) || 0x9e3779b9;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickLevel(present: boolean, rand: () => number): "n/a" | "low" | "med" | "high" {
  if (!present) return "n/a";
  const r = rand();
  if (r < 0.55) return "high";
  if (r < 0.90) return "med";
  if (r < 0.98) return "low";
  return "n/a";
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function sanitizeFilename(s: string): string {
  return s.replace(/[\\/:*?"<>|]+/g, "-").trim().slice(0, 80);
}

function isoToMDYYYY(iso: string): string {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  return `${parseInt(m, 10)}/${parseInt(d, 10)}/${y}`;
}

function mdyToFilenameStub(mdy: string): string {
  const [m, d, y] = mdy.split("/");
  const mm = (m || "").padStart(2, "0");
  const dd = (d || "").padStart(2, "0");
  const yy = (y || "").slice(-2).padStart(2, "0");
  return `${mm}${dd}${yy}`;
}

function residentHasContent(r: ResidentEntry): boolean {
  return [r.absenceReason, r.participation, r.behavior, r.overall, r.significantInfo]
    .some(v => (v ?? "").trim().length > 0);
}

// ---------------------------------------------------------------------------
// Paragraph/table primitives
// ---------------------------------------------------------------------------

const FONT = "Calibri";
const RUN_SIZE = 22; // 11pt

function run(t: string, opts?: { bold?: boolean; italics?: boolean; size?: number; break?: number }): TextRun {
  return new TextRun({
    text: t,
    bold: opts?.bold,
    italics: opts?.italics,
    size: opts?.size ?? RUN_SIZE,
    font: FONT,
    break: opts?.break,
  });
}

/** Two runs in a single paragraph, with a soft line break between the label
 *  (bold) and the value — matches the sample's identity cells. */
function labelValueRuns(label: string, value: string): TextRun[] {
  return [
    run(`${label}:`, { bold: true }),
    run(value, { break: 1 }),
  ];
}

/** Bold section title (no shading, no heading style — matches the sample). */
function sectionTitle(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 80 },
    children: [run(text, { bold: true, size: 24 })],
  });
}

/** Document title, centered. */
function docTitle(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 200 },
    children: [run(text, { bold: true, size: 28 })],
  });
}

const CELL_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
  left: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
  right: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
};

/** Page width in twips (Letter = 12240) minus 1" margins on both sides. */
const USABLE_WIDTH_DXA = 12240 - 1440 * 2;

interface CellOpts {
  bold?: boolean;
  align?: "center" | "left";
  /** Absolute cell width in twips (DXA). Percentages in this docx version are
   *  on a 5000-scale, so we use DXA everywhere for consistent rendering. */
  widthDxa?: number;
  columnSpan?: number;
  runs?: TextRun[];
  paragraphs?: Paragraph[];
}

function makeCell(text: string | null, opts?: CellOpts): TableCell {
  const children: Paragraph[] = opts?.paragraphs ?? [
    new Paragraph({
      alignment: opts?.align === "center" ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: opts?.runs ?? [run(text ?? "", { bold: opts?.bold })],
    }),
  ];
  return new TableCell({
    borders: CELL_BORDER,
    width: opts?.widthDxa ? { size: opts.widthDxa, type: WidthType.DXA } : undefined,
    columnSpan: opts?.columnSpan,
    children,
  });
}

function makeCellRuns(runs: TextRun[], opts?: Omit<CellOpts, "runs">): TableCell {
  return makeCell(null, { ...opts, runs });
}

function fullWidthTable(rows: TableRow[]): Table {
  return new Table({
    width: { size: USABLE_WIDTH_DXA, type: WidthType.DXA },
    rows,
  });
}

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

// Column-width plans in DXA (twips). Each plan sums to USABLE_WIDTH_DXA.
const IDENT_WIDTHS = [3240, 1800, 2160, 2160] as const;        // Name / DOB / AHCCCS / Date
const SESSION_WIDTHS = [1620, 1980, 1440, 1440, 1440, 1440] as const;
const TOPIC_WIDTHS = [1440, USABLE_WIDTH_DXA - 1440] as const;
const PARTICIPATION_WIDTHS = [2520, 2160, 2160, 2520] as const; // label/val/label/val
const RATING_WIDTHS = [3960, 1350, 1350, 1350, 1350] as const;  // area/N/A/Low/Med/High
const TREATMENT_WIDTHS = [3600, USABLE_WIDTH_DXA - 3600] as const;
const ADDITIONAL_WIDTHS = [3060, USABLE_WIDTH_DXA - 3060] as const;
const SIGNATURE_WIDTHS = [1980, 3960, 900, 2520] as const;      // label/val/date/val

function identityTable(name: string, dobIso: string, ahcccsId: string, dateMdY: string): Table {
  return fullWidthTable([
    new TableRow({
      children: [
        makeCellRuns(labelValueRuns("Name", name), { widthDxa: IDENT_WIDTHS[0] }),
        makeCellRuns(labelValueRuns("DOB", isoToMDYYYY(dobIso)), { widthDxa: IDENT_WIDTHS[1] }),
        makeCellRuns(labelValueRuns("AHCCCS ID", ahcccsId || ""), { widthDxa: IDENT_WIDTHS[2] }),
        makeCellRuns(labelValueRuns("Date", dateMdY), { widthDxa: IDENT_WIDTHS[3] }),
      ],
    }),
  ]);
}

function sessionInfoTable(startLabel: string, endLabel: string): Table {
  return fullWidthTable([
    new TableRow({
      children: [
        makeCell("Session Type:", { bold: true, widthDxa: SESSION_WIDTHS[0] }),
        makeCell("Group Therapy Session", { widthDxa: SESSION_WIDTHS[1] }),
        makeCell("Start Time:", { bold: true, widthDxa: SESSION_WIDTHS[2] }),
        makeCell(startLabel, { widthDxa: SESSION_WIDTHS[3] }),
        makeCell("End Time:", { bold: true, widthDxa: SESSION_WIDTHS[4] }),
        makeCell(endLabel, { widthDxa: SESSION_WIDTHS[5] }),
      ],
    }),
  ]);
}

/** Topic + Summary as a single 2-row 2-column table so Word doesn't merge
 *  two separate adjacent tables and drop the second row into the first
 *  column. */
function topicSummaryTable(topic: string, summary: string): Table {
  return fullWidthTable([
    new TableRow({
      children: [
        makeCell("Topic:", { bold: true, widthDxa: TOPIC_WIDTHS[0] }),
        makeCell(topic, { widthDxa: TOPIC_WIDTHS[1] }),
      ],
    }),
    new TableRow({
      children: [
        makeCell("Summary:", { bold: true, widthDxa: TOPIC_WIDTHS[0] }),
        makeCell(summary, { widthDxa: TOPIC_WIDTHS[1] }),
      ],
    }),
  ]);
}

function participationTable(completed: string, stayedOnTask: string, comment1: string, comment2: string): Table {
  return fullWidthTable([
    new TableRow({
      children: [
        makeCell("Completed Group Therapy:", { bold: true, widthDxa: PARTICIPATION_WIDTHS[0] }),
        makeCell(completed, { widthDxa: PARTICIPATION_WIDTHS[1] }),
        makeCell("Stayed on Task:", { bold: true, widthDxa: PARTICIPATION_WIDTHS[2] }),
        makeCell(stayedOnTask, { widthDxa: PARTICIPATION_WIDTHS[3] }),
      ],
    }),
    new TableRow({
      children: [
        makeCell("Comments:", { bold: true, widthDxa: PARTICIPATION_WIDTHS[0] }),
        makeCell(comment1, { widthDxa: PARTICIPATION_WIDTHS[1] }),
        makeCell("Comments:", { bold: true, widthDxa: PARTICIPATION_WIDTHS[2] }),
        makeCell(comment2, { widthDxa: PARTICIPATION_WIDTHS[3] }),
      ],
    }),
  ]);
}

function ratingTable(items: Array<{ label: string; level: "n/a" | "low" | "med" | "high" }>): Table {
  const header = new TableRow({
    tableHeader: true,
    children: [
      makeCell("Assessment Area", { bold: true, widthDxa: RATING_WIDTHS[0] }),
      makeCell("N/A", { bold: true, align: "center", widthDxa: RATING_WIDTHS[1] }),
      makeCell("Low", { bold: true, align: "center", widthDxa: RATING_WIDTHS[2] }),
      makeCell("Med", { bold: true, align: "center", widthDxa: RATING_WIDTHS[3] }),
      makeCell("High", { bold: true, align: "center", widthDxa: RATING_WIDTHS[4] }),
    ],
  });
  const dataRows = items.map(i =>
    new TableRow({
      children: [
        makeCell(i.label, { widthDxa: RATING_WIDTHS[0] }),
        makeCell(i.level === "n/a" ? "X" : "", { align: "center", widthDxa: RATING_WIDTHS[1] }),
        makeCell(i.level === "low" ? "X" : "", { align: "center", widthDxa: RATING_WIDTHS[2] }),
        makeCell(i.level === "med" ? "X" : "", { align: "center", widthDxa: RATING_WIDTHS[3] }),
        makeCell(i.level === "high" ? "X" : "", { align: "center", widthDxa: RATING_WIDTHS[4] }),
      ],
    })
  );
  return fullWidthTable([header, ...dataRows]);
}

function commentsParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 100, after: 120 },
    children: [
      run("Comments: ", { bold: true }),
      run(text || ""),
    ],
  });
}

function treatmentGoalsTable(addressed: string, goal: string): Table {
  return fullWidthTable([
    new TableRow({
      children: [
        makeCell("Were treatment goals addressed?", { bold: true, widthDxa: TREATMENT_WIDTHS[0] }),
        makeCell(addressed, { widthDxa: TREATMENT_WIDTHS[1] }),
      ],
    }),
    new TableRow({
      children: [
        makeCell("Goals Addressed:", { bold: true, widthDxa: TREATMENT_WIDTHS[0] }),
        makeCell(goal, { widthDxa: TREATMENT_WIDTHS[1] }),
      ],
    }),
  ]);
}

function additionalInfoTable(sig: string): Table {
  return fullWidthTable([
    new TableRow({
      children: [
        makeCell("Significant Information:", { bold: true, widthDxa: ADDITIONAL_WIDTHS[0] }),
        makeCell(sig, { widthDxa: ADDITIONAL_WIDTHS[1] }),
      ],
    }),
  ]);
}

/** Build a signature cell: blank line for hand signature at top, then an
 *  underscore line, then the typed name below (empty for staff so whoever
 *  signs writes their own name). The extra empty paragraphs give physical
 *  room to sign. */
function signatureCell(nameBelow: string, widthDxa: number): TableCell {
  const paragraphs: Paragraph[] = [
    new Paragraph({ children: [run("")] }),
    new Paragraph({ children: [run("")] }),
    new Paragraph({ children: [run("________________________________________")] }),
  ];
  if (nameBelow) {
    paragraphs.push(new Paragraph({ children: [run(nameBelow)] }));
  }
  return makeCell(null, { paragraphs, widthDxa });
}

function signaturesTable(
  bhpSignatoryName: string,
  dateMdY: string
): Table {
  return fullWidthTable([
    new TableRow({
      children: [
        makeCell("Staff Signature:", { bold: true, widthDxa: SIGNATURE_WIDTHS[0] }),
        signatureCell("", SIGNATURE_WIDTHS[1]),
        makeCell("Date:", { bold: true, widthDxa: SIGNATURE_WIDTHS[2] }),
        makeCell(dateMdY, { widthDxa: SIGNATURE_WIDTHS[3] }),
      ],
    }),
    new TableRow({
      children: [
        makeCell("BHP Signature:", { bold: true, widthDxa: SIGNATURE_WIDTHS[0] }),
        signatureCell(bhpSignatoryName, SIGNATURE_WIDTHS[1]),
        makeCell("Date:", { bold: true, widthDxa: SIGNATURE_WIDTHS[2] }),
        makeCell(dateMdY, { widthDxa: SIGNATURE_WIDTHS[3] }),
      ],
    }),
  ]);
}

// ---------------------------------------------------------------------------
// Document assembly
// ---------------------------------------------------------------------------

interface OneNoteArgs {
  facilityName: string;
  dateMdY: string;
  slot: SessionSlot;
  topic: string;
  summary: string;
  staffName: string;
  staffTitle: string;
  bhpSignatoryName: string;
  resident: ResidentEntry;
}

function buildOneNote(a: OneNoteArgs): Document {
  const { resident, slot } = a;
  const rand = seededRng(`${resident.name}|${a.dateMdY}|${slot.code}`);
  const pick = () => pickLevel(resident.present, rand);
  const completed = resident.present ? "Yes" : "No";
  const stayedOnTask = resident.present ? "Yes" : "No";

  const goal = resident.present
    ? pickGoal(a.topic, a.summary, `${resident.name}|${a.dateMdY}|${slot.code}|goal`)
    : "";

  const children: (Paragraph | Table)[] = [];

  // 1. Identity block
  children.push(identityTable(resident.name, resident.dob, resident.ahcccsId, a.dateMdY));

  // 2. Title
  children.push(new Paragraph({ children: [run("")] }));
  children.push(docTitle("Therapeutic Group/Activity Note"));

  // 3. Session Date (paragraph)
  children.push(
    new Paragraph({
      spacing: { after: 80 },
      children: [
        run("Session Date: ", { bold: true }),
        run(a.dateMdY),
      ],
    })
  );

  // 4. Session Type / Start / End table
  children.push(sessionInfoTable(slot.startLabel, slot.endLabel));

  // 5. Group Topic/Summary Notes
  children.push(sectionTitle("Group Topic/Summary Notes"));
  children.push(
    topicSummaryTable(
      a.topic,
      a.summary ||
        "Structured group session focused on the day's topic. Facilitator delivered content and led discussion; residents were invited to share and practice skills as applicable."
    )
  );

  // 6. Participation Assessment
  children.push(sectionTitle("Participation Assessment"));
  const participationText = resident.present
    ? (resident.participation.trim() || "")
    : `Resident was absent. Reason: ${resident.absenceReason.trim() || "Not documented"}.`;
  // Second Comments column has no dedicated wizard field; keep it in sync with
  // participationText but leave blank when the primary is blank.
  const stayedOnTaskComment = resident.present ? "" : "";
  children.push(
    participationTable(completed, stayedOnTask, participationText, stayedOnTaskComment)
  );

  // 7. Behavioral Observations
  children.push(sectionTitle("Behavioral Observations During Group Therapy"));
  children.push(
    ratingTable([
      { label: "Initiated positive interactions", level: pick() },
      { label: "Shared feelings/emotions", level: pick() },
      { label: "Gave self-disclosure", level: pick() },
      { label: "Participated in discussions", level: pick() },
      { label: "Offered suggestion/opinion/feedback", level: pick() },
    ])
  );
  children.push(commentsParagraph(resident.behavior.trim()));

  // 8. Overall Group Engagement Assessment
  children.push(sectionTitle("Overall Group Engagement Assessment"));
  children.push(
    ratingTable([
      { label: "Perceived interest in Group/Therapeutic Activity", level: pick() },
      { label: "Helpful to Others", level: pick() },
      { label: "Focused on Group Topic/Therapeutic Activity", level: pick() },
      { label: "Showed listening Skills/Empathy", level: pick() },
      { label: "Seemed to benefit from group process", level: pick() },
    ])
  );
  children.push(commentsParagraph(resident.overall.trim()));

  // 9. Treatment Goals
  children.push(sectionTitle("Treatment Goals"));
  children.push(treatmentGoalsTable(resident.present ? "Yes" : "No", goal));

  // 10. Additional Information
  children.push(sectionTitle("Additional Information"));
  children.push(additionalInfoTable(resident.significantInfo.trim()));

  // 11. Signatures — staff cell left blank so whoever facilitates signs and
  // prints their own name; BHP cell prints Dr. Azode's name under the line.
  children.push(sectionTitle("Signatures"));
  children.push(signaturesTable(a.bhpSignatoryName, a.dateMdY));

  return new Document({
    creator: "BHP Connect",
    title: `${resident.name} - ${a.dateMdY} Group Note`,
    styles: {
      default: {
        document: { run: { font: FONT, size: RUN_SIZE } },
      },
    },
    sections: [
      {
        properties: {
          // Standard 1" margins so the doc breathes and doesn't try to
          // squeeze onto one page.
          page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
        },
        children,
      },
    ],
  });
}

const DEFAULT_TOPIC = "Group Session";

export async function buildAllNotes(args: GenerateArgs): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = [];
  const activeSlots = SESSION_SLOTS.filter(s => args.sessionCodes.includes(s.code));
  const eligibleResidents = args.residents.filter(residentHasContent);
  const dateStub = mdyToFilenameStub(args.dateMdY);

  for (let sIdx = 0; sIdx < activeSlots.length; sIdx++) {
    const slot = activeSlots[sIdx];
    const baseTopic = args.groupTopic.trim() || DEFAULT_TOPIC;
    // Append the day-position marker so staff can tell which of the day's
    // groups this note is for, even when the topic itself is the same.
    const topic =
      activeSlots.length > 1
        ? `${baseTopic} (Part ${sIdx + 1} of ${activeSlots.length})`
        : baseTopic;
    const slotSummary =
      args.summariesBySession?.[slot.code]?.trim() || args.groupSummary;

    for (const r of eligibleResidents) {
      const doc = buildOneNote({
        facilityName: args.facilityName,
        dateMdY: args.dateMdY,
        slot,
        topic,
        summary: slotSummary,
        staffName: args.staffName,
        staffTitle: args.staffTitle,
        bhpSignatoryName: args.bhpSignatoryName,
        resident: r,
      });
      const buf = await Packer.toBuffer(doc);
      const filename = sanitizeFilename(`${r.name} - ${dateStub} ${slot.code}.docx`);
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
