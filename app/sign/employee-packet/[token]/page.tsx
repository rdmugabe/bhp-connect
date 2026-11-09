"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle } from "lucide-react";
import { SECTIONS, type Field } from "@/lib/employee-packet-fields";

interface PacketInfo {
  id: string;
  employeeName: string;
  hireDate: string;
  facilityName: string;
  signed: boolean;
  formData: Record<string, string>;
}

export default function SignEmployeePacketPage({
  params,
}: {
  params: { token: string };
}) {
  const { token } = params;
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [packet, setPacket] = useState<PacketInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const drawing = useRef(false);
  const hasStroke = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/sign/employee-packet/${token}`);
        if (!res.ok) {
          setError("This signing link is invalid or has expired.");
        } else {
          const data = await res.json();
          setPacket(data.packet);
          setForm(data.packet.formData || {});
          if (data.packet.signed) setDone(true);
        }
      } catch {
        setError("Failed to load packet.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  function setupCanvas(c: HTMLCanvasElement) {
    const dpr = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * dpr;
    c.height = rect.height * dpr;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000";
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, rect.width, rect.height);
  }

  useEffect(() => {
    if (!canvasRef.current || loading || done) return;
    setupCanvas(canvasRef.current);
  }, [loading, done]);

  function pointerPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
  function handleDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = canvasRef.current!;
    c.setPointerCapture(e.pointerId);
    const ctx = c.getContext("2d")!;
    drawing.current = true;
    const p = pointerPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }
  function handleMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = pointerPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    hasStroke.current = true;
  }
  function handleUp() {
    drawing.current = false;
  }
  function clearSignature() {
    if (!canvasRef.current) return;
    setupCanvas(canvasRef.current);
    hasStroke.current = false;
  }

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    if (!canvasRef.current || !hasStroke.current) {
      toast({ title: "Please draw your signature first.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const dataUri = canvasRef.current.toDataURL("image/png");
      const res = await fetch(`/api/sign/employee-packet/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature: dataUri, formData: form }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast({ title: err.error || "Signing failed", variant: "destructive" });
        return;
      }
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error || !packet) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle>Link not available</CardTitle>
            <CardDescription>{error ?? "Unknown error"}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-lg w-full">
          <CardHeader className="items-center text-center">
            <CheckCircle className="h-10 w-10 text-green-600 mb-2" />
            <CardTitle>Signed</CardTitle>
            <CardDescription>
              Thank you, {packet.employeeName}. Your signature and responses have been
              recorded. {packet.facilityName} will finalize your packet.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-muted/30">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Employee Onboarding Packet</CardTitle>
            <CardDescription>
              <strong>{packet.facilityName}</strong> is asking you to complete your
              onboarding packet. Fill in each section below, then sign at the bottom.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Name</div>
                <div className="font-medium">{packet.employeeName}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Hire Date</div>
                <div className="font-medium">
                  {new Date(packet.hireDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {SECTIONS.map((section) => (
          <Card key={section.key}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              {section.description && <CardDescription>{section.description}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-4">
              {section.fields.map((f) => (
                <FormField key={f.key} field={f} value={form[f.key] || ""} onChange={(v) => updateField(f.key, v)} />
              ))}
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle>Signature</CardTitle>
            <CardDescription>
              Sign in the box below. Your signature will be applied to every signature line
              in the packet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border border-dashed rounded-md bg-white">
              <canvas
                ref={canvasRef}
                onPointerDown={handleDown}
                onPointerMove={handleMove}
                onPointerUp={handleUp}
                onPointerCancel={handleUp}
                style={{ width: "100%", height: 180, touchAction: "none", display: "block" }}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={clearSignature} disabled={submitting}>
                Clear
              </Button>
              <Button onClick={submit} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Submit Packet
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FormField({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = `f-${field.key}`;
  if (field.type === "textarea") {
    return (
      <div>
        <Label htmlFor={id}>{field.label}</Label>
        <Textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  if (field.type === "yesno") {
    return (
      <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
        <Label htmlFor={id}>{field.label}</Label>
        <Select value={value || ""} onValueChange={onChange}>
          <SelectTrigger id={id} className="w-32">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Yes">Yes</SelectItem>
            <SelectItem value="No">No</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }
  if (field.type === "choice" && field.options) {
    return (
      <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
        <Label htmlFor={id}>{field.label}</Label>
        <Select value={value || ""} onValueChange={onChange}>
          <SelectTrigger id={id} className="w-40">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }
  if (field.type === "initials") {
    return (
      <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
        <Label htmlFor={id} className="text-sm">
          {field.label}
        </Label>
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase().slice(0, 4))}
          placeholder="XX"
          className="w-20 text-center uppercase"
          maxLength={4}
        />
      </div>
    );
  }
  return (
    <div>
      <Label htmlFor={id}>{field.label}</Label>
      <Input
        id={id}
        type={field.type === "date" ? "date" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
      />
    </div>
  );
}
