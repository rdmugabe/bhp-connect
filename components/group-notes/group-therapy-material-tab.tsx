"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  Sparkles,
  RefreshCcw,
  Download,
  Youtube,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

interface VideoHit {
  query: string;
  videoId: string;
  url: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  publishedAt: string;
  description: string;
}
interface VideoFail {
  query: string;
  error: string;
}
type VideoEntry = VideoHit | VideoFail;

interface MaterialRecord {
  id: string;
  sessionDate: string;
  topic: string;
  facilitatorGuide: string;
  handoutMarkdown: string;
  videos: VideoEntry[];
  themeSeed: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Today at Arizona (America/Phoenix, UTC−7 — no DST), formatted YYYY-MM-DD.
 *  Matches how the server decides "today" for purge + default date. */
function todayISO(): string {
  return new Date().toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Phoenix",
  });
}

function isVideoHit(v: VideoEntry): v is VideoHit {
  return "url" in v;
}

export function GroupTherapyMaterialTab() {
  const { toast } = useToast();
  const [dateISO, setDateISO] = useState<string>(todayISO());
  const [themeSeed, setThemeSeed] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);
  const [material, setMaterial] = useState<MaterialRecord | null>(null);

  const loadForDate = useCallback(
    async (date: string) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/group-notes/material?date=${date}`);
        if (!res.ok) throw new Error(`Failed (${res.status})`);
        const data: { material: MaterialRecord | null } = await res.json();
        setMaterial(data.material);
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Could not load material",
          description: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => { loadForDate(dateISO); }, [dateISO, loadForDate]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/group-notes/material", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          date: dateISO,
          themeSeed: themeSeed.trim() || null,
        }),
      });
      // Read raw body first so we can surface non-JSON errors (empty body from
      // Lambda timeout, HTML gateway error page, etc.) instead of a cryptic
      // "Failed to execute 'json' on 'Response'" message.
      const rawText = await res.text();
      let data: { material?: MaterialRecord; error?: string } | null = null;
      if (rawText) {
        try { data = JSON.parse(rawText); } catch { /* fall through */ }
      }
      if (!res.ok || !data) {
        const fallback =
          !rawText
            ? `Server returned no body (${res.status}). This usually means the request timed out.`
            : `Generate failed (${res.status}): ${rawText.slice(0, 200)}`;
        throw new Error(data?.error || fallback);
      }
      setMaterial(data.material ?? null);
      toast({
        title: material ? "Regenerated" : "Material ready",
        description: data.material ? `Topic: ${data.material.topic}` : undefined,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Generate failed",
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setGenerating(false);
    }
  };

  const [downloading, setDownloading] = useState<"handout" | "guide" | null>(null);

  const handleDownloadPdf = async (kind: "handout" | "guide") => {
    if (!material) return;
    setDownloading(kind);
    try {
      const res = await fetch(
        `/api/group-notes/material/pdf?date=${dateISO}&kind=${kind}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `PDF failed (${res.status})`);
      }
      const blob = await res.blob();
      // Prefer the filename the server sent in Content-Disposition
      const cd = res.headers.get("content-disposition") || "";
      const m = /filename="([^"]+)"/.exec(cd);
      const fallback = `${material.topic.toLowerCase().replace(/[^\w]+/g, "-")}-${kind}-${dateISO}.pdf`;
      const filename = m ? m[1] : fallback;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Download failed",
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Generate Session Material</CardTitle>
          <CardDescription>
            One click, and Claude drafts today&apos;s topic, facilitator guide, participant handout, and short YouTube videos matched to the topic. Regenerating replaces the day&apos;s material.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="mat-date">Session date</Label>
              <Input
                id="mat-date"
                type="date"
                value={dateISO}
                onChange={(e) => setDateISO(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mat-seed">Theme (optional)</Label>
              <Input
                id="mat-seed"
                placeholder="e.g. boundaries, grief, cravings"
                value={themeSeed}
                onChange={(e) => setThemeSeed(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleGenerate} disabled={generating || loading}>
              {generating ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : material ? (
                <RefreshCcw className="h-4 w-4 mr-1" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1" />
              )}
              {material
                ? "Regenerate Group Therapy Material"
                : "Generate Group Therapy Material for today"}
            </Button>
            {loading && (
              <span className="inline-flex items-center text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                Loading…
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {!loading && !material && (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No material generated for {dateISO} yet. Click <span className="font-medium">Generate</span> above.
          </CardContent>
        </Card>
      )}

      {material && (
        <>
          {/* Topic */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">{material.topic}</CardTitle>
                  <CardDescription>
                    Session date: {material.sessionDate.slice(0, 10)}
                    {material.themeSeed ? ` · theme: ${material.themeSeed}` : ""}
                  </CardDescription>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadPdf("guide")}
                    disabled={downloading !== null}
                  >
                    {downloading === "guide" ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5 mr-1" />
                    )}
                    Guide PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadPdf("handout")}
                    disabled={downloading !== null}
                  >
                    {downloading === "handout" ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5 mr-1" />
                    )}
                    Handout PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Videos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Youtube className="h-5 w-5 text-red-600" />
                Supporting videos
              </CardTitle>
              <CardDescription>Safe-search, embeddable, short-to-medium length. Preview before showing to the group.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {material.videos.length === 0 && (
                <p className="text-sm text-muted-foreground">No videos returned.</p>
              )}
              {material.videos.map((v, i) => (
                <VideoCard key={i} video={v} />
              ))}
            </CardContent>
          </Card>

          {/* Facilitator Guide */}
          <Card>
            <CardHeader>
              <CardTitle>Facilitator guide</CardTitle>
            </CardHeader>
            <CardContent>
              <MarkdownBlock md={material.facilitatorGuide} />
            </CardContent>
          </Card>

          {/* Handout */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Participant handout</CardTitle>
                  <CardDescription>Download the PDF, print, and hand one to each participant.</CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleDownloadPdf("handout")}
                  disabled={downloading !== null}
                >
                  {downloading === "handout" ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5 mr-1" />
                  )}
                  Download PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <MarkdownBlock md={material.handoutMarkdown} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Video card
// ---------------------------------------------------------------------------
function VideoCard({ video }: { video: VideoEntry }) {
  if (!isVideoHit(video)) {
    return (
      <div className="rounded-lg border p-3 bg-amber-50 border-amber-200 flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium">No video found</p>
          <p className="text-xs text-muted-foreground">
            Search query: <span className="font-mono">{video.query}</span>
          </p>
          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(video.query)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary underline inline-flex items-center gap-1 mt-1"
          >
            Search YouTube manually <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 rounded-lg border p-2 hover:bg-slate-50 transition-colors"
    >
      {video.thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={video.thumbnail}
          alt=""
          className="w-32 h-20 object-cover rounded shrink-0"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="font-medium text-sm line-clamp-2">{video.title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{video.channelTitle}</div>
        <div className="text-xs text-muted-foreground mt-1 truncate">
          Query: <span className="font-mono">{video.query}</span>
        </div>
        <div className="text-xs text-primary mt-1 inline-flex items-center gap-1">
          Open on YouTube <ExternalLink className="h-3 w-3" />
        </div>
      </div>
    </a>
  );
}

// ---------------------------------------------------------------------------
// Minimal markdown renderer — enough for headings, bold, italic, lists, hr.
// Safe: escapes HTML first, then applies inline patterns.
// ---------------------------------------------------------------------------
function MarkdownBlock({ md }: { md: string }) {
  return (
    <div
      className="prose prose-sm max-w-none text-slate-800"
      dangerouslySetInnerHTML={{ __html: markdownToHtml(md) }}
    />
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function markdownToHtml(md: string): string {
  const escaped = escapeHtml(md);
  const lines = escaped.split(/\r?\n/);
  const out: string[] = [];
  let inUL = false, inOL = false;

  function closeLists() {
    if (inUL) { out.push("</ul>"); inUL = false; }
    if (inOL) { out.push("</ol>"); inOL = false; }
  }

  for (const rawLine of lines) {
    let line = rawLine;
    // Headings
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      closeLists();
      const level = h[1].length;
      out.push(`<h${level}>${inlineMd(h[2])}</h${level}>`);
      continue;
    }
    // Horizontal rule
    if (/^\s*---\s*$/.test(line)) {
      closeLists();
      out.push("<hr/>");
      continue;
    }
    // Ordered list
    const ol = line.match(/^\s*(\d+)\.\s+(.*)$/);
    if (ol) {
      if (!inOL) { closeLists(); out.push("<ol>"); inOL = true; }
      out.push(`<li>${inlineMd(ol[2])}</li>`);
      continue;
    }
    // Unordered list
    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    if (ul) {
      if (!inUL) { closeLists(); out.push("<ul>"); inUL = true; }
      out.push(`<li>${inlineMd(ul[1])}</li>`);
      continue;
    }
    // Blank line
    if (/^\s*$/.test(line)) {
      closeLists();
      continue;
    }
    // Paragraph
    closeLists();
    out.push(`<p>${inlineMd(line)}</p>`);
  }
  closeLists();
  return out.join("\n");
}

function inlineMd(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}
