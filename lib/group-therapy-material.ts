/**
 * Group Therapy Material generation.
 *
 * Uses Claude to draft the topic, facilitator guide, participant handout, and
 * a set of YouTube search queries; then hits the YouTube Data API to resolve
 * each query to a real, embeddable, safe-search video. Returns a fully-resolved
 * material object ready to persist and render.
 */

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";
import { youtubeSearchMany, type YouTubeSearchResult } from "./youtube-search";

/**
 * Read the ANTHROPIC_API_KEY from the project's .env file directly, bypassing
 * process.env. Some shells (e.g. Claude Code's parent shell) export a stale
 * ANTHROPIC_API_KEY that Next.js gives priority over `.env`; reading the file
 * ensures we always use the value the developer just saved.
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

// Haiku 4.5 + a modest max_tokens keeps us well under Amplify SSR's ~30s
// end-to-end ceiling (Lambda + CloudFront). Sonnet 4.5 at 8000 tokens clocked
// ~50s and timed out; Haiku at 4000 tokens completes in ~10-15s.
const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 4000;

const SYSTEM_PROMPT = `You are a licensed behavioral health clinician preparing a single group therapy session for adult residents in a Behavioral Health Residential Facility (BHRF). Residents commonly present with substance use disorders (alcohol, methamphetamine, cannabis) and co-occurring mental health conditions (MDD, GAD, PTSD, insomnia).

Your job is to draft ONE cohesive group therapy session — topic, facilitator guide, participant handout, and video search queries — that a BHT-level staff member can run with minimal prep.

Constraints:
- Trauma-informed and non-shaming language throughout.
- Skills-based, evidence-informed (CBT, DBT, motivational interviewing, ACT, mindfulness, 12-step-compatible where appropriate).
- Avoid content that could re-traumatize (no explicit descriptions of substance use, violence, or self-harm).
- Handout must be usable by residents with an 8th-grade reading level and possible cognitive symptoms of early recovery.
- Do NOT hallucinate specific YouTube URLs — you only produce SEARCH QUERIES; a separate step resolves them to real videos.

Return ONLY strict JSON matching this schema. Keep prose tight — this must fit under a strict 25-second generation window in production.
{
  "topic": "short punchy title (3-8 words)",
  "topic_summary": "1-2 sentence description of what the session covers",
  "facilitator_guide": "markdown with sections: **Objectives** (2-3 bullets), **Opening (5 min)** (1-2 sentences), **Main Content (30 min)** (3-4 numbered steps, one-line talking points each), **Group Activity (15 min)** (brief), **Closing (10 min)** (brief), **Watch-outs** (2-3 bullets max)",
  "handout_markdown": "markdown handout for participants — title, 1-sentence 'why this matters', 3 key concepts explained in 1-2 sentences each, a short fill-in-the-blank reflection, one skill to practice this week, and a small 'notes' area. Fits on one page.",
  "video_queries": ["exactly 3 specific YouTube search phrases", "each tight enough to surface a short (<15 min) clinically relevant video", "include duration hint when useful (e.g. '5 minute')"]
}
No prose before or after the JSON. No markdown code fences.`;

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

/**
 * Generate a full group therapy material set. `themeSeed` is an optional
 * user-provided steer (e.g., "boundaries", "cravings", "gratitude").
 */
export async function generateGroupTherapyMaterial(
  themeSeed?: string | null
): Promise<GeneratedMaterial> {
  const userMsg =
    themeSeed && themeSeed.trim()
      ? `Design today's group therapy session with the theme: "${themeSeed.trim()}". Vary the specific skill focus — even within a theme, don't repeat prior sessions.`
      : "Design today's group therapy session. Pick a topic that's practical and immediately useful in early residential recovery. Vary from the most obvious choices.";

  const c = client();
  const response = await c.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMsg }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map(b => b.text)
    .join("\n")
    .trim();

  // Strip stray fences even though the prompt says no fences
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed: {
    topic?: string;
    topic_summary?: string;
    facilitator_guide?: string;
    handout_markdown?: string;
    video_queries?: string[];
  };
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(
      `Claude returned non-JSON output: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // Cap at 3 — each YouTube API call is a ~500ms roundtrip. 3 balances
  // usefulness with staying under the CloudFront ~30s timeout on Amplify.
  const queries = (parsed.video_queries || []).filter(q => typeof q === "string" && q.trim()).slice(0, 3);
  if (!parsed.topic || !parsed.facilitator_guide || !parsed.handout_markdown) {
    throw new Error("Claude output missing required fields (topic / facilitator_guide / handout_markdown)");
  }

  // Resolve every query to a real YouTube video (in parallel). Failed queries
  // come back as {query, error} so the UI can show what didn't resolve.
  const resolved = await youtubeSearchMany(queries);
  const videos: GeneratedMaterial["videos"] = queries.map((q, i) => {
    const hit = resolved[i];
    return hit ?? { query: q, error: "No matching video found" };
  });

  return {
    topic: parsed.topic.trim(),
    topicSummary: (parsed.topic_summary || "").trim(),
    facilitatorGuide: parsed.facilitator_guide.trim(),
    handoutMarkdown: parsed.handout_markdown.trim(),
    videos,
  };
}
