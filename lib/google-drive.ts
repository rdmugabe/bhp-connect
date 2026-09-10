/**
 * Google Drive uploader for the group therapy note .docx files.
 *
 * Uses a service account (identity + JSON key from env) to upload each
 * generated .docx into a preconfigured Shared Drive folder. Talks to the
 * Drive REST API via fetch — no full `googleapis` SDK, which bloats the
 * Next.js server bundle and OOM'd the Amplify build.
 *
 * Env vars:
 *   GOOGLE_DRIVE_SA_KEY_JSON   — full service-account JSON key,
 *                                stringified single line.
 *   GROUP_NOTES_DRIVE_FOLDER_ID — destination folder id (a folder in a
 *                                Shared Drive; My Drive folders don't
 *                                work because service accounts have no
 *                                storage quota).
 */

import * as fs from "fs";
import * as path from "path";
import { JWT } from "google-auth-library";

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

async function getAccessToken(): Promise<string> {
  const key = readServiceAccountKey();
  if (!key) throw new Error("GOOGLE_DRIVE_SA_KEY_JSON is not configured.");
  // Normalize the PEM: convert literal "\n" back to real newlines and collapse
  // any duplicate newlines (our env rewrite occasionally introduced blanks
  // around the BEGIN/END markers). OpenSSL rejects PEMs with blank lines.
  const pem =
    key.private_key
      .replace(/\\n/g, "\n")
      .replace(/\n{2,}/g, "\n")
      .trim() + "\n";
  const jwt = new JWT({
    email: key.client_email,
    key: pem,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });
  const res = await jwt.authorize();
  if (!res.access_token) throw new Error("JWT authorization returned no access_token");
  return res.access_token;
}

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

async function uploadOne(
  accessToken: string,
  folderId: string,
  file: { filename: string; bytes: Uint8Array }
): Promise<DriveUploadResult> {
  const metadata = {
    name: file.filename,
    parents: [folderId],
    mimeType: DOCX_MIME,
  };

  // Multipart upload per Drive REST API v3:
  // https://developers.google.com/workspace/drive/api/reference/rest/v3/files/create
  const boundary = `bhpc-boundary-${Math.random().toString(36).slice(2)}`;
  const delim = `--${boundary}\r\n`;
  const close = `\r\n--${boundary}--`;

  const head =
    delim +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    "\r\n" +
    delim +
    `Content-Type: ${DOCX_MIME}\r\n` +
    "Content-Transfer-Encoding: base64\r\n\r\n";

  const b64 = Buffer.from(file.bytes).toString("base64");

  const body = Buffer.concat([
    Buffer.from(head, "utf-8"),
    Buffer.from(b64, "utf-8"),
    Buffer.from(close, "utf-8"),
  ]);

  const url =
    "https://www.googleapis.com/upload/drive/v3/files?" +
    new URLSearchParams({
      uploadType: "multipart",
      supportsAllDrives: "true",
      fields: "id,webViewLink",
    }).toString();

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
      "Content-Length": String(body.byteLength),
    },
    body,
  });

  const text = await resp.text();
  let data: { id?: string; webViewLink?: string; error?: { message?: string } } = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Drive upload returned non-JSON (${resp.status}): ${text.slice(0, 200)}`);
  }
  if (!resp.ok) {
    throw new Error(data.error?.message || `Drive upload failed (${resp.status})`);
  }
  if (!data.id) throw new Error("Drive returned no file id");

  return {
    filename: file.filename,
    fileId: data.id,
    webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
  };
}

/**
 * Upload a set of .docx buffers to the configured Shared Drive folder.
 * Continues on individual failures; returns per-file results.
 */
export async function uploadDocxFilesToDrive(
  files: Array<{ filename: string; bytes: Uint8Array }>
): Promise<{ successes: DriveUploadResult[]; failures: DriveUploadFailure[]; folderId: string }> {
  const folderId = readFolderId();
  if (!folderId) throw new Error("GROUP_NOTES_DRIVE_FOLDER_ID is not configured.");
  if (files.length === 0) return { successes: [], folderId, failures: [] };

  const accessToken = await getAccessToken();
  const successes: DriveUploadResult[] = [];
  const failures: DriveUploadFailure[] = [];

  for (const f of files) {
    try {
      const r = await uploadOne(accessToken, folderId, f);
      successes.push(r);
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
