/**
 * Thin server-side client for the Group Notes Python (FastAPI) service.
 *
 * The Python service handles Claude extraction, per-session summary split,
 * .docx generation, and Google Drive upload. This bhp-connect side stays a
 * pure proxy: it authenticates the caller, forwards the payload with the
 * shared bearer token, and returns the raw response.
 */

const BASE_URL = process.env.GROUPNOTES_SERVICE_URL;
const TOKEN = process.env.GROUPNOTES_SERVICE_TOKEN;

export class GroupNotesServiceError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function isGroupNotesServiceConfigured(): boolean {
  return Boolean(BASE_URL && TOKEN);
}

export async function callGroupNotesService(
  path: string,
  body: unknown
): Promise<unknown> {
  if (!BASE_URL || !TOKEN) {
    throw new GroupNotesServiceError(
      503,
      "Group Notes service is not configured. Set GROUPNOTES_SERVICE_URL and GROUPNOTES_SERVICE_TOKEN."
    );
  }

  const url = `${BASE_URL.replace(/\/$/, "")}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify(body),
      // Never cache — every call carries fresh PHI.
      cache: "no-store",
    });
  } catch (err) {
    throw new GroupNotesServiceError(
      502,
      `Group Notes service unreachable: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // Non-JSON body (e.g. HTML error page) — surface as-is
      throw new GroupNotesServiceError(res.status, text.slice(0, 500));
    }
  }

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "detail" in data && typeof (data as { detail: unknown }).detail === "string"
        ? (data as { detail: string }).detail
        : `Group Notes service error (${res.status})`);
    throw new GroupNotesServiceError(res.status, message);
  }

  return data;
}
