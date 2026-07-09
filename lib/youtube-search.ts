/**
 * YouTube Data API v3 — search helper for Group Therapy material generation.
 *
 * Given a search query, returns the best-matching public, embeddable, safe-search
 * video's URL + metadata. Filters aggressively for BHRF clinical use:
 *   - safeSearch=strict (no explicit content)
 *   - videoEmbeddable=true (must be playable in-app if we ever embed)
 *   - videoDuration=short|medium (< 20 min — good for group work)
 *   - relevanceLanguage=en
 *   - order=relevance
 */

const API_URL = "https://www.googleapis.com/youtube/v3/search";

export interface YouTubeSearchResult {
  query: string;
  videoId: string;
  url: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  publishedAt: string;
  description: string;
}

export class YouTubeSearchError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function isYouTubeConfigured(): boolean {
  return Boolean(process.env.YOUTUBE_API_KEY);
}

/**
 * Search YouTube for `query` and return the top clinical-safe match. Returns
 * null when no result passes filters — caller decides how to fall back.
 */
export async function youtubeSearchTop(
  query: string,
  opts: { duration?: "short" | "medium" | "any" } = {}
): Promise<YouTubeSearchResult | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new YouTubeSearchError(503, "YOUTUBE_API_KEY not configured");

  const params = new URLSearchParams({
    key: apiKey,
    q: query,
    type: "video",
    part: "snippet",
    maxResults: "5",
    safeSearch: "strict",
    videoEmbeddable: "true",
    videoSyndicated: "true",
    relevanceLanguage: "en",
    order: "relevance",
  });
  const duration = opts.duration ?? "medium";
  if (duration !== "any") params.set("videoDuration", duration);

  const res = await fetch(`${API_URL}?${params.toString()}`, { cache: "no-store" });
  const text = await res.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* leave null */ }

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "error" in data &&
      (data as { error: { message?: string } }).error?.message
        ? (data as { error: { message: string } }).error.message
        : `YouTube API error (${res.status})`;
    throw new YouTubeSearchError(res.status, message);
  }

  const items = (data as { items?: Array<{
    id?: { videoId?: string };
    snippet?: {
      title?: string;
      description?: string;
      channelTitle?: string;
      publishedAt?: string;
      thumbnails?: { high?: { url?: string }; medium?: { url?: string }; default?: { url?: string } };
    };
  }> })?.items ?? [];

  const first = items.find(i => i.id?.videoId);
  if (!first?.id?.videoId) return null;

  const s = first.snippet ?? {};
  const thumb =
    s.thumbnails?.high?.url ||
    s.thumbnails?.medium?.url ||
    s.thumbnails?.default?.url ||
    "";
  return {
    query,
    videoId: first.id.videoId,
    url: `https://www.youtube.com/watch?v=${first.id.videoId}`,
    title: s.title || "",
    channelTitle: s.channelTitle || "",
    thumbnail: thumb,
    publishedAt: s.publishedAt || "",
    description: s.description || "",
  };
}

/**
 * Convenience: resolve N queries in parallel. Failures for individual queries
 * become nulls (kept in the result array so caller can align with input order).
 */
export async function youtubeSearchMany(
  queries: string[]
): Promise<Array<YouTubeSearchResult | null>> {
  const results = await Promise.allSettled(
    queries.map(q => youtubeSearchTop(q))
  );
  return results.map(r => (r.status === "fulfilled" ? r.value : null));
}
