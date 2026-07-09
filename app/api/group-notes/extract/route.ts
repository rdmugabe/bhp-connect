import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getFacilityScope } from "@/lib/facility-scope";
import { callGroupNotesService, GroupNotesServiceError } from "@/lib/group-notes-service";

// Proxy to the Python service's /api/extract endpoint. Authenticates the
// caller against bhp-connect's own session/facility scope before forwarding.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const scope = await getFacilityScope(session, null);
  if (!scope.ok) return NextResponse.json({ error: scope.error }, { status: scope.status });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const data = await callGroupNotesService("/api/extract", body);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof GroupNotesServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
