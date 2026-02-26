import { NextRequest, NextResponse } from "next/server";

export type JsonParseResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: NextResponse };

export async function parseJsonBody<T = unknown>(
  request: NextRequest
): Promise<JsonParseResult<T>> {
  try {
    const data = await request.json() as T;
    return { success: true, data };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: NextResponse.json(
          { error: "Invalid JSON in request body" },
          { status: 400 }
        ),
      };
    }
    if (error instanceof TypeError && error.message.includes("body")) {
      return {
        success: false,
        error: NextResponse.json(
          { error: "Request body is required" },
          { status: 400 }
        ),
      };
    }
    return {
      success: false,
      error: NextResponse.json(
        { error: "Failed to parse request body" },
        { status: 400 }
      ),
    };
  }
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function parseJsonObjectBody(
  request: NextRequest
): Promise<JsonParseResult<Record<string, unknown>>> {
  const result = await parseJsonBody(request);
  if (!result.success) return result;
  if (!isPlainObject(result.data)) {
    return {
      success: false,
      error: NextResponse.json(
        { error: "Request body must be a JSON object" },
        { status: 400 }
      ),
    };
  }
  return { success: true, data: result.data };
}
