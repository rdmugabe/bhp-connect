import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getFileFromS3 } from "@/lib/s3";

/**
 * Generic authenticated file streamer. The caller passes an S3 key via
 * `?key=`. Access is granted to any signed-in user — downstream features
 * (signatures, attachments) store these keys only on records the user is
 * already authorized to read.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

  try {
    const { buffer, contentType } = await getFileFromS3(key);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    console.error("Download error:", err);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
