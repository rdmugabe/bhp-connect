/**
 * Google Drive uploader for the group therapy note .docx files.
 *
 * Uses a service account (identity + JSON key stored in env) to upload
 * each generated .docx into a preconfigured shared folder. The service
 * account itself owns the file; staff read it via the shared folder.
 *
 * Env vars:
 *   GOOGLE_DRIVE_SA_KEY_JSON   — the full service-account JSON key,
 *                                 stringified. Read directly from .env
 *                                 to sidestep shell overrides.
 *   GROUP_NOTES_DRIVE_FOLDER_ID — the destination folder id (the part
 *                                 after "folders/" in the browser URL).
 */

import * as fs from "fs";
import * as path from "path";
import { google } from "googleapis";
import { Readable } from "stream";

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  project_id?: string;
}

function envFromDotenv(key: string): string {
  const envPath = path.join(process.cwd(), ".env");
  try {
    const contents = fs.readFileSync(envPath, "utf-8");
    // Support values quoted with single OR double quotes, and values that
    // themselves contain quotes and newlines (like a stringified JSON).
    const re = new RegExp(`^\\s*${key}\\s*=\\s*(['"])((?:\\\\.|(?!\\1)[^\\r])*)\\1\\s*$`, "m");
    const m = re.exec(contents);
    if (m) return m[2];
    // Fallback for unquoted values.
    const bare = new RegExp(`^\\s*${key}\\s*=\\s*(.+)$`, "m").exec(contents);
    if (bare) return bare[1].trim();
  } catch { /* fall through */ }
  return process.env[key] || "";
}

function readServiceAccountKey(): ServiceAccountKey | null {
  const raw = envFromDotenv("GOOGLE_DRIVE_SA_KEY_JSON");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ServiceAccountKey;
    if (!parsed.client_email || !parsed.private_key) return null;
    return parsed;
  } catch {
    return null;
  }
}

function readFolderId(): string {
  return envFromDotenv("GROUP_NOTES_DRIVE_FOLDER_ID");
}

export function isDriveConfigured(): boolean {
  return Boolean(readServiceAccountKey()) && Boolean(readFolderId());
}

export interface DriveUploadResult {
  filename: string;
  fileId: string;
  webViewLink: string;
}

export interface DriveUploadFailure {
  filename: string;
  error: string;
}

async function driveClient() {
  const key = readServiceAccountKey();
  if (!key) throw new Error("GOOGLE_DRIVE_SA_KEY_JSON is not configured.");
  // Normalize the PEM: convert any literal "\n" back to real newlines and
  // collapse any duplicate newlines that our env rewrite introduced around
  // the BEGIN/END markers. OpenSSL rejects a PEM with blank interior lines.
  const pem = key.private_key
    .replace(/\\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim() + "\n";
  const jwt = new google.auth.JWT({
    email: key.client_email,
    key: pem,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });
  await jwt.authorize();
  return google.drive({ version: "v3", auth: jwt });
}

/**
 * Upload a set of .docx buffers to the configured shared Drive folder.
 * Returns per-file results. Continues on individual failures so the
 * caller can report a partial success.
 */
export async function uploadDocxFilesToDrive(
  files: Array<{ filename: string; bytes: Uint8Array }>
): Promise<{ successes: DriveUploadResult[]; failures: DriveUploadFailure[]; folderId: string }> {
  const folderId = readFolderId();
  if (!folderId) throw new Error("GROUP_NOTES_DRIVE_FOLDER_ID is not configured.");
  if (files.length === 0) return { successes: [], folderId, failures: [] };

  const drive = await driveClient();
  const successes: DriveUploadResult[] = [];
  const failures: DriveUploadFailure[] = [];

  for (const f of files) {
    try {
      const bodyStream = Readable.from(Buffer.from(f.bytes));
      const res = await drive.files.create({
        requestBody: {
          name: f.filename,
          parents: [folderId],
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
        media: {
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          body: bodyStream,
        },
        fields: "id,webViewLink",
        supportsAllDrives: true,
      });
      const id = res.data.id;
      const webViewLink =
        res.data.webViewLink || (id ? `https://drive.google.com/file/d/${id}/view` : "");
      if (!id) {
        failures.push({ filename: f.filename, error: "Drive returned no file id" });
        continue;
      }
      successes.push({ filename: f.filename, fileId: id, webViewLink });
    } catch (err) {
      failures.push({
        filename: f.filename,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { successes, failures, folderId };
}

export function driveFolderLink(folderId: string): string {
  return `https://drive.google.com/drive/folders/${folderId}`;
}
