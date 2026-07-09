"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  Mic,
  Square,
  Sparkles,
  FileText,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

/** Session slot → display label */
const SESSION_SLOTS: { code: "0930" | "1300" | "1630"; label: string }[] = [
  { code: "0930", label: "9:30 AM" },
  { code: "1300", label: "1:00 PM" },
  { code: "1630", label: "4:30 PM" },
];

const ABSENCE_REASONS = [
  "Sleepiness",
  "Appointment",
  "Not feeling well",
  "Personal reasons",
  "Refused to attend",
] as const;

interface ApiResident {
  intakeId: string;
  name: string;
  dob: string;
  admissionDate: string | null;
  dischargedAt: string | null;
  isDischarged: boolean;
}

interface ResidentEntry {
  intakeId: string;
  name: string;
  isDischarged: boolean;
  present: boolean;
  absenceReason: string;
  participation: string;
  behavior: string;
  overall: string;
  significantInfo: string;
  /** Raw dictation held only until Extract runs, then cleared. */
  _dictation: string;
}

interface GenerateResultRow {
  resident: string;
  session?: string;
  status: "ok" | "skipped" | "error";
  file?: string;
  kind?: string;
  drive?: string;
  reason?: string;
  error?: string;
}

/** M/D/YY */
function formatDateMDY(d: Date): string {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const yy = String(d.getFullYear()).slice(-2);
  return `${m}/${day}/${yy}`;
}

/** ISO YYYY-MM-DD for the <input type="date"> */
function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isoToMDY(iso: string): string {
  const [y, m, d] = iso.split("-").map((s) => parseInt(s, 10));
  const yy = String(y).slice(-2);
  return `${m}/${d}/${yy}`;
}

// ---------------------------------------------------------------------------
// Web Speech API hook — falls back to null when unsupported. Returns raw
// interim + final transcript concatenated so staff can watch it grow.
// ---------------------------------------------------------------------------

// Minimal shim — the Web Speech API is not in the default TS lib.
interface WebSpeechResult { transcript: string }
interface WebSpeechEvent { results: ArrayLike<ArrayLike<WebSpeechResult>> }
interface WebSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((evt: WebSpeechEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type WebSpeechCtor = new () => WebSpeechRecognition;

function useSpeechRecognition() {
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<WebSpeechRecognition | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const onResultRef = useRef<((text: string) => void) | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as {
      SpeechRecognition?: WebSpeechCtor;
      webkitSpeechRecognition?: WebSpeechCtor;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;
    setSupported(true);
    const r = new Ctor();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-US";
    r.onresult = (evt: WebSpeechEvent) => {
      let text = "";
      for (let i = 0; i < evt.results.length; i++) {
        text += evt.results[i][0].transcript;
      }
      onResultRef.current?.(text);
    };
    r.onend = () => setActiveKey(null);
    recognitionRef.current = r;
    return () => {
      try { r.stop(); } catch { /* ignore */ }
    };
  }, []);

  const start = useCallback((key: string, onText: (text: string) => void) => {
    const r = recognitionRef.current;
    if (!r) return;
    if (activeKey && activeKey !== key) {
      try { r.stop(); } catch { /* ignore */ }
    }
    onResultRef.current = onText;
    try {
      r.start();
      setActiveKey(key);
    } catch {
      // Some browsers throw if already started
    }
  }, [activeKey]);

  const stop = useCallback(() => {
    const r = recognitionRef.current;
    if (!r) return;
    try { r.stop(); } catch { /* ignore */ }
    setActiveKey(null);
    onResultRef.current = null;
  }, []);

  return { supported, activeKey, start, stop };
}

// ---------------------------------------------------------------------------
// Main wizard
// ---------------------------------------------------------------------------
export function GroupNotesWizard({ embedded = false }: { embedded?: boolean } = {}) {
  const { toast } = useToast();
  const speech = useSpeechRecognition();

  // Step 1 — basics
  const [staffName, setStaffName] = useState("");
  const [dateISO, setDateISO] = useState<string>(todayISO());
  const [sessions, setSessions] = useState<Set<string>>(new Set(SESSION_SLOTS.map((s) => s.code)));

  // Step 2 — group dictation + summary/topic
  const [groupDictation, setGroupDictation] = useState("");
  const [groupTopic, setGroupTopic] = useState("");
  const [groupSummary, setGroupSummary] = useState("");

  // Residents
  const [includeDischarged, setIncludeDischarged] = useState(false);
  const [loadingResidents, setLoadingResidents] = useState(true);
  const [residents, setResidents] = useState<ResidentEntry[]>([]);

  // Actions
  const [extracting, setExtracting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<GenerateResultRow[] | null>(null);
  const [driveEnabled, setDriveEnabled] = useState<boolean | null>(null);

  const loadResidents = useCallback(async (withDischarged: boolean) => {
    setLoadingResidents(true);
    try {
      const url = `/api/group-notes/residents${withDischarged ? "?includeDischarged=1" : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const data: { residents: ApiResident[] } = await res.json();
      setResidents((prev) => {
        // Preserve existing per-resident form state where names match, so
        // toggling the discharged switch doesn't wipe typed comments.
        const prevByName = new Map(prev.map((r) => [r.name, r]));
        return data.residents.map<ResidentEntry>((r) => {
          const existing = prevByName.get(r.name);
          if (existing) return { ...existing, isDischarged: r.isDischarged, intakeId: r.intakeId };
          return {
            intakeId: r.intakeId,
            name: r.name,
            isDischarged: r.isDischarged,
            present: true,
            absenceReason: "",
            participation: "",
            behavior: "",
            overall: "",
            significantInfo: "",
            _dictation: "",
          };
        });
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not load residents",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoadingResidents(false);
    }
  }, [toast]);

  useEffect(() => { loadResidents(includeDischarged); }, [includeDischarged, loadResidents]);

  const toggleSession = (code: string) => {
    setSessions((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const updateResident = (idx: number, patch: Partial<ResidentEntry>) => {
    setResidents((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  /** Wipe ALL dictation transcripts from memory. Called after successful
   *  extract AND after generate — matches the "delete immediately" requirement. */
  const purgeTranscripts = useCallback(() => {
    setGroupDictation("");
    setResidents((prev) => prev.map((r) => ({ ...r, _dictation: "" })));
  }, []);

  const canExtract =
    (groupDictation.trim().length > 0 ||
      residents.some((r) => r._dictation.trim().length > 0)) && !extracting;

  const handleExtract = async () => {
    if (!canExtract) return;
    setExtracting(true);
    try {
      const payload = {
        summary_transcript: groupDictation,
        resident_transcripts: Object.fromEntries(
          residents.filter((r) => r._dictation.trim()).map((r) => [r.name, r._dictation])
        ),
        resident_names: residents.map((r) => r.name),
      };
      const res = await fetch("/api/group-notes/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Extract failed (${res.status})`);

      if (data.group_topic && !groupTopic) setGroupTopic(String(data.group_topic));
      if (data.group_summary && !groupSummary) setGroupSummary(String(data.group_summary));

      if (Array.isArray(data.residents)) {
        setResidents((prev) => {
          const patches = new Map<string, Partial<ResidentEntry>>();
          for (const item of data.residents as Array<Record<string, unknown>>) {
            const name = String(item.name || "");
            if (!name) continue;
            const p: Partial<ResidentEntry> = {};
            if (typeof item.present === "boolean") p.present = item.present;
            if (typeof item.absence_reason === "string" && item.absence_reason) p.absenceReason = item.absence_reason;
            if (typeof item.participation === "string" && item.participation) p.participation = item.participation;
            if (typeof item.behavior === "string" && item.behavior) p.behavior = item.behavior;
            if (typeof item.overall === "string" && item.overall) p.overall = item.overall;
            if (typeof item.significant_info === "string" && item.significant_info) p.significantInfo = item.significant_info;
            patches.set(name, p);
          }
          return prev.map((r) => ({ ...r, ...(patches.get(r.name) ?? {}) }));
        });
      }
      purgeTranscripts();
      toast({ title: "Extracted", description: "Fields populated. Review and edit before generating." });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Extraction failed",
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setExtracting(false);
    }
  };

  const normalizedStaffName = useMemo(() => {
    const name = staffName.trim().replace(/,$/, "").trim();
    if (!name) return "";
    if (name.toLowerCase().endsWith("bht")) return name;
    return `${name}, BHT`;
  }, [staffName]);

  const canGenerate = normalizedStaffName && sessions.size > 0 && residents.length > 0 && !generating;

  /** Any dictation the user recorded but never extracted. If truthy, generating
   *  now would silently discard the transcript — we warn before that happens. */
  const hasUnusedDictation = useMemo(() => {
    if (groupDictation.trim()) return true;
    return residents.some((r) => r._dictation.trim());
  }, [groupDictation, residents]);

  const handleGenerate = async () => {
    if (!canGenerate) return;

    // Guard against the "dictated but never clicked Extract" foot-gun.
    if (hasUnusedDictation) {
      const proceed = window.confirm(
        "You recorded dictation but haven't clicked Extract yet.\n\n" +
          "If you Generate now, the transcript won't be used and the notes " +
          "will fall back to default topic/observations.\n\n" +
          "Click Cancel to go back and click Extract first, or OK to generate anyway."
      );
      if (!proceed) return;
    }
    // Also warn if topic is blank — Python defaults to "Group Session" which
    // usually isn't what staff intended.
    if (!groupTopic.trim()) {
      const proceed = window.confirm(
        "Group topic is empty. The generated notes will show " +
          '"Group Session — Part N of 3" as the topic.\n\n' +
          "Continue anyway?"
      );
      if (!proceed) return;
    }

    setGenerating(true);
    setResults(null);
    try {
      const payload = {
        date_str: isoToMDY(dateISO),
        staff_name: staffName,
        group_topic: groupTopic,
        group_summary: groupSummary,
        sessions: Array.from(sessions),
        residents: residents.map((r) => ({
          name: r.name,
          present: r.present,
          absence_reason: r.absenceReason,
          participation: r.participation,
          behavior: r.behavior,
          overall: r.overall,
          significant_info: r.significantInfo,
        })),
      };
      const res = await fetch("/api/group-notes/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Generate failed (${res.status})`);

      setResults(data.results ?? []);
      setDriveEnabled(Boolean(data.drive_enabled));
      purgeTranscripts();
      toast({
        title: `Generated ${data.count_ok ?? 0} document${(data.count_ok ?? 0) === 1 ? "" : "s"}`,
        description: data.drive_enabled ? "Uploaded to Google Drive." : "Drive upload not configured — files were saved locally on the service.",
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

  const startRecord = (key: string, onText: (t: string) => void) => {
    if (!speech.supported) {
      toast({
        variant: "destructive",
        title: "Voice input unavailable",
        description: "Your browser does not support speech recognition. Type into the box instead.",
      });
      return;
    }
    speech.start(key, onText);
  };

  return (
    <div className={embedded ? "space-y-6" : "max-w-4xl mx-auto p-6 space-y-6"}>
      {/* Header (skip when embedded — parent page shows its own) */}
      {!embedded && (
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Group Therapy</h1>
            <p className="text-sm text-muted-foreground">
              Dictate observations, then generate one .docx per resident per session. Files upload to Google Drive.
            </p>
          </div>
          <Badge variant="secondary">{residents.length} resident{residents.length === 1 ? "" : "s"}</Badge>
        </div>
      )}
      {embedded && (
        <div className="flex justify-end">
          <Badge variant="secondary">{residents.length} resident{residents.length === 1 ? "" : "s"}</Badge>
        </div>
      )}

      {/* Step 1 — Basics */}
      <Card>
        <CardHeader>
          <CardTitle>Session basics</CardTitle>
          <CardDescription>Signer name gets &quot;, BHT&quot; appended automatically.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="staff-name">Staff name</Label>
              <Input
                id="staff-name"
                placeholder="e.g. Richard Mugabe"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
              />
              {normalizedStaffName && (
                <p className="text-xs text-muted-foreground">Signs as: <span className="font-medium">{normalizedStaffName}</span></p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">Group date</Label>
              <Input
                id="date"
                type="date"
                value={dateISO}
                onChange={(e) => setDateISO(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Sessions to fill out</Label>
            <div className="flex flex-wrap gap-2">
              {SESSION_SLOTS.map((s) => {
                const on = sessions.has(s.code);
                return (
                  <button
                    key={s.code}
                    type="button"
                    onClick={() => toggleSession(s.code)}
                    className={
                      "px-3 py-1.5 rounded-full border text-sm transition-colors " +
                      (on
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50")
                    }
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2 — Group dictation */}
      <Card>
        <CardHeader>
          <CardTitle>Group summary dictation (optional)</CardTitle>
          <CardDescription>
            Speak or paste what the group covered. Click Extract to populate Topic/Summary and per-resident fields.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            {speech.activeKey === "group" ? (
              <Button size="sm" variant="destructive" onClick={speech.stop}>
                <Square className="h-3.5 w-3.5 mr-1" /> Stop
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled={!speech.supported || speech.activeKey !== null}
                onClick={() => startRecord("group", setGroupDictation)}
              >
                <Mic className="h-3.5 w-3.5 mr-1" /> Record group summary
              </Button>
            )}
            {!speech.supported && (
              <span className="text-xs text-muted-foreground">(Voice unsupported — type below)</span>
            )}
          </div>
          <Textarea
            value={groupDictation}
            onChange={(e) => setGroupDictation(e.target.value)}
            placeholder="What the group covered — topic, main points, tone…"
            rows={4}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="topic">Group topic</Label>
              <Input
                id="topic"
                placeholder="e.g. Setting Boundaries"
                value={groupTopic}
                onChange={(e) => setGroupTopic(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="summary">Group summary</Label>
              <Textarea
                id="summary"
                rows={3}
                value={groupSummary}
                onChange={(e) => setGroupSummary(e.target.value)}
                placeholder="Will be split into Part 1/2/3 across the day."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 3 — Residents */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Residents</CardTitle>
              <CardDescription>
                Per-resident dictation is optional. Empty text-fields fall back to the pooled comment templates.
              </CardDescription>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={includeDischarged}
                onCheckedChange={(v) => setIncludeDischarged(Boolean(v))}
              />
              Include discharged
            </label>
          </div>
        </CardHeader>
        <CardContent>
          {loadingResidents ? (
            <div className="p-6 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : residents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No residents to show. {includeDischarged ? "" : "Try enabling “Include discharged.”"}
            </p>
          ) : (
            <div className="space-y-4">
              {residents.map((r, i) => (
                <ResidentBlock
                  key={r.intakeId}
                  resident={r}
                  onChange={(patch) => updateResident(i, patch)}
                  recording={speech.activeKey === `res-${i}`}
                  anyRecording={speech.activeKey !== null}
                  supported={speech.supported}
                  onStartRecord={() =>
                    startRecord(`res-${i}`, (text) => updateResident(i, { _dictation: text }))
                  }
                  onStopRecord={speech.stop}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="sticky bottom-0 -mx-6 px-6 py-3 bg-white/95 backdrop-blur border-t flex flex-wrap items-center gap-3">
        <Button onClick={handleExtract} disabled={!canExtract} variant="outline">
          {extracting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
          Extract from recordings
        </Button>
        <Button onClick={handleGenerate} disabled={!canGenerate}>
          {generating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileText className="h-4 w-4 mr-1" />}
          Generate documents
        </Button>
        <Button variant="ghost" size="sm" onClick={purgeTranscripts} disabled={!groupDictation && !residents.some((r) => r._dictation)}>
          <RotateCcw className="h-4 w-4 mr-1" /> Clear transcripts
        </Button>
        <div className="ml-auto text-xs text-muted-foreground">
          {normalizedStaffName ? `Signing as ${normalizedStaffName}` : "Enter staff name to sign"}
        </div>
      </div>

      {/* Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              {driveEnabled === false ? "Drive upload was not configured — files were saved on the service host." : null}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-72 overflow-y-auto bg-slate-900 text-slate-100 rounded-md p-3 font-mono text-xs space-y-1">
              {results.map((row, i) => {
                const icon =
                  row.status === "ok" ? (
                    <CheckCircle2 className="inline h-3.5 w-3.5 text-emerald-400 mr-1" />
                  ) : row.status === "error" ? (
                    <AlertCircle className="inline h-3.5 w-3.5 text-red-400 mr-1" />
                  ) : (
                    <span className="inline-block w-3.5 mr-1 text-slate-400">·</span>
                  );
                return (
                  <div key={i}>
                    {icon}
                    <span className="text-slate-300">{row.resident}</span>
                    {row.session ? <span className="text-slate-500"> · {row.session}</span> : null}
                    {row.file ? <span className="text-slate-400"> · {row.file}</span> : null}
                    {row.drive ? <span className="text-slate-500"> · drive: {row.drive}</span> : null}
                    {row.reason ? <span className="text-slate-500"> · {row.reason}</span> : null}
                    {row.error ? <span className="text-red-300"> · {row.error}</span> : null}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Per-resident row
// ---------------------------------------------------------------------------
function ResidentBlock({
  resident,
  onChange,
  recording,
  anyRecording,
  supported,
  onStartRecord,
  onStopRecord,
}: {
  resident: ResidentEntry;
  onChange: (patch: Partial<ResidentEntry>) => void;
  recording: boolean;
  anyRecording: boolean;
  supported: boolean;
  onStartRecord: () => void;
  onStopRecord: () => void;
}) {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{resident.name}</span>
          {resident.isDischarged && <Badge variant="outline">Discharged</Badge>}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChange({ present: true })}
            className={
              "px-3 py-1 rounded-full text-xs border transition-colors " +
              (resident.present
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-300")
            }
          >
            Present
          </button>
          <button
            type="button"
            onClick={() => onChange({ present: false })}
            className={
              "px-3 py-1 rounded-full text-xs border transition-colors " +
              (!resident.present
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-300")
            }
          >
            Absent
          </button>
        </div>
      </div>

      {!resident.present ? (
        <div className="space-y-1.5">
          <Label>Absence reason</Label>
          <select
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={resident.absenceReason}
            onChange={(e) => onChange({ absenceReason: e.target.value })}
          >
            <option value="">Select a reason…</option>
            {ABSENCE_REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            {recording ? (
              <Button size="sm" variant="destructive" onClick={onStopRecord}>
                <Square className="h-3.5 w-3.5 mr-1" /> Stop
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled={!supported || (anyRecording && !recording)}
                onClick={onStartRecord}
              >
                <Mic className="h-3.5 w-3.5 mr-1" /> Record observations
              </Button>
            )}
            {resident._dictation && (
              <span className="text-xs text-muted-foreground">
                Transcript ready — click Extract to populate fields
              </span>
            )}
          </div>
          {resident._dictation && (
            <Textarea
              value={resident._dictation}
              onChange={(e) => onChange({ _dictation: e.target.value })}
              rows={2}
              className="text-xs"
              placeholder="Live transcript…"
            />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Textarea
              placeholder="Participation"
              value={resident.participation}
              onChange={(e) => onChange({ participation: e.target.value })}
              rows={2}
            />
            <Textarea
              placeholder="Behavior"
              value={resident.behavior}
              onChange={(e) => onChange({ behavior: e.target.value })}
              rows={2}
            />
            <Textarea
              placeholder="Overall"
              value={resident.overall}
              onChange={(e) => onChange({ overall: e.target.value })}
              rows={2}
            />
            <Textarea
              placeholder="Significant info"
              value={resident.significantInfo}
              onChange={(e) => onChange({ significantInfo: e.target.value })}
              rows={2}
            />
          </div>
        </>
      )}
    </div>
  );
}
