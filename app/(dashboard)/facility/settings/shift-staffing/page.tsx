"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface StaffingEntry {
  id: string;
  shift: string;
  name: string;
  credentials: string | null;
  signatureKey: string | null;
  effectiveFrom: string;
}

const SHIFTS = ["AM", "PM", "NOC"] as const;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmtDate(d: string): string {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${m}/${dd}/${dt.getUTCFullYear()}`;
}

export default function ShiftStaffingPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<StaffingEntry[]>([]);

  const [shift, setShift] = useState<string>("AM");
  const [name, setName] = useState("");
  const [credentials, setCredentials] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(todayISO());

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/shift-staffing");
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd() {
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/shift-staffing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shift,
          name: name.trim(),
          credentials: credentials.trim() || null,
          effectiveFrom,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast({ title: err.error || "Failed to add", variant: "destructive" });
        return;
      }
      toast({ title: "Added" });
      setName("");
      setCredentials("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadSignature(id: string, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/shift-staffing/${id}/signature`, {
      method: "POST",
      body: fd,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast({ title: err.error || "Upload failed", variant: "destructive" });
      return;
    }
    toast({ title: "Signature uploaded" });
    await load();
  }

  async function handleDeleteSignature(id: string) {
    if (!confirm("Remove this signature image?")) return;
    const res = await fetch(`/api/shift-staffing/${id}/signature`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast({ title: err.error || "Delete failed", variant: "destructive" });
      return;
    }
    toast({ title: "Signature removed" });
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this staffing entry?")) return;
    const res = await fetch(`/api/shift-staffing/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast({ title: err.error || "Failed to delete", variant: "destructive" });
      return;
    }
    toast({ title: "Deleted" });
    await load();
  }

  const grouped: Record<string, StaffingEntry[]> = { AM: [], PM: [], NOC: [] };
  for (const e of entries) {
    (grouped[e.shift] ||= []).push(e);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/facility/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shift Staffing</h1>
          <p className="text-muted-foreground">
            Who covers AM, PM, and NOC shifts. The latest entry on or before a note&apos;s
            date is used as the default signature on progress notes.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Staffing Entry</CardTitle>
          <CardDescription>
            Add a new entry whenever the shift coverage changes. Keep historical
            entries so older notes still show the right signature.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="shift">Shift</Label>
              <Select value={shift} onValueChange={setShift}>
                <SelectTrigger id="shift">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHIFTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div>
              <Label htmlFor="credentials">Credentials</Label>
              <Input
                id="credentials"
                value={credentials}
                onChange={(e) => setCredentials(e.target.value)}
                placeholder="BHT"
              />
            </div>
            <div>
              <Label htmlFor="effectiveFrom">Effective From</Label>
              <Input
                id="effectiveFrom"
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleAdd} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Add Entry
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        SHIFTS.map((s) => (
          <Card key={s}>
            <CardHeader>
              <CardTitle>{s} Shift</CardTitle>
              <CardDescription>Most recent first.</CardDescription>
            </CardHeader>
            <CardContent>
              {grouped[s].length === 0 ? (
                <p className="text-sm text-muted-foreground">No entries yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2">Effective From</th>
                      <th className="py-2">Name</th>
                      <th className="py-2">Credentials</th>
                      <th className="py-2">Signature</th>
                      <th className="py-2 w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {grouped[s].map((e, idx) => (
                      <tr key={e.id} className="border-b last:border-0">
                        <td className="py-2">
                          {fmtDate(e.effectiveFrom)}
                          {idx === 0 && (
                            <span className="ml-2 text-xs text-green-600 font-medium">Current</span>
                          )}
                        </td>
                        <td className="py-2">{e.name}</td>
                        <td className="py-2">{e.credentials || "—"}</td>
                        <td className="py-2">
                          {e.signatureKey ? (
                            <div className="flex items-center gap-2">
                              <img
                                src={`/api/files/download?key=${encodeURIComponent(e.signatureKey)}`}
                                alt={`${e.name} signature`}
                                className="h-8 max-w-[160px] object-contain"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteSignature(e.id)}
                                title="Remove signature"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <label className="inline-flex items-center gap-1 text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                              <Upload className="h-4 w-4" />
                              Upload
                              <input
                                type="file"
                                accept="image/png,image/jpeg"
                                className="hidden"
                                onChange={(ev) => {
                                  const f = ev.target.files?.[0];
                                  if (f) handleUploadSignature(e.id, f);
                                  ev.target.value = "";
                                }}
                              />
                            </label>
                          )}
                        </td>
                        <td className="py-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(e.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
