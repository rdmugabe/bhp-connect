import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// The react-pdf Text style prop is a union with the SVG Text variant that
// TS can't narrow through inference — locally alias to the styles-object
// values, which is what we actually pass at every call site.
type PdfTextStyle = ReturnType<typeof StyleSheet.create>[string];

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.5,
    color: "#1f2937",
  },
  header: {
    borderBottom: "2 solid #1e3a8a",
    paddingBottom: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a8a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#6b7280",
  },
  h1: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginTop: 14,
    marginBottom: 6,
    color: "#111827",
  },
  h2: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginTop: 12,
    marginBottom: 5,
    color: "#1e3a8a",
  },
  h3: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 10,
    marginBottom: 4,
    color: "#111827",
  },
  paragraph: {
    marginBottom: 8,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 4,
    paddingLeft: 8,
  },
  bullet: {
    width: 12,
    fontSize: 11,
  },
  itemText: {
    flex: 1,
  },
  hr: {
    borderBottom: "1 solid #d1d5db",
    marginVertical: 10,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    fontSize: 8,
    color: "#9ca3af",
    borderTop: "1 solid #e5e7eb",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

// ---------------------------------------------------------------------------
// Very small markdown renderer targeted at what Claude emits: headings (#-###),
// **bold** inline, bullets (- or *), numbered items (1.), and horizontal rules.
// Blank lines separate paragraphs. Everything else is text.
// ---------------------------------------------------------------------------

interface Segment {
  bold: boolean;
  text: string;
}

function parseInlineBold(text: string): Segment[] {
  const out: Segment[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push({ bold: false, text: text.slice(last, m.index) });
    out.push({ bold: true, text: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ bold: false, text: text.slice(last) });
  return out.length ? out : [{ bold: false, text }];
}

function InlineText({ text, style }: { text: string; style?: PdfTextStyle }) {
  const parts = parseInlineBold(text);
  return (
    <Text style={style}>
      {parts.map((p, i) =>
        p.bold ? (
          <Text key={i} style={{ fontFamily: "Helvetica-Bold" }}>
            {p.text}
          </Text>
        ) : (
          <Text key={i}>{p.text}</Text>
        )
      )}
    </Text>
  );
}

type Block =
  | { kind: "h"; level: 1 | 2 | 3; text: string }
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "hr" };

function parseMarkdownToBlocks(md: string): Block[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let paraBuf: string[] = [];
  let listBuf: string[] = [];
  let listKind: "ul" | "ol" | null = null;

  const flushPara = () => {
    if (paraBuf.length) {
      blocks.push({ kind: "p", text: paraBuf.join(" ").trim() });
      paraBuf = [];
    }
  };
  const flushList = () => {
    if (listBuf.length && listKind) {
      blocks.push({ kind: listKind, items: listBuf });
      listBuf = [];
      listKind = null;
    }
  };
  const flushAll = () => { flushPara(); flushList(); };

  for (const raw of lines) {
    const line = raw.trimEnd();

    // Headings
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      flushAll();
      const level = h[1].length as 1 | 2 | 3;
      blocks.push({ kind: "h", level, text: h[2].trim() });
      continue;
    }
    // HR
    if (/^\s*---\s*$/.test(line) || /^\s*\*\*\*\s*$/.test(line)) {
      flushAll();
      blocks.push({ kind: "hr" });
      continue;
    }
    // Ordered list
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ol) {
      flushPara();
      if (listKind && listKind !== "ol") flushList();
      listKind = "ol";
      listBuf.push(ol[1]);
      continue;
    }
    // Unordered list
    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    if (ul) {
      flushPara();
      if (listKind && listKind !== "ul") flushList();
      listKind = "ul";
      listBuf.push(ul[1]);
      continue;
    }
    // Blank line: paragraph / list break
    if (line.trim() === "") {
      flushAll();
      continue;
    }
    // Paragraph line — accumulate
    flushList();
    paraBuf.push(line.trim());
  }
  flushAll();
  return blocks;
}

// ---------------------------------------------------------------------------
// Reusable renderer for a chunk of markdown into <View> children.
// Used for both the handout body and the facilitator guide body.
// ---------------------------------------------------------------------------
function MarkdownBody({ md }: { md: string }) {
  const blocks = parseMarkdownToBlocks(md);
  return (
    <>
      {blocks.map((b, i) => {
        if (b.kind === "hr") return <View key={i} style={styles.hr} />;
        if (b.kind === "h") {
          const st = b.level === 1 ? styles.h1 : b.level === 2 ? styles.h2 : styles.h3;
          return <InlineText key={i} text={b.text} style={st} />;
        }
        if (b.kind === "p") {
          return <InlineText key={i} text={b.text} style={styles.paragraph} />;
        }
        return (
          <View key={i}>
            {b.items.map((item, j) => (
              <View key={j} style={styles.listItem}>
                <Text style={styles.bullet}>{b.kind === "ol" ? `${j + 1}.` : "•"}</Text>
                <InlineText text={item} style={styles.itemText} />
              </View>
            ))}
          </View>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// Handout PDF: title + date + handout markdown, small footer.
// ---------------------------------------------------------------------------
export function GroupTherapyHandoutPDF(props: {
  topic: string;
  sessionDate: string; // YYYY-MM-DD
  handoutMarkdown: string;
  facilityName?: string;
}) {
  return (
    <Document title={`${props.topic} — Participant Handout`}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{props.topic}</Text>
          <Text style={styles.subtitle}>
            Participant Handout · {props.sessionDate}
            {props.facilityName ? ` · ${props.facilityName}` : ""}
          </Text>
        </View>

        <MarkdownBody md={props.handoutMarkdown} />

        <View style={styles.footer} fixed>
          <Text>{props.topic}</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}

// ---------------------------------------------------------------------------
// Facilitator guide PDF: same shell, different content.
// ---------------------------------------------------------------------------
export function GroupTherapyGuidePDF(props: {
  topic: string;
  sessionDate: string;
  facilitatorGuide: string;
  facilityName?: string;
}) {
  return (
    <Document title={`${props.topic} — Facilitator Guide`}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{props.topic}</Text>
          <Text style={styles.subtitle}>
            Facilitator Guide · {props.sessionDate}
            {props.facilityName ? ` · ${props.facilityName}` : ""}
          </Text>
        </View>

        <MarkdownBody md={props.facilitatorGuide} />

        <View style={styles.footer} fixed>
          <Text>{props.topic} — Facilitator Guide</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
