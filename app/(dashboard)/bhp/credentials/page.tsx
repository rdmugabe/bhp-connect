"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { credentialSchema, type CredentialInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { Plus, ExternalLink, Trash2 } from "lucide-react";
import { formatDate, getExpirationStatus, getComplianceColor } from "@/lib/utils";

interface Credential {
  id: string;
  type: string;
  name: string;
  fileUrl: string;
  expiresAt: string | null;
  isPublic: boolean;
  uploadedAt: string;
}

export default function CredentialsPage() {
  const { toast } = useToast();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<CredentialInput>({
    resolver: zodResolver(credentialSchema),
    defaultValues: {
      type: "LICENSE",
      name: "",
      expiresAt: "",
      isPublic: true,
    },
  });

  useEffect(() => {
    fetchCredentials();
  }, []);

  async function fetchCredentials() {
    try {
      const response = await fetch("/api/credentials");
      if (response.ok) {
        const data = await response.json();
        setCredentials(data.credentials || []);
      }
    } catch (error) {
      console.error("Failed to fetch credentials:", error);
    }
  }

  async function onSubmit(data: CredentialInput) {
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a file",
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("type", "credential");
      formData.append("credentialData", JSON.stringify(data));
      if (data.expiresAt) {
        formData.append("expiresAt", data.expiresAt);
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload credential");

      toast({
        title: "Success",
        description: "Credential uploaded successfully",
      });

      setIsDialogOpen(false);
      form.reset();
      setSelectedFile(null);
      fetchCredentials();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload credential",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credentials</h1>
          <p className="text-muted-foreground">
            Manage your professional credentials and certifications
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Upload Credential
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Credential</DialogTitle>
              <DialogDescription>
                Upload a new credential document
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="LICENSE">License</SelectItem>
                          <SelectItem value="CERTIFICATION">
                            Certification
                          </SelectItem>
                          <SelectItem value="INSURANCE">Insurance</SelectItem>
                          <SelectItem value="RESUME">Resume/CV</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Arizona BHP License" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>File</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) =>
                        setSelectedFile(e.target.files?.[0] || null)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    PDF, Word, or image files up to 10MB
                  </FormDescription>
                </FormItem>
                <FormField
                  control={form.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiration Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Public Credential</FormLabel>
                        <FormDescription>
                          Make this credential visible on your public profile
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Public</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credentials.map((credential) => {
                const status = getExpirationStatus(credential.expiresAt);
                return (
                  <TableRow key={credential.id}>
                    <TableCell className="font-medium">
                      {credential.name}
                    </TableCell>
                    <TableCell>{credential.type}</TableCell>
                    <TableCell>{formatDate(credential.uploadedAt)}</TableCell>
                    <TableCell>
                      {credential.expiresAt
                        ? formatDate(credential.expiresAt)
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          status === "valid"
                            ? "success"
                            : status === "expiring"
                            ? "warning"
                            : "danger"
                        }
                      >
                        {status === "valid"
                          ? "Valid"
                          : status === "expiring"
                          ? "Expiring Soon"
                          : "Expired"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {credential.isPublic ? (
                        <Badge variant="outline">Public</Badge>
                      ) : (
                        <Badge variant="secondary">Private</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <a
                          href={`/api/documents/download?key=${credential.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {credentials.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    No credentials uploaded yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
