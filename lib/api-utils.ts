import { NextRequest, NextResponse } from "next/server";

// =====================================================
// JSON Body Parsing Utilities
// =====================================================

export type JsonParseResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: NextResponse };

/**
 * Safely parse JSON body from a request
 * Returns a 400 error for invalid JSON instead of letting it bubble up as 500
 */
export async function parseJsonBody<T = unknown>(
  request: NextRequest
): Promise<JsonParseResult<T>> {
  try {
    const data = (await request.json()) as T;
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

/**
 * Check if a value is a plain object (not array, not null)
 */
export function isPlainObject(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Safely parse JSON body and ensure it's an object
 */
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
