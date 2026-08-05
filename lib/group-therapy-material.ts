/**
 * Group Therapy Material generation.
 *
 * Splits the work into TWO parallel Claude tool-use calls so we fit under
 * Amplify SSR's hard 28s CloudFront/Lambda ceiling:
 *
 *   Call A (meta):    topic + summary + facilitator guide + video queries (fast, ~10-12s)
 *   Call B (handout): the participant handout only                        (slower, ~15-18s)
 *
 * Both start at the same time via Promise.all; wall-clock ≈ max(A, B).
 * YouTube search then runs on the queries from call A. Result is assembled
 * and returned as a single GeneratedMaterial object.
 */

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";
import { youtubeSearchMany, type YouTubeSearchResult } from "./youtube-search";

/**
 * Read the ANTHROPIC_API_KEY from the project's .env file directly, bypassing
 * process.env. Some shells export a stale ANTHROPIC_API_KEY that Next.js
 * gives priority over `.env`; reading the file ensures we always use the
 * value the developer just saved.
 */
function readAnthropicKey(): string {
  const envPath = path.join(process.cwd(), ".env");
  try {
    const contents = fs.readFileSync(envPath, "utf-8");
    for (const line of contents.split(/\r?\n/)) {
      const m = /^\s*ANTHROPIC_API_KEY\s*=\s*"?([^"\r\n]+)"?\s*$/.exec(line);
      if (m) return m[1].trim();
    }
  } catch {
    /* fall through */
  }
  return process.env.ANTHROPIC_API_KEY || "";
}

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS_META = 1500;   // topic + summary + guide + 3 queries
const MAX_TOKENS_HANDOUT = 3500; // handout markdown only

const SHARED_CONSTRAINTS = `You are a licensed behavioral health clinician preparing a single group therapy session for adult residents in a Behavioral Health Residential Facility (BHRF). Residents commonly present with substance use disorders (alcohol, methamphetamine, cannabis) and co-occurring mental health conditions (MDD, GAD, PTSD, insomnia).

Constraints:
- Trauma-informed and non-shaming language throughout.
- Skills-based, evidence-informed (CBT, DBT, motivational interviewing, ACT, mindfulness, 12-step-compatible where appropriate).
- Avoid content that could re-traumatize (no explicit descriptions of substance use, violence, or self-harm).
- 8th-grade reading level.`;

const META_SYSTEM = SHARED_CONSTRAINTS + `\n\nYour job: pick ONE cohesive session topic and return topic, summary, a tight facilitator cheat sheet, and 3 YouTube search queries via the "emit_session_meta" tool.`;

const HANDOUT_SYSTEM = SHARED_CONSTRAINTS + `\n\nYour job: write a rich participant handout for the specified topic that can carry a full 60-minute group. Return via the "emit_handout" tool.`;

const META_TOOL = {
  name: "emit_session_meta",
  description: "Return the session topic, summary, facilitator guide, and video search queries.",
  input_schema: {
    type: "object" as const,
    properties: {
      topic: { type: "string", description: "Short punchy title, 3-8 words." },
      topic_summary: { type: "string", description: "1-2 sentence description of what the session covers." },
      facilitator_guide: {
        type: "string",
        description:
          "Markdown cheat sheet with sections: **Objectives** (2-3 bullets), **Opening (5 min)** (1-2 sentences), **Main Content (30 min)** (3-4 numbered steps, one-line talking points each), **Group Activity (15 min)** (brief), **Closing (10 min)** (brief), **Watch-outs** (2-3 bullets max).",
      },
      video_queries: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 3,
        description:
          "Exactly 3 specific YouTube search phrases, each tight enough to surface a short (<15 min) clinically relevant video. Include duration hint when useful.",
      },
    },
    required: ["topic", "topic_summary", "facilitator_guide", "video_queries"],
  },
};

const HANDOUT_TOOL = {
  name: "emit_handout",
  description: "Return the participant handout as markdown.",
  input_schema: {
    type: "object" as const,
    properties: {
      handout_markdown: {
        type: "string",
        description:
          "Markdown handout for participants, 3 pages when printed. Include all sections with real substance: Title + one-line subtitle; Why This Matters (2-3 sentences); Key Concepts (5 concepts, each with a bold heading, 2-3 sentences of plain-language explanation, and one brief relatable example); Self-Reflection (4 open-ended prompts with write-in blanks); Try This Week (a specific skill broken into 3-4 concrete steps with a short how-it-helps sentence); Discussion Questions (3 questions to bring to sponsor, therapist, or next group); Notes (a labeled space with 3-4 lines).",
      },
    },
    required: ["handout_markdown"],
  },
};

let anthropic: Anthropic | null = null;
function client(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey: readAnthropicKey() });
  }
  return anthropic;
}

export interface GeneratedMaterial {
  topic: string;
  topicSummary: string;
  facilitatorGuide: string;
  handoutMarkdown: string;
  videos: Array<YouTubeSearchResult | { query: string; error: string }>;
}

interface MetaResult {
  topic: string;
  topic_summary: string;
  facilitator_guide: string;
  video_queries: string[];
}

async function generateMeta(themeSeed: string | null): Promise<MetaResult> {
  const userMsg = themeSeed && themeSeed.trim()
    ? `Design today's group therapy session with the theme: "${themeSeed.trim()}". Vary the specific skill focus, even within a theme, don't repeat prior sessions.`
    : "Design today's group therapy session. Pick a topic that's practical and immediately useful in early residential recovery. Vary from the most obvious choices.";

  const c = client();
  const response = await c.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS_META,
    system: META_SYSTEM,
    tools: [META_TOOL],
    tool_choice: { type: "tool", name: META_TOOL.name },
    messages: [{ role: "user", content: userMsg }],
  });

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === META_TOOL.name
  );
  if (!toolUse) {
    throw new Error(`Meta call: no tool_use block (stop_reason: ${response.stop_reason})`);
  }
  const p = toolUse.input as Partial<MetaResult>;
  if (!p.topic || !p.facilitator_guide || !p.video_queries) {
    throw new Error("Meta call output missing required fields");
  }
  return {
    topic: p.topic,
    topic_summary: p.topic_summary || "",
    facilitator_guide: p.facilitator_guide,
    video_queries: p.video_queries,
  };
}

async function generateHandout(themeSeed: string | null): Promise<string> {
  // The handout call doesn't know the exact topic the meta call will pick, so
  // it works from the theme seed (or a neutral "pick a practical early-recovery
  // topic" instruction). In practice, both calls converge on similar territory
  // because they share the same system constraints; slight thematic variance
  // between the two is acceptable because they're both grounded in the same
  // theme seed.
  const userMsg = themeSeed && themeSeed.trim()
    ? `Write a participant handout for today's group therapy session on the theme: "${themeSeed.trim()}". Choose a specific practical skill within that theme.`
    : "Write a participant handout for today's group therapy session. Pick a topic that's practical and immediately useful in early residential recovery.";

  const c = client();
  const response = await c.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS_HANDOUT,
    system: HANDOUT_SYSTEM,
    tools: [HANDOUT_TOOL],
    tool_choice: { type: "tool", name: HANDOUT_TOOL.name },
    messages: [{ role: "user", content: userMsg }],
  });

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === HANDOUT_TOOL.name
  );
  if (!toolUse) {
    throw new Error(`Handout call: no tool_use block (stop_reason: ${response.stop_reason})`);
  }
  const p = toolUse.input as { handout_markdown?: string };
  if (!p.handout_markdown) {
    throw new Error("Handout call output missing handout_markdown");
  }
  return p.handout_markdown;
}

/**
 * Generate a full group therapy material set. `themeSeed` is an optional
 * user-provided steer (e.g., "boundaries", "cravings", "gratitude"). Runs
 * meta + handout Claude calls in parallel to stay under Amplify's 28s cap.
 */
export async function generateGroupTherapyMaterial(
  themeSeed?: string | null
): Promise<GeneratedMaterial> {
  const seed = themeSeed ?? null;

  // Kick off both Claude calls in parallel.
  const [meta, handoutMd] = await Promise.all([
    generateMeta(seed),
    generateHandout(seed),
  ]);

  // YouTube resolution can only start once meta returns.
  const queries = meta.video_queries.filter(q => typeof q === "string" && q.trim()).slice(0, 3);
  const resolved = await youtubeSearchMany(queries);
  const videos: GeneratedMaterial["videos"] = queries.map((q, i) => {
    const hit = resolved[i];
    return hit ?? { query: q, error: "No matching video found" };
  });

  return {
    topic: meta.topic.trim(),
    topicSummary: meta.topic_summary.trim(),
    facilitatorGuide: meta.facilitator_guide.trim(),
    handoutMarkdown: handoutMd.trim(),
    videos,
  };
}
