"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
import { ArrowLeft, Save, Loader2, User, Upload, Trash2, PenLine } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface FacilitySettings {
  id: string;
  name: string;
  defaultAdminName: string | null;
  defaultAdminSignature: string | null;
}

export default function OnboardingSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [deletingSignature, setDeletingSignature] = useState(false);
  const [facility, setFacility] = useState<FacilitySettings | null>(null);
  const [defaultAdminName, setDefaultAdminName] = useState("");
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/facility/settings");
        if (response.ok) {
          const data = await response.json();
          setFacility(data.facility);
          setDefaultAdminName(data.facility.defaultAdminName || "");

          // If there's a signature, get the signed URL
          if (data.facility.defaultAdminSignature) {
            const signedUrlResponse = await fetch(
              `/api/files/download?key=${encodeURIComponent(data.facility.defaultAdminSignature)}`
            );
            if (signedUrlResponse.ok) {
              const blob = await signedUrlResponse.blob();
              setSignatureUrl(URL.createObjectURL(blob));
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/facility/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          defaultAdminName: defaultAdminName.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      const data = await response.json();
      setFacility(data.facility);

      toast({
        title: "Settings Saved",
        description: "Onboarding settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PNG or JPG image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Maximum file size is 2MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingSignature(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/facility/settings/signature", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload signature");
      }

      // Show the uploaded image
      setSignatureUrl(URL.createObjectURL(file));

      toast({
        title: "Signature Uploaded",
        description: "Your signature has been saved successfully.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload signature",
        variant: "destructive",
      });
    } finally {
      setUploadingSignature(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteSignature = async () => {
    setDeletingSignature(true);
    try {
      const response = await fetch("/api/facility/settings/signature", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete signature");
      }

      setSignatureUrl(null);

      toast({
        title: "Signature Removed",
        description: "Your signature has been removed.",
      });
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete signature",
        variant: "destructive",
      });
    } finally {
      setDeletingSignature(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
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
          <h1 className="text-3xl font-bold tracking-tight">
            Onboarding Settings
          </h1>
          <p className="text-muted-foreground">
            Configure default settings for onboarding packets
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Default Staff/Administrator Name
          </CardTitle>
          <CardDescription>
            Set the default name that will be pre-filled in all staff and
            administrator signature sections across onboarding documents.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="defaultAdminName">Staff/Administrator Name</Label>
            <Input
              id="defaultAdminName"
              placeholder="Enter staff or administrator name"
              value={defaultAdminName}
              onChange={(e) => setDefaultAdminName(e.target.value)}
              className="max-w-md"
            />
            <p className="text-sm text-muted-foreground">
              This name will be automatically added to all staff/administrator
              signature sections when generating resident and employee onboarding packets.
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Name
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenLine className="h-5 w-5" />
            Default Signature Image
          </CardTitle>
          <CardDescription>
            Upload a signature image that will be automatically added to the
            staff/administrator signature section of onboarding packets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {signatureUrl ? (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50 max-w-md">
                <p className="text-sm text-muted-foreground mb-2">Current Signature:</p>
                <div className="bg-white border rounded p-2">
                  <img
                    src={signatureUrl}
                    alt="Signature"
                    className="max-h-24 object-contain"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingSignature}
                >
                  {uploadingSignature ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Replace Signature
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteSignature}
                  disabled={deletingSignature}
                >
                  {deletingSignature ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove Signature
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center max-w-md">
                <PenLine className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  No signature uploaded yet. Upload a PNG or JPG image of your signature.
                </p>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingSignature}
                >
                  {uploadingSignature ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Signature
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Supported formats: PNG, JPG. Maximum size: 2MB.
                For best results, use a signature with a transparent or white background.
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleSignatureUpload}
            className="hidden"
          />
        </CardContent>
      </Card>
    </div>
  );
}
