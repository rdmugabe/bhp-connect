import { NextRequest, NextResponse } from "next/server";

/**
 * Result type for safe JSON parsing
 */
export type JsonParseResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: NextResponse };

/**
 * Safely parse JSON from a request body.
 * Returns a proper 400 error for malformed JSON instead of letting it bubble up as 500.
 *
 * @param request - The NextRequest object
 * @returns JsonParseResult with either the parsed data or an error response
 *
 * @example
 * const result = await parseJsonBody(request);
 * if (!result.success) {
 *   return result.error;
 * }
 * const body = result.data;
 */
export async function parseJsonBody<T = unknown>(
  request: NextRequest
): Promise<JsonParseResult<T>> {
  try {
    const data = await request.json() as T;
    return { success: true, data };
  } catch (error) {
    // Check if it's a JSON parsing error
    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: NextResponse.json(
          { error: "Invalid JSON in request body" },
          { status: 400 }
        ),
      };
    }

    // Handle empty body or other read errors
    if (error instanceof TypeError && error.message.includes("body")) {
      return {
        success: false,
        error: NextResponse.json(
          { error: "Request body is required" },
          { status: 400 }
        ),
      };
    }

    // For any other unexpected error, still return 400 for client errors
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
 * Helper to check if a value is a plain object (not null, array, or other types)
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Validate that the parsed JSON body is a non-null object.
 * Useful when expecting a JSON object but the body could be any valid JSON.
 *
 * @param request - The NextRequest object
 * @returns JsonParseResult with either the parsed object or an error response
 */
export async function parseJsonObjectBody(
  request: NextRequest
): Promise<JsonParseResult<Record<string, unknown>>> {
  const result = await parseJsonBody(request);

  if (!result.success) {
    return result;
  }

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
