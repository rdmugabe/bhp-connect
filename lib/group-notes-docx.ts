/**
 * Group therapy note .docx builder.
 *
 * Matches the "Therapeutic Group/Activity Note" template used by the
 * facility (see sample: Yngwie Howard - 090726 1630.docx). Produces one
 * Word document per resident per session slot. Runs entirely in-process
 * — no external service required.
 */

import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
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
  dob: string;            // ISO YYYY-MM-DD from the intake DOB
  ahcccsId: string;       // Intake.policyNumber
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
  bhpSignatoryName: string;   // e.g. "Dr. Chris Azode, DNP, MBA, PMHNP-BC"
  groupTopic: string;
  groupSummary: string;
  sessionCodes: Array<"0930" | "1300" | "1630">;
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
// Utility helpers
// ---------------------------------------------------------------------------

function sanitizeFilename(s: string): string {
  return s.replace(/[\\/:*?"<>|]+/g, "-").trim().slice(0, 80);
}

/** ISO YYYY-MM-DD → "M/D/YYYY" (leading-zero stripped). */
function isoToMDYYYY(iso: string): string {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  return `${parseInt(m, 10)}/${parseInt(d, 10)}/${y}`;
}

/** "M/D/YY" → "MMDDYY" for filenames. */
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
// Paragraph helpers
// ---------------------------------------------------------------------------

const FONT = "Calibri";
const RUN_SIZE = 22; // 11pt

function text(run: string, opts?: { bold?: boolean; italics?: boolean; size?: number }): TextRun {
  return new TextRun({
    text: run,
    bold: opts?.bold,
    italics: opts?.italics,
    size: opts?.size ?? RUN_SIZE,
    font: FONT,
  });
}

function para(runs: TextRun[], opts?: { alignment?: (typeof AlignmentType)[keyof typeof AlignmentType]; after?: number; before?: number }): Paragraph {
  return new Paragraph({
    alignment: opts?.alignment,
    spacing: { before: opts?.before ?? 0, after: opts?.after ?? 80 },
    children: runs,
  });
}

function heading(t: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 100 },
    shading: { type: ShadingType.CLEAR, color: "auto", fill: "D9D9D9" },
    children: [text(t, { bold: true, size: 24 })],
  });
}

function docTitle(t: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [text(t, { bold: true, size: 28 })],
  });
}

// ---------------------------------------------------------------------------
// Table helpers
// ---------------------------------------------------------------------------

const CELL_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 4, color: "808080" },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: "808080" },
  left: { style: BorderStyle.SINGLE, size: 4, color: "808080" },
  right: { style: BorderStyle.SINGLE, size: 4, color: "808080" },
};

function cell(runs: TextRun[], opts?: { widthPct?: number; shading?: string; bold?: boolean; align?: "center" | "left" }): TableCell {
  return new TableCell({
    borders: CELL_BORDER,
    shading: opts?.shading
      ? { type: ShadingType.CLEAR, color: "auto", fill: opts.shading }
      : undefined,
    width: opts?.widthPct ? { size: opts.widthPct, type: WidthType.PERCENTAGE } : undefined,
    children: [
      new Paragraph({
        alignment: opts?.align === "center" ? AlignmentType.CENTER : AlignmentType.LEFT,
        children: runs,
      }),
    ],
  });
}

function kvTable(rows: Array<[string, string]>): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(([k, v]) =>
      new TableRow({
        children: [
          cell([text(k, { bold: true })], { widthPct: 30, shading: "F2F2F2" }),
          cell([text(v)], { widthPct: 70 }),
        ],
      })
    ),
  });
}

interface RatingRow {
  label: string;
  /** "n/a" | "low" | "med" | "high" */
  level: "n/a" | "low" | "med" | "high";
}

function ratingTable(rows: RatingRow[], commentText: string): Table {
  const header = new TableRow({
    tableHeader: true,
    children: [
      cell([text("Assessment Area", { bold: true })], { widthPct: 44, shading: "D9D9D9" }),
      cell([text("N/A", { bold: true })], { widthPct: 14, shading: "D9D9D9", align: "center" }),
      cell([text("Low", { bold: true })], { widthPct: 14, shading: "D9D9D9", align: "center" }),
      cell([text("Med", { bold: true })], { widthPct: 14, shading: "D9D9D9", align: "center" }),
      cell([text("High", { bold: true })], { widthPct: 14, shading: "D9D9D9", align: "center" }),
    ],
  });

  const dataRows = rows.map(r =>
    new TableRow({
      children: [
        cell([text(r.label)], { widthPct: 44 }),
        cell([text(r.level === "n/a" ? "X" : "")], { widthPct: 14, align: "center" }),
        cell([text(r.level === "low" ? "X" : "")], { widthPct: 14, align: "center" }),
        cell([text(r.level === "med" ? "X" : "")], { widthPct: 14, align: "center" }),
        cell([text(r.level === "high" ? "X" : "")], { widthPct: 14, align: "center" }),
      ],
    })
  );

  const commentRow = new TableRow({
    children: [
      cell([text("Comments:", { bold: true })], { widthPct: 44, shading: "F2F2F2" }),
      new TableCell({
        borders: CELL_BORDER,
        width: { size: 56, type: WidthType.PERCENTAGE },
        columnSpan: 4,
        children: [new Paragraph({ children: [text(commentText || "")] })],
      }),
    ],
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [header, ...dataRows, commentRow],
  });
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

// ---------------------------------------------------------------------------
// Treatment-goal catalog. One phrase is chosen per note; selection is biased
// toward goals whose distinctive words appear in the group's topic and
// summary text, with deterministic seeded fallback for variety across
// residents in the same session.
// ---------------------------------------------------------------------------
const TREATMENT_GOALS: string[] = [
  "Staying Sober",
  "Not Going Back to Old Habits",
  "Learning Healthy Ways to Cope",
  "Handling Strong Feelings",
  "Getting Through Hard Moments",
  "Handling Worry and Fear",
  "Lifting Low Mood",
  "Handling Stress",
  "Handling Anger",
  "Healing From the Past",
  "Talking to Others in a Healthy Way",
  "Setting Healthy Limits",
  "Rebuilding Family Relationships",
  "Making Sober Friends",
  "Feeling Better About Yourself",
  "Building a Daily Routine",
  "Thinking Before Acting",
  "Solving Problems",
  "Staying Calm and Present",
  "Staying Motivated",
  "Coping With Loss",
  "Getting Along With Others",
  "Sleeping Better and Taking Care of Yourself",
  "Handling Cravings and Triggers",
  "Building Healthy Relationships",
  "Handling Money and Bills",
  "Getting Ready for Work",
  "Taking Medicine as Directed",
  "Spending Less Time Alone",
  "Finding Fun, Healthy Activities",
  "Taking Care of Your Health",
  "Changing Negative Thinking",
  "Making a Plan to Stay Sober",
  "Handling More Than One Problem at Once",
  "Learning Everyday Life Skills",
  "Being More Patient",
  "Talking Better With Family",
  "Being Kind to Yourself",
  "Knowing Your Triggers",
  "Speaking Up for Yourself",
  "Letting Go of Guilt and Shame",
  "Earning Back Trust",
  "Understanding Your Feelings",
  "Building a New, Sober Life",
  "Working Through Disagreements",
  "Making Good Choices",
  "Handling Pain Without Drugs",
  "Building a Support System",
  "Building Healthy Habits",
  "Understanding Your Addiction",
  "Handling Daily Life Better",
  "Feeling Less Anxious and Down",
  "Getting Steady and Sober",
  "Setting Limits With Others",
  "Staying Away From Risky Choices",
  "Bouncing Back From Setbacks",
  "Getting Along Better With People",
  "Staying Sober Long-Term",
  "Understanding Yourself Better",
  "Using Drugs and Alcohol Less",
  "Improving Your Mental Health",
  "Keeping a Healthy Daily Routine",
  "Being a Better Parent",
  "Handling Grief",
  "Getting More Involved in the Community",
  "Feeling Better in Body and Mind",
  "Talking Things Out in a Healthy Way",
  "Working Through the Past",
  "Feeling More Confident in Recovery",
  "Feeling Less Worried and Panicked",
  "Handling Your Emotions",
  "Making Healthy Friendships",
];

/** Words we ignore when scoring goal-vs-topic overlap. Includes generic
 *  verbs and quantifiers that would otherwise create false-positive hits. */
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
  // Common quantifiers / pronouns / generic verbs that shouldn't drive matching
  "one","two","three","four","five","many","much","several",
  "someone","anyone","everyone","nobody","something","anything","everything","nothing",
  "put","get","got","gets","getting","give","gave","given","take","took","taken","taking",
  "make","made","makes","making","let","lets","letting","use","used","using",
  "go","goes","went","gone","come","came","comes","coming",
  "know","knows","knew","known","knowing",
  "say","says","said","tell","told","telling",
  "feel","feels","felt","feeling","think","thinks","thought","thinking",
  "want","wants","wanted","need","needs","needed",
  "chance","member","members","people","person","person",
  "left","left","room","today","yesterday","tomorrow","now","later",
  "share","shared","sharing","support","supported","supporting","group","groups","session","sessions",
]);

function tokenize(s: string): string[] {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w && !STOP_WORDS.has(w) && w.length > 2);
}

/** Rank goals by how many distinctive topic/summary words they share. Falls
 *  back to a deterministic seeded pick when no goal matches. Different
 *  residents in the same session can still land on different goals thanks
 *  to the seeded tie-break. */
function pickGoal(topic: string, summary: string, seed: string): string {
  const contextTokens = new Set([...tokenize(topic), ...tokenize(summary)]);
  if (contextTokens.size === 0) {
    const rand = seededRng(seed);
    return TREATMENT_GOALS[Math.floor(rand() * TREATMENT_GOALS.length)];
  }

  const scored: Array<{ goal: string; score: number }> = TREATMENT_GOALS.map(g => {
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

  // Prefer only top-scoring goals — the treatment goal addressed in group
  // should reflect the topic accurately, not drift into loosely-related
  // phrases. Ties are broken by the seed for stability across re-generations.
  const topBucket = scored
    .filter(s => s.score === maxScore)
    .map(s => s.goal);
  const rand = seededRng(seed);
  return topBucket[Math.floor(rand() * topBucket.length)];
}

/** Deterministic 32-bit hash of a string. Same input → same output, so the
 *  same note re-generates identically. */
function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 seeded PRNG — returns 0..1 uniform draws. */
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

/** Weighted rating for a present resident: skews High/Med, occasional Low,
 *  rare N/A. Absent residents are always N/A. */
function pickLevel(present: boolean, rand: () => number): "n/a" | "low" | "med" | "high" {
  if (!present) return "n/a";
  const r = rand();
  // High 55% / Med 35% / Low 8% / N/A 2%
  if (r < 0.55) return "high";
  if (r < 0.90) return "med";
  if (r < 0.98) return "low";
  return "n/a";
}

function buildOneNote(a: OneNoteArgs): Document {
  const { resident, slot } = a;
  const rand = seededRng(`${resident.name}|${a.dateMdY}|${slot.code}`);
  const pick = () => pickLevel(resident.present, rand);
  const completed = resident.present ? "Yes" : "No";
  const stayedOnTask = resident.present ? "Yes" : "No";

  const children: (Paragraph | Table)[] = [];

  // Top: Name / DOB / AHCCCS ID / Date
  children.push(
    kvTable([
      ["Name:", resident.name],
      ["DOB:", isoToMDYYYY(resident.dob)],
      ["AHCCCS ID:", resident.ahcccsId || ""],
      ["Date:", a.dateMdY],
    ])
  );

  children.push(new Paragraph({ children: [text("")] }));
  children.push(docTitle("Therapeutic Group/Activity Note"));

  // Session Info
  children.push(
    kvTable([
      ["Session Date:", a.dateMdY],
      ["Session Type:", "Group Therapy Session"],
      ["Start Time:", slot.startLabel],
      ["End Time:", slot.endLabel],
    ])
  );

  // Group Topic/Summary Notes
  children.push(heading("Group Topic/Summary Notes"));
  children.push(
    kvTable([
      ["Topic:", a.topic],
    ])
  );
  children.push(
    para([text(a.summary || "Structured group session focused on the day's topic. Facilitator delivered content and led discussion; residents were invited to share and practice skills as applicable.")], { after: 120 })
  );

  // Participation Assessment
  children.push(heading("Participation Assessment"));
  children.push(
    kvTable([
      ["Completed Group Therapy:", completed],
      ["Stayed on Task:", stayedOnTask],
    ])
  );
  if (resident.present && resident.participation.trim()) {
    children.push(
      kvTable([
        ["Comments:", resident.participation.trim()],
      ])
    );
  } else if (!resident.present && resident.absenceReason.trim()) {
    children.push(
      kvTable([
        ["Comments:", `Resident was absent. Reason: ${resident.absenceReason.trim()}`],
      ])
    );
  }

  // Behavioral Observations
  children.push(heading("Behavioral Observations During Group Therapy"));
  children.push(
    ratingTable(
      [
        { label: "Initiated positive interactions", level: pick() },
        { label: "Shared feelings/emotions", level: pick() },
        { label: "Gave self-disclosure", level: pick() },
        { label: "Participated in discussions", level: pick() },
        { label: "Offered suggestion/opinion/feedback", level: pick() },
      ],
      resident.behavior.trim()
    )
  );

  // Overall Group Engagement Assessment
  children.push(heading("Overall Group Engagement Assessment"));
  children.push(
    ratingTable(
      [
        { label: "Perceived interest in Group/Therapeutic Activity", level: pick() },
        { label: "Helpful to Others", level: pick() },
        { label: "Focused on Group Topic/Therapeutic Activity", level: pick() },
        { label: "Showed listening Skills/Empathy", level: pick() },
        { label: "Seemed to benefit from group process", level: pick() },
      ],
      resident.overall.trim()
    )
  );

  // Treatment Goals — pick a phrase whose keywords best fit the topic/summary.
  const goal = resident.present
    ? pickGoal(a.topic, a.summary, `${resident.name}|${a.dateMdY}|${slot.code}|goal`)
    : "";
  children.push(heading("Treatment Goals"));
  children.push(
    kvTable([
      ["Were treatment goals addressed?", resident.present ? "Yes" : "No"],
      ["Goals Addressed:", goal],
    ])
  );

  // Additional Information
  children.push(heading("Additional Information"));
  children.push(
    kvTable([
      ["Significant Information:", resident.significantInfo.trim() || ""],
    ])
  );

  // Signatures
  children.push(heading("Signatures"));
  children.push(
    kvTable([
      ["Staff Signature:", `${a.staffName || "Staff Name"}${a.staffTitle ? ", " + a.staffTitle : ""}`],
      ["Date:", a.dateMdY],
      ["BHP Signature:", "__________________________________________"],
      ["", a.bhpSignatoryName],
      ["Date:", a.dateMdY],
    ])
  );

  return new Document({
    creator: "BHP Connect",
    title: `${resident.name} - ${a.dateMdY} ${slot.startLabel} Group Note`,
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
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 }, // 0.5"
          },
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

  // Only residents with at least one populated field get a document.
  const eligibleResidents = args.residents.filter(residentHasContent);

  const dateStub = mdyToFilenameStub(args.dateMdY);

  for (let sIdx = 0; sIdx < activeSlots.length; sIdx++) {
    const slot = activeSlots[sIdx];
    const topic =
      args.groupTopic.trim() ||
      `${DEFAULT_TOPIC} — Part ${sIdx + 1} of ${activeSlots.length}`;

    for (const r of eligibleResidents) {
      const doc = buildOneNote({
        facilityName: args.facilityName,
        dateMdY: args.dateMdY,
        slot,
        topic,
        summary: args.groupSummary,
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
