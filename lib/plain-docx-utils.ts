/**
 * Shared helpers for the plain, no-color .docx builders (intake and ASAM).
 *
 * Calibri 11pt on white with light-gray section borders. Each builder
 * composes a document from these primitives.
 */

import {
  AlignmentType,
  BorderStyle,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

export const FONT = "Calibri";
export const RUN_SIZE = 22; // 11pt
export const USABLE_WIDTH_DXA = 12240 - 1440 * 2; // Letter minus 1" margins

export const BORDER = {
  top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
  left: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
  right: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
};

export function run(text: string, opts: { bold?: boolean; italics?: boolean; size?: number } = {}): TextRun {
  return new TextRun({ text, bold: opts.bold, italics: opts.italics, size: opts.size ?? RUN_SIZE, font: FONT });
}

/** Centered document title (28 half-points = 14pt). */
export function docTitle(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 160 },
    children: [run(text, { bold: true, size: 28 })],
  });
}

/** Centered subtitle under the title. */
export function docSubtitle(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [run(text, { italics: true, size: 20 })],
  });
}

/** Uppercase section title (bold, slightly larger). */
export function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 80 },
    children: [run(text.toUpperCase(), { bold: true, size: 26 })],
  });
}

/** Sub-heading inside a section. */
export function subHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 160, after: 60 },
    children: [run(text, { bold: true, size: 24 })],
  });
}

/** Plain justified body text. */
export function body(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 80 },
    children: [run(text || "N/A")],
  });
}

/** Bold inline label followed by the value on the same line. */
export function inlineKV(label: string, value: string | null | undefined): Paragraph {
  return new Paragraph({
    spacing: { after: 40 },
    children: [
      run(`${label}: `, { bold: true }),
      run((value || "N/A").toString()),
    ],
  });
}

/** Bold label on its own line (no trailing colon), body text below. Use for
 *  long free-text fields. */
export function labeledBlock(label: string, value: string | null | undefined): Paragraph[] {
  const v = (value || "").toString().trim();
  if (!v) return [];
  return [
    new Paragraph({
      spacing: { before: 100, after: 20 },
      children: [run(label, { bold: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 80 },
      children: [run(v)],
    }),
  ];
}

/** Centered CONFIDENTIAL banner used at the top of each clinical document. */
export function confidentialBanner(): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 160 },
    children: [run("CONFIDENTIAL — PROTECTED HEALTH INFORMATION (PHI)", { bold: true, size: 20 })],
  });
}

/** Render a list of [label, value] pairs as a borderless two-column KV table.
 *  Pairs with an empty value are skipped. Odd number of pairs gets a blank
 *  right cell. */
export function twoColumnKVTable(
  pairs: [string, string | number | boolean | null | undefined][]
): Table | Paragraph {
  const kept = pairs
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([label, raw]) => [label, typeof raw === "boolean" ? (raw ? "Yes" : "No") : String(raw)] as [string, string]);
  if (kept.length === 0) {
    // docx's Table constructor throws on an empty rows array; return a
    // benign spacer the caller can treat identically.
    return new Paragraph({ spacing: { after: 0 }, children: [run("")] });
  }
  // Deal odd-last-pair with a blank right side
  if (kept.length % 2 === 1) kept.push(["", ""]);

  const half = Math.round(USABLE_WIDTH_DXA / 2);
  const noBorder = {
    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  };

  const cell = (label: string, value: string): TableCell =>
    new TableCell({
      borders: noBorder,
      width: { size: half, type: WidthType.DXA },
      children: [
        new Paragraph({
          spacing: { after: 40 },
          children: label ? [run(`${label}: `, { bold: true }), run(value)] : [run("")],
        }),
      ],
    });

  const rows: TableRow[] = [];
  for (let i = 0; i < kept.length; i += 2) {
    rows.push(
      new TableRow({
        children: [cell(kept[i][0], kept[i][1]), cell(kept[i + 1][0], kept[i + 1][1])],
      })
    );
  }
  return new Table({ width: { size: USABLE_WIDTH_DXA, type: WidthType.DXA }, rows });
}

/** Push every inlineKV from the given [label, value] pairs that have a value. */
export function appendKVs(
  out: (Paragraph | Table)[],
  pairs: [string, string | number | boolean | null | undefined][]
): void {
  for (const [label, raw] of pairs) {
    if (raw === null || raw === undefined || raw === "") continue;
    const v = typeof raw === "boolean" ? (raw ? "Yes" : "No") : String(raw);
    out.push(inlineKV(label, v));
  }
}

/** Convert a Record<string, bool|string> checklist into a comma-separated string
 *  of its "true" (or non-empty) keys, formatted camelCase → "Camel Case". */
export function checklistToString(
  record: Record<string, boolean | string | null | undefined> | null | undefined
): string {
  if (!record || typeof record !== "object") return "";
  const keys = Object.entries(record)
    .filter(([, v]) => v === true || (typeof v === "string" && v.length > 0 && v !== "N/A"))
    .map(([k, v]) => {
      const label = k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();
      if (typeof v === "string" && v !== "true") return `${label}: ${v}`;
      return label;
    });
  return keys.join(", ");
}

/** Build a simple N-column table with a header row. All cells use the gray border. */
export function dataTable(headers: string[], rows: string[][]): Table {
  const colW = Math.floor(USABLE_WIDTH_DXA / headers.length);
  return new Table({
    width: { size: USABLE_WIDTH_DXA, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: headers.map(
          (h) =>
            new TableCell({
              borders: BORDER,
              width: { size: colW, type: WidthType.DXA },
              children: [new Paragraph({ children: [run(h, { bold: true, size: 20 })] })],
            })
        ),
      }),
      ...rows.map(
        (r) =>
          new TableRow({
            children: r.map(
              (cell) =>
                new TableCell({
                  borders: BORDER,
                  width: { size: colW, type: WidthType.DXA },
                  children: [new Paragraph({ children: [run(cell || "-", { size: 20 })] })],
                })
            ),
          })
      ),
    ],
  });
}

/** Horizontal two-column key-value table (for header-style identity blocks). */
export function twoColKV(pairs: [string, string][]): Table {
  const half = Math.round(USABLE_WIDTH_DXA / 2);
  return new Table({
    width: { size: USABLE_WIDTH_DXA, type: WidthType.DXA },
    rows: pairs.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              borders: BORDER,
              width: { size: half, type: WidthType.DXA },
              children: [new Paragraph({ children: [run(label, { bold: true })] })],
            }),
            new TableCell({
              borders: BORDER,
              width: { size: half, type: WidthType.DXA },
              children: [new Paragraph({ children: [run(value || "")] })],
            }),
          ],
        })
    ),
  });
}

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${mm}/${dd}/${yyyy}`;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Long-form date: "October 3, 1992". Used in body text. */
export function fmtDateLong(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export function sanitizeFilename(s: string): string {
  return s.replace(/[\\/:*?"<>|]+/g, "-").trim().slice(0, 120);
}

/** Build the standard document section config: Letter page, 1" margins, default run style. */
export function defaultDocProps(title: string) {
  return {
    creator: "BHP Connect",
    title,
    styles: {
      default: {
        document: { run: { font: FONT, size: RUN_SIZE } },
      },
    },
  };
}

export function defaultSection(children: (Paragraph | Table)[]) {
  return {
    properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
    children,
  };
}
